// Hàm phân tích mức độ tương đồng nâng cao giữa câu hỏi mới và danh sách câu hỏi đã tồn tại
// Trả về JSON theo format yêu cầu
const removeDiacritics = (str) => {
  if (!str || typeof str !== 'string') return '';
  return str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
};

function normalizeLatex(str) {
  if (!str || typeof str !== 'string') return '';
  // Đơn giản hóa: bỏ khoảng trắng, xuống dòng, chuẩn hóa ký hiệu
  return str
    .replace(/\\\s+/g, '\\') // bỏ khoảng trắng sau dấu \
    .replace(/\s+/g, ' ')
    .replace(/\{\s+/g, '{')
    .replace(/\s+\}/g, '}')
    .replace(/\^\s+/g, '^')
    .replace(/\s+\^/g, '^')
    .trim();
}

function normalizeAll(str) {
  if (!str || typeof str !== 'string') return '';
  return removeDiacritics(str)
    .replace(/20\d{2}/g, '') // bỏ năm
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9\\^_{}=+\-*/().,\s]/g, '')
    .toLowerCase()
    .trim();
}

function extractLatex(str) {
  if (!str || typeof str !== 'string') return [];
  // Tìm các biểu thức latex giữa $...$ hoặc \[...\]
  const matches = [];
  const regex = /\$([^$]+)\$|\\\[([^\]]+)\\\]/g;
  let m;
  while ((m = regex.exec(str))) {
    matches.push(m[1] || m[2]);
  }
  return matches;
}

function generalizeMathExpr(expr) {
  if (!expr || typeof expr !== 'string') return '';
  // Thay số, biến bằng ký hiệu chung
  return expr
    .replace(/\d+/g, '#') // mọi số thành #
    .replace(/[a-zA-Z]/g, 'x'); // mọi biến thành x
}

function detectConcept(str) {
  if (!str || typeof str !== 'string') return 'khác';
  // Đơn giản: dùng từ khóa để nhận diện concept
  const concepts = [
    { key: 'đạo hàm', kw: ['đạo hàm', 'tính đạo hàm', 'differenti', 'derivative'] },
    { key: 'tích phân', kw: ['tích phân', 'integral', 'tính tích phân'] },
    { key: 'logarit', kw: ['logarit', 'log', 'ln'] },
    { key: 'hình học', kw: ['hình học', 'geometry', 'tam giác', 'hình tròn', 'hình vuông', 'hình hộp'] },
    { key: 'xác suất', kw: ['xác suất', 'probability'] },
    { key: 'số phức', kw: ['số phức', 'complex'] },
    { key: 'phương trình', kw: ['phương trình', 'equation', 'giải phương trình'] },
    { key: 'bất phương trình', kw: ['bất phương trình', 'inequality'] },
    { key: 'hàm số', kw: ['hàm số', 'function'] },
    { key: 'hệ phương trình', kw: ['hệ phương trình', 'system of equations'] },
    { key: 'tổ hợp', kw: ['tổ hợp', 'combinatorics'] },
    { key: 'dãy số', kw: ['dãy số', 'sequence'] },
    { key: 'ma trận', kw: ['ma trận', 'matrix'] },
    { key: 'giới hạn', kw: ['giới hạn', 'limit'] },
    { key: 'hàm hợp', kw: ['hàm hợp', 'composite function'] },
  ];
  const lower = str.toLowerCase();
  for (const c of concepts) {
    if (c.kw.some((kw) => lower.includes(kw))) return c.key;
  }
  return 'khác';
}

function isParameterOnlyChange(str1, str2) {
  // Nếu chỉ khác số, năm, tên biến
  const s1 = str1
    .replace(/20\d{2}/g, '')
    .replace(/\d+/g, '#')
    .replace(/[a-zA-Z]/g, 'x');
  const s2 = str2
    .replace(/20\d{2}/g, '')
    .replace(/\d+/g, '#')
    .replace(/[a-zA-Z]/g, 'x');
  return s1 === s2;
}

