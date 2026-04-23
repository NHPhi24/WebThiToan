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
    // Kiểm tra template
    const templateResult = await client.query('SELECT * FROM exam_templates WHERE id = $1', [t_id]);
    if (templateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Exam template not found' });
    }
    const template = templateResult.rows[0];
    const total = parseInt(template.total_questions);
    const basicCount = Math.round((template.basic_percent / 100) * total);
    const advancedCount = total - basicCount;

    // Lấy câu hỏi
    const basicQuestionsResult = await client.query('SELECT * FROM questions WHERE level = $1 ORDER BY RANDOM() LIMIT $2', ['0', basicCount]);
    const advancedQuestionsResult = await client.query('SELECT * FROM questions WHERE level = $1 ORDER BY RANDOM() LIMIT $2', ['1', advancedCount]);
    const questions = [...basicQuestionsResult.rows, ...advancedQuestionsResult.rows];
    if (questions.length < total) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Không đủ câu hỏi (Cần ${total}, có ${questions.length})` });
    }

    // Kiểm tra mã đề
    const codeCheck = await client.query('SELECT 1 FROM exams WHERE exam_code = $1', [e_code]);
    if (codeCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Mã đề đã tồn tại' });
    }

    // Tạo exam
    const examResult = await client.query('INSERT INTO exams (exam_code, template_id, teacher_id) VALUES ($1, $2, $3) RETURNING id', [
      e_code,
      t_id,
      tc_id,
    ]);
    const exam = examResult.rows[0];

    // Gán câu hỏi
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
