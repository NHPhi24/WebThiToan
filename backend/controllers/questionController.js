const db = require('../data/db');
const Question = require('../entities/question');
const { createAuditLog } = require('../data/auditLog');
const stringSimilarity = require('string-similarity');

const getAllQuestions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM questions ORDER BY created_at DESC');
    const questions = result.rows.map(Question.fromRow);
    res.json(questions);
  } catch (error) {
    console.error('getAllQuestions error:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};

// Hàm kiểm tra tương đồng nội dung câu hỏi
function normalizeContent(content) {
  // Loại bỏ các số năm (2020-2099), khoảng trắng, ký tự đặc biệt, chuyển về chữ thường
  return content
    .replace(/20\d{2}/g, '') // bỏ năm
    .replace(/\s+/g, ' ') // giữ lại khoảng trắng đơn để tách từ
    .replace(/[^a-zA-Z0-9\s]/g, '') // bỏ ký tự đặc biệt, giữ khoảng trắng
    .toLowerCase()
    .trim();
}

async function checkSimilarQuestions(content, excludeId = null) {
  // Lấy tất cả câu hỏi để so sánh
  const norm = normalizeContent(content);
  let query = 'SELECT * FROM questions';
  let params = [];
  if (excludeId) {
    query += ' WHERE id != $1';
    params.push(excludeId);
  }
  const result = await db.query(query, params);
  // Tìm câu hỏi giống hệt (chỉ khác năm)
  const exact = result.rows.find((q) => normalizeContent(q.content) === norm);
  if (exact) {
    return { type: 'exact', question: exact };
  }
  // Dùng string-similarity để so sánh tương đồng > 80%
  const similar = result.rows.find((q) => {
    const normQ = normalizeContent(q.content);
    const similarity = stringSimilarity.compareTwoStrings(norm, normQ);
    return similarity >= 0.8;
  });
  if (similar) {
    return { type: 'similar', question: similar };
  }
  return { type: 'none' };
}

const createQuestion = async (req, res) => {
  const { id, teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level } = req.body;
  try {
    if (id) {
      // Nếu có id, cập nhật
      const result = await db.query(
        `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9 WHERE id=$10 RETURNING *`,
        [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, id],
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
      await createAuditLog({
        actor_id: req.body.actor_id || teacher_id || null,
        created_by: req.body.created_by || req.body.actor_username || null,
        action: 'UPDATE',
        resource_type: 'question',
        resource_id: id,
        resource_name: content?.slice(0, 80) || null,
        details: { level, teacher_id, correct_ans },
      });
      return res.json(Question.fromRow(result.rows[0]));
    } else {
      // Không có id, thêm mới
      // Kiểm tra tương đồng nội dung trước khi thêm
      const check = await checkSimilarQuestions(content);
      if (check.type === 'exact') {
        return res.status(409).json({
          error: 'Câu hỏi này đã tồn tại, chỉ khác năm!',
          code: 'CONFIRM_YEAR_DIFF',
          question: check.question, // trả về bản gốc để FE hiển thị so sánh
        });
      }
      if (check.type === 'similar') {
        return res.status(409).json({
          error: 'Câu hỏi này đã tồn tại trong ngân hàng (nội dung tương đồng)!',
          code: 'DUPLICATE_CONTENT',
        });
      }
      const result = await db.query(
        `INSERT INTO questions (teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level],
      );
      await createAuditLog({
        actor_id: req.body.actor_id || teacher_id || null,
        created_by: req.body.created_by || req.body.actor_username || null,
        action: 'CREATE',
        resource_type: 'question',
        resource_id: result.rows[0].id?.toString() || null,
        resource_name: result.rows[0].content?.slice(0, 80) || null,
        details: { level, teacher_id, correct_ans },
      });
      return res.status(201).json(Question.fromRow(result.rows[0]));
    }
  } catch (error) {
    console.error('createQuestion error:', error);
    res.status(500).json({ error: 'Failed to create or update question' });
  }
};

// Lấy câu hỏi theo id
const getQuestionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM questions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json(Question.fromRow(result.rows[0]));
  } catch (error) {
    console.error('getQuestionById error:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
};

const updateQuestion = async (req, res) => {
  const { id } = req.params;
  const { teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level } = req.body;
  try {
    // Kiểm tra tương đồng nội dung trước khi update
    const check = await checkSimilarQuestions(content, id);
    if (check.type === 'similar') {
      return res.status(409).json({
        error: 'Câu hỏi này đã tồn tại trong ngân hàng (nội dung tương đồng)!',
        code: 'DUPLICATE_CONTENT',
      });
    }
    // Nếu chỉ khác năm hoặc không trùng, cho phép update
    const result = await db.query(
      `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9 WHERE id=$10 RETURNING *`,
      [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE',
      resource_type: 'question',
      resource_id: id,
      resource_name: content?.slice(0, 80) || null,
      details: { level, teacher_id, correct_ans },
    });
    res.json(Question.fromRow(result.rows[0]));
  } catch (error) {
    console.error('updateQuestion error:', error);
    res.status(500).json({ error: 'Failed to update question' });
  }
};

const deleteQuestion = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM questions WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Question not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'DELETE',
      resource_type: 'question',
      resource_id: id,
      resource_name: result.rows[0].content?.slice(0, 80) || null,
      details: {},
    });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('deleteQuestion error:', error);
    res.status(500).json({ error: 'Failed to delete question' });
  }
};

const xlsx = require('xlsx');

const importQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const inserted = [];
    const skipped = [];
    for (const row of rows) {
      const { teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level } = row;
      if (!teacher_id || !content || !ans_a || !ans_b || !ans_c || !ans_d || !correct_ans || !level) continue;
      const check = await checkSimilarQuestions(content);
      if (check.type === 'exact') {
        // Nếu chỉ khác năm, ghi đè
        const oldId = check.question.id;
        const result = await db.query(
          `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9 WHERE id=$10 RETURNING *`,
          [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, oldId],
        );
        inserted.push(result.rows[0]);
      } else if (check.type === 'similar') {
        skipped.push({
          content,
          reason: 'Câu hỏi này đã tồn tại trong ngân hàng (nội dung tương đồng)!',
        });
        continue;
      } else {
        const result = await db.query(
          `INSERT INTO questions (teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level],
        );
        inserted.push(result.rows[0]);
      }
    }
    res.json({ insertedCount: inserted.length, inserted, skipped });
  } catch (error) {
    console.error('importQuestionsFromExcel error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
  }
};

module.exports = {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  importQuestionsFromExcel,
  getQuestionById,
};

// Nhập hàng loạt câu hỏi từ Excel

module.exports.importQuestionsFromExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);
    const inserted = [];
    const skipped = [];

    // Đếm số lượng câu hỏi trùng
    let duplicateCount = 0;
    for (const row of rows) {
      const { content } = row;
      if (!content) continue;
      const similars = await checkSimilarQuestions(content);
      if (similars.length > 0) duplicateCount++;
    }
    const percent = (duplicateCount / rows.length) * 100;
    let warning = null;
    if (percent > 80) {
      warning = `Tỷ lệ câu hỏi trùng lặp (${percent.toFixed(1)}%) vượt quá 80%. Chỉ import các câu hợp lệ.`;
    }

    // Luôn tiến hành import từng phần
    for (const row of rows) {
      const { content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level } = row;
      // BỎ kiểm tra thiếu trường bắt buộc, vẫn cho phép import dòng thiếu trường
      const similars = await checkSimilarQuestions(content);
      if (similars.length === 1) {
        // Nếu chỉ khác năm, ghi đè
        const oldId = similars[0].id;
        const result = await db.query(
          `UPDATE questions SET content=$1, ans_a=$2, ans_b=$3, ans_c=$4, ans_d=$5, correct_ans=$6, explanation=$7, level=$8 WHERE id=$9 RETURNING *`,
          [content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, oldId],
        );
        inserted.push(result.rows[0]);
      } else if (similars.length === 2) {
        skipped.push({
          content,
          reason: 'Đã có 2 câu hỏi tương đồng nội dung này!',
        });
        continue;
      } else if (similars.length > 2) {
        skipped.push({
          content,
          reason: 'Câu hỏi này đã tồn tại nhiều bản tương đồng!',
        });
        continue;
      } else {
        const result = await db.query(
          `INSERT INTO questions (content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level],
        );
        inserted.push(result.rows[0]);
      }
    }
    res.json({
      insertedCount: inserted.length,
      inserted,
      skipped,
      warning,
    });
  } catch (error) {
    console.error('importQuestionsFromExcel error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
  }
};

// Xuất file mẫu Excel để nhập hàng loạt
module.exports.exportQuestionsTemplate = (req, res) => {
  try {
    const headers = ['content', 'ans_a', 'ans_b', 'ans_c', 'ans_d', 'correct_ans', 'explanation', 'level'];
    const ws = xlsx.utils.aoa_to_sheet([headers]);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'QuestionsTemplate');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=questions_template.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('exportQuestionsTemplate error:', error);
    res.status(500).json({ error: 'Failed to export template' });
  }
};