// Hàm chính phân tích tương đồng
async function analyzeQuestionSimilarity(newQuestion, existingQuestions) {
  // Normalize
  const normNew = normalizeAll(newQuestion.content);
  const latexNewArr = extractLatex(newQuestion.content).map(normalizeLatex);
  const conceptNew = detectConcept(newQuestion.content);

  let best = null;
  let bestScore = 0;
  let bestResult = null;

  for (const q of existingQuestions) {
    const normQ = normalizeAll(q.content);
    const latexQArr = extractLatex(q.content).map(normalizeLatex);
    const conceptQ = detectConcept(q.content);

    // Exact match
    if (normNew === normQ) {
      bestResult = {
        similarity_score: 100,
        semantic_similarity: 100,
        latex_similarity: 100,
        template_similarity: 100,
        change_type: 'none',
        concept: conceptQ,
        decision: 'reject',
        reason: 'Exact match after normalization',
        matched_question_id: q.id,
      };
      return bestResult;
    }

    // Template match (so sánh latex structure)
    let latexSim = 0;
    let templateSim = 0;
    if (latexNewArr.length && latexQArr.length) {
      // So sánh từng latex expr
      for (const l1 of latexNewArr) {
        for (const l2 of latexQArr) {
          if (generalizeMathExpr(l1) === generalizeMathExpr(l2)) {
            latexSim = 100;
            templateSim = 100;
          }
        }
      }
    }

    // Parameter only change
    let change_type = 'structure_changed';
    if (isParameterOnlyChange(normNew, normQ)) {
      change_type = 'parameter_only';
    }

    // Semantic similarity (dùng text-similarity đơn giản, có thể thay bằng AI embedding)
    let semanticSim = 0;
    if (typeof stringSimilarity !== 'undefined') {
      semanticSim = Math.round(stringSimilarity.compareTwoStrings(normNew, normQ) * 100);
    }

    // Tổng hợp điểm
    let simScore = Math.max(latexSim, templateSim, semanticSim);
    if (conceptNew === conceptQ) simScore = Math.max(simScore, 80);

    // Quyết định
    let decision = 'allow';
    let reason = '';

    // Quyết định duy nhất, không chồng lấn
    if (latexSim === 100 && change_type === 'none') {
      decision = 'reject';
      reason = 'Template and parameters match exactly';
    } else if (change_type === 'parameter_only') {
      decision = 'warning';
      // reason = 'Câu hỏi này chỉ khác biến hoặc số so với câu hỏi đã có trong ngân hàng. Bạn có chắc chắn muốn thêm/sửa không?';
    } else if (semanticSim >= 90 && conceptNew === conceptQ) {
      decision = 'warning';
      reason = 'High semantic similarity and same concept';
    } else {
      decision = 'allow';
      reason = 'Different concept or low similarity';
    }

    // Ưu tiên reject > warning > allow
    if (!bestResult || decision === 'reject' || (decision === 'warning' && bestResult.decision !== 'reject')) {
      bestResult = {
        similarity_score: simScore,
        semantic_similarity: semanticSim,
        latex_similarity: latexSim,
        template_similarity: templateSim,
        change_type,
        concept: conceptQ,
        decision,
        reason,
        matched_question_id: q.id,
      };
      if (decision === 'reject') return bestResult;
    }
  }
  // Nếu không có câu nào trùng đáng kể
  if (!bestResult) {
    return {
      similarity_score: 0,
      semantic_similarity: 0,
      latex_similarity: 0,
      template_similarity: 0,
      change_type: 'none',
      concept: conceptNew,
      decision: 'allow',
      reason: 'No significant match',
      matched_question_id: null,
    };
  }
  return bestResult;
}
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

