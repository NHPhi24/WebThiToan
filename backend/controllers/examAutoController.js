const db = require('../data/db');
const Question = require('../entities/question');

const autoGenerateExam = async (req, res) => {
  let { template_id, teacher_id, exam_code } = req.body;
  const t_id = parseInt(template_id);
  const tc_id = parseInt(teacher_id);
  const e_code = String(exam_code);

  if (isNaN(t_id) || isNaN(tc_id) || !e_code) {
    return res.status(400).json({ error: 'Thiếu dữ liệu đầu vào hoặc dữ liệu không hợp lệ' });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');
    const templateResult = await client.query('SELECT * FROM exam_templates WHERE id = $1', [t_id]);
    if (templateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam template not found' });
    }
    const template = templateResult.rows[0];
    const total = parseInt(template.total_questions);
    const grade = template.grade;
    // Allow mixing lower-grade questions for higher-grade exams:
    // grade 10 -> [10]
    // grade 11 -> [11, 10]
    // grade 12 -> [12, 11, 10]
    const gradeNum = Number(grade);
    let allowedGrades = [];
    if (gradeNum === 10) allowedGrades = [10];
    else if (gradeNum === 11) allowedGrades = [11, 10];
    else if (gradeNum === 12) allowedGrades = [12, 11, 10];
    else allowedGrades = [gradeNum];

    const selected = [];
    const selectedIds = new Set();
    const shortages = []; // collect topic/level shortages when selection mode requests more than available

    // 1) Nếu có cấu trúc selection: lấy cố định theo từng topic
    if (template.structure && template.structure.mode === 'selection' && Array.isArray(template.structure.items)) {
      for (const it of template.structure.items) {
        const topic = it.topic;
        const needBasic = Math.max(0, Number(it.basic || 0));
        const needAdvanced = Math.max(0, Number(it.advanced || 0));

        // Lấy cơ bản
        if (needBasic > 0) {
          const exclude = Array.from(selectedIds);
          let qtext = `SELECT * FROM questions WHERE topic = $1 AND level = $2 AND grade = ANY($3)`;
          const params = [topic, 0, allowedGrades];
          if (exclude.length > 0) {
            const placeholders = exclude.map((_, i) => `$${i + 4}`).join(',');
            qtext += ` AND id NOT IN (${placeholders})`;
            params.push(...exclude);
          }
          qtext += ` ORDER BY RANDOM() LIMIT ${needBasic}`;
          const resB = await client.query(qtext, params);
          for (const q of resB.rows) {
            if (!selectedIds.has(q.id)) {
              selected.push(q);
              selectedIds.add(q.id);
            }
          }
          if (resB.rowCount < needBasic) {
            console.warn(`Not enough basic questions for topic=${topic}, requested=${needBasic}, got=${resB.rowCount}`);
            shortages.push({ topic, level: 0, requested: needBasic, got: resB.rowCount });
          }
        }

        // Lấy nâng cao
        if (needAdvanced > 0) {
          const exclude = Array.from(selectedIds);
          let qtext = `SELECT * FROM questions WHERE topic = $1 AND level = $2 AND grade = ANY($3)`;
          const params = [topic, 1, allowedGrades];
          if (exclude.length > 0) {
            const placeholders = exclude.map((_, i) => `$${i + 4}`).join(',');
            qtext += ` AND id NOT IN (${placeholders})`;
            params.push(...exclude);
          }
          qtext += ` ORDER BY RANDOM() LIMIT ${needAdvanced}`;
          const resA = await client.query(qtext, params);
          for (const q of resA.rows) {
            if (!selectedIds.has(q.id)) {
              selected.push(q);
              selectedIds.add(q.id);
            }
          }
          if (resA.rowCount < needAdvanced) {
            console.warn(`Not enough advanced questions for topic=${topic}, requested=${needAdvanced}, got=${resA.rowCount}`);
            shortages.push({ topic, level: 1, requested: needAdvanced, got: resA.rowCount });
          }
        }
      }
    }

    // If in selection mode we detected shortages and the client did not confirm fallback,
    // abort and return details so the UI can ask user confirmation.
    const clientConfirmed = !!req.body.confirmFallback;
    if (shortages.length > 0 && !clientConfirmed) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Not enough questions for requested topics/levels', shortages });
    }

    // 2) Tính phần còn lại và phân bổ theo %
    const remaining = Math.max(0, total - selected.length);
    let remainingBasic = 0;
    let remainingAdvanced = 0;
    if (remaining > 0) {
      const basePercent = template.basic_percent != null ? Number(template.basic_percent) : 70;
      const targetForPercent = template.structure && template.structure.mode === 'selection' ? remaining : total;
      const basicTarget = Math.round((basePercent / 100) * targetForPercent);

      if (template.structure && template.structure.mode === 'selection') {
        remainingBasic = Math.min(remaining, basicTarget);
        remainingAdvanced = remaining - remainingBasic;
      } else {
        const alreadyBasic = selected.filter((q) => Number(q.level) === 0).length;
        remainingBasic = Math.max(0, basicTarget - alreadyBasic);
        if (remainingBasic > remaining) remainingBasic = remaining;
        remainingAdvanced = remaining - remainingBasic;
      }
    }

    // helper: fetch by level excluding selectedIds
    const fetchByLevel = async (level, limit) => {
      if (limit <= 0) return [];
      const excludeIds = Array.from(selectedIds);
      let qtext = `SELECT * FROM questions WHERE level = $1 AND grade = ANY($2)`;
      const params = [level, allowedGrades];
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map((_, i) => `$${i + 3}`).join(',');
        qtext += ` AND id NOT IN (${placeholders})`;
        params.push(...excludeIds);
      }
      qtext += ` ORDER BY RANDOM() LIMIT ${limit}`;
      const r = await client.query(qtext, params);
      return r.rows;
    };

    // helper: fetch by level and topics (prefer topics), fallback to any same-grade if not enough
    const fetchByLevelAndTopics = async (level, limit, topics = []) => {
      if (limit <= 0) return [];
      const excludeIds = Array.from(selectedIds);
      // First try to fetch from given topics
      if (Array.isArray(topics) && topics.length > 0) {
        const topicPlaceholders = topics.map((_, i) => `$${i + 3}`).join(',');
        let qtext = `SELECT * FROM questions WHERE level = $1 AND grade = ANY($2) AND topic IN (${topicPlaceholders})`;
        const params = [level, allowedGrades, ...topics];
        if (excludeIds.length > 0) {
          const excludePlaceholders = excludeIds.map((_, i) => `$${i + 3 + topics.length}`).join(',');
          qtext += ` AND id NOT IN (${excludePlaceholders})`;
          params.push(...excludeIds);
        }
        qtext += ` ORDER BY RANDOM() LIMIT ${limit}`;
        const r = await client.query(qtext, params);
        const rows = r.rows;
        if (rows.length >= limit) return rows;
        // otherwise collect and fall back to generic fetch for remaining
        const gotIds = rows.map((r) => r.id);
        gotIds.forEach((id) => selectedIds.add(id));
        const remaining = limit - rows.length;
        const more = await fetchByLevel(level, remaining);
        return rows.concat(more);
      }
      return fetchByLevel(level, limit);
    };

    if (remaining > 0 && template.structure && Array.isArray(template.structure.items)) {
      // collect topics defined in template
      const templateTopics = template.structure.items.map((it) => it.topic).filter(Boolean);
      // keep only topics that actually have questions for this grade (prevent using topics from other grades)
      let templateTopicsFiltered = templateTopics;
      if (templateTopicsFiltered.length > 0) {
        const topicCheckRes = await client.query(`SELECT DISTINCT topic FROM questions WHERE topic = ANY($1) AND grade = ANY($2)`, [
          templateTopicsFiltered,
          allowedGrades,
        ]);
        templateTopicsFiltered = topicCheckRes.rows.map((r) => r.topic);
      }
      if (remainingBasic > 0) {
        const rowsB = await fetchByLevelAndTopics(0, remainingBasic, templateTopicsFiltered);
        for (const q of rowsB) {
          if (!selectedIds.has(q.id)) {
            selected.push(q);
            selectedIds.add(q.id);
          }
        }
      }
      if (remainingAdvanced > 0) {
        const rowsA = await fetchByLevelAndTopics(1, remainingAdvanced, templateTopicsFiltered);
        for (const q of rowsA) {
          if (!selectedIds.has(q.id)) {
            selected.push(q);
            selectedIds.add(q.id);
          }
        }
      }
    } else {
      if (remainingBasic > 0) {
        const rowsB = await fetchByLevel(0, remainingBasic);
        for (const q of rowsB) {
          if (!selectedIds.has(q.id)) {
            selected.push(q);
            selectedIds.add(q.id);
          }
        }
      }
      if (remainingAdvanced > 0) {
        const rowsA = await fetchByLevel(1, remainingAdvanced);
        for (const q of rowsA) {
          if (!selectedIds.has(q.id)) {
            selected.push(q);
            selectedIds.add(q.id);
          }
        }
      }
    }

    // 3) Nếu vẫn thiếu, lấy bất kỳ câu nào cùng khối lớp (grade)
    if (selected.length < total) {
      const need = total - selected.length;
      const excludeIds = Array.from(selectedIds);
      let qtext = `SELECT * FROM questions WHERE grade = ANY($1)`;
      const params = [allowedGrades];
      if (excludeIds.length > 0) {
        const placeholders = excludeIds.map((_, i) => `$${i + 2}`).join(',');
        qtext += ` AND id NOT IN (${placeholders})`;
        params.push(...excludeIds);
      }
      qtext += ` ORDER BY RANDOM() LIMIT ${need}`;
      const r = await client.query(qtext, params);
      for (const q of r.rows) {
        if (!selectedIds.has(q.id)) {
          selected.push(q);
          selectedIds.add(q.id);
        }
      }
    }

    if (selected.length < total) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Không đủ câu hỏi lớp ${grade} (Cần ${total}, có ${selected.length})` });
    }

    const questions = selected.slice(0, total);

    // Kiểm tra mã đề
    const codeCheck = await client.query('SELECT 1 FROM exams WHERE exam_code = $1', [e_code]);
    if (codeCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Mã đề đã tồn tại' });
    }

    const examResult = await client.query('INSERT INTO exams (exam_code, template_id, teacher_id, grade) VALUES ($1, $2, $3, $4) RETURNING id', [
      e_code,
      t_id,
      tc_id,
      grade,
    ]);
    const exam = examResult.rows[0];

    for (let i = 0; i < questions.length; i++) {
      await client.query('INSERT INTO exam_questions (exam_id, question_id, order_index) VALUES ($1, $2, $3)', [exam.id, questions[i].id, i + 1]);
    }

    await client.query('COMMIT');
    res.status(201).json({
      exam_id: exam.id,
      exam_code: e_code,
      questions: questions.map((q) => Question.fromRow(q)),
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('autoGenerateExam error:', error);
    res.status(500).json({ error: 'Failed to auto generate exam', detail: error.message });
  } finally {
    client.release();
  }
};

module.exports = {
  autoGenerateExam,
};