// Chuẩn hóa nội dung: bỏ năm, ký tự đặc biệt, giữ số
function normalizeContent(content) {
  return content
    .replace(/20\d{2}/g, '') // bỏ năm
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .toLowerCase()
    .trim();
}

// Chuẩn hóa cho toán học: thay mọi số bằng ký tự #
function normalizeContentForMath(content) {
  return content
    .replace(/20\d{2}/g, '') // bỏ năm
    .replace(/\d+/g, '#') // thay mọi số bằng #
    .replace(/\s+/g, ' ')
    .replace(/[^a-zA-Z#\s]/g, '') // giữ chữ, #, khoảng trắng
    .toLowerCase()
    .trim();
}

// Kiểm tra tương đồng nâng cao cho toán học
async function checkSimilarQuestions(content, excludeId = null) {
  const norm = normalizeContent(content);
  const normMath = normalizeContentForMath(content);
  let query = 'SELECT * FROM questions';
  let params = [];
  if (excludeId) {
    query += ' WHERE id != $1';
    params.push(excludeId);
  }
  const result = await db.query(query, params);
  // 1. Trùng hoàn toàn (kể cả số): không cho phép
  const exact = result.rows.find((q) => normalizeContent(q.content) === norm);
  if (exact) {
    return { type: 'exact', question: exact };
  }
  // 2. Trùng cấu trúc toán học (chỉ khác số): cảnh báo nhẹ, vẫn cho phép thêm
  const mathStruct = result.rows.find((q) => normalizeContentForMath(q.content) === normMath);
  if (mathStruct) {
    return { type: 'math_struct', question: mathStruct };
  }
  // 3. Tương đồng >80% (so sánh thường)
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
  const { id, teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade } = req.body;
  try {
    if (id) {
      // Nếu có id, cập nhật
      const result = await db.query(
        `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9, grade=$10 WHERE id=$11 RETURNING *`,
        [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade, id],
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Question not found' });
      await createAuditLog({
        actor_id: req.body.actor_id || teacher_id || null,
        created_by: req.body.created_by || req.body.actor_username || null,
        action: 'UPDATE',
        resource_type: 'question',
        resource_id: id,
        resource_name: content?.slice(0, 80) || null,
        details: { level, grade, teacher_id, correct_ans },
      });
      return res.json(Question.fromRow(result.rows[0]));
    } else {
      // Không có id, thêm mới
      // Lấy toàn bộ câu hỏi để kiểm tra tương đồng nâng cao
      const allQuestions = await db.query('SELECT * FROM questions');
      const simResult = await analyzeQuestionSimilarity({ content }, allQuestions.rows);
      if (simResult.decision === 'reject') {
        return res.status(409).json({
          error: 'Câu hỏi này bị từ chối do tương đồng với câu hỏi khác!',
          code: 'DUPLICATE_CONTENT',
          similarity: simResult,
        });
      }
      if (simResult.decision === 'warning') {
        // Làm sạch nội dung header: chỉ giữ ký tự ASCII printable, cắt tối đa 200 ký tự
        let warningMsg = simResult.reason || 'Câu hỏi tương đồng dạng bài với câu hỏi khác.';
        warningMsg = warningMsg.replace(/[^\x20-\x7E]+/g, ' ').slice(0, 200);
        res.set('X-Warning', warningMsg);
      }
      // Cho phép thêm nếu allow hoặc warning
      const result = await db.query(
        `INSERT INTO questions (teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade],
      );
      await createAuditLog({
        actor_id: req.body.actor_id || teacher_id || null,
        created_by: req.body.created_by || req.body.actor_username || null,
        action: 'CREATE',
        resource_type: 'question',
        resource_id: result.rows[0].id?.toString() || null,
        resource_name: result.rows[0].content?.slice(0, 80) || null,
        details: { level, grade, teacher_id, correct_ans },
      });
      // Trả về cả thông tin similarity cho FE xử lý
      return res.status(201).json({
        question: Question.fromRow(result.rows[0]),
        similarity: simResult,
      });
    }
  } catch (error) {
    console.error('createQuestion error:', error);
    if (error && error.stack) console.error('Stack:', error.stack);
    if (error && error.message) console.error('Message:', error.message);
    res.status(500).json({ error: 'Failed to create or update question', details: error && error.message });
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
  const { teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade } = req.body;
  try {
    // Lấy toàn bộ câu hỏi trừ chính nó để kiểm tra tương đồng nâng cao
    const allQuestions = await db.query('SELECT * FROM questions WHERE id != $1', [id]);
    const simResult = await analyzeQuestionSimilarity({ content }, allQuestions.rows);
    if (simResult.decision === 'reject') {
      return res.status(409).json({
        error: 'Câu hỏi này bị từ chối do tương đồng với câu hỏi khác!',
        code: 'DUPLICATE_CONTENT',
        similarity: simResult,
      });
    }
    if (simResult.decision === 'warning') {
      let warningMsg = simResult.reason || 'Câu hỏi tương đồng dạng bài với câu hỏi khác.';
      warningMsg = warningMsg.replace(/[^\x20-\x7E]+/g, ' ').slice(0, 200);
      res.set('X-Warning', warningMsg);
    }
    // Cho phép update nếu allow hoặc warning
    const result = await db.query(
      `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9, grade=$10 WHERE id=$11 RETURNING *`,
      [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade, id],
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
      details: { level, grade, teacher_id, correct_ans },
    });
    // Trả về cả thông tin similarity cho FE xử lý
    res.json({
      question: Question.fromRow(result.rows[0]),
      similarity: simResult,
    });
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
    const mathStruct = [];
    for (const row of rows) {
      const { teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade } = row;
      if (!teacher_id || !content || !ans_a || !ans_b || !ans_c || !ans_d || !correct_ans || !level) continue;
      const check = await checkSimilarQuestions(content);
      if (check.type === 'exact') {
        // Nếu chỉ khác năm, ghi đè
        const oldId = check.question.id;
        const result = await db.query(
          `UPDATE questions SET teacher_id=$1, content=$2, ans_a=$3, ans_b=$4, ans_c=$5, ans_d=$6, correct_ans=$7, explanation=$8, level=$9, grade=$10 WHERE id=$11 RETURNING *`,
          [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade, oldId],
        );
        inserted.push(result.rows[0]);
      } else if (check.type === 'similar') {
        skipped.push({
          content,
          reason: 'Câu hỏi này đã tồn tại trong ngân hàng (nội dung tương đồng)!',
        });
        continue;
      } else if (check.type === 'math_struct') {
        mathStruct.push({
          row,
          warning: 'Câu hỏi này có cấu trúc toán học giống với câu hỏi khác, chỉ khác số.',
        });
        continue;
      } else {
        const result = await db.query(
          `INSERT INTO questions (teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           RETURNING *`,
          [teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade],
        );
        inserted.push(result.rows[0]);
      }
    }
    res.json({ insertedCount: inserted.length, inserted, skipped, mathStruct });
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
      const { content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade } = row;
      // BỎ kiểm tra thiếu trường bắt buộc, vẫn cho phép import dòng thiếu trường
      const similars = await checkSimilarQuestions(content);
      if (similars.length === 1) {
        // Nếu chỉ khác năm, ghi đè
        const oldId = similars[0].id;
        const result = await db.query(
          `UPDATE questions SET content=$1, ans_a=$2, ans_b=$3, ans_c=$4, ans_d=$5, correct_ans=$6, explanation=$7, level=$8, grade=$9 WHERE id=$10 RETURNING *`,
          [content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade, oldId],
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
          `INSERT INTO questions (content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING *`,
          [content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, grade],
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
    const headers = ['content', 'ans_a', 'ans_b', 'ans_c', 'ans_d', 'correct_ans', 'explanation', 'level', 'grade'];
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
