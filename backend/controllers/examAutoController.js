const db = require('../data/db');
const ExamQuestion = require('../entities/examQuestion');
const Question = require('../entities/question');

// Tạo đề thi tự động dựa trên cấu trúc đề thi
// POST /exams/auto-generate
// body: { template_id, teacher_id }
const autoGenerateExam = async (req, res) => {
  const { template_id, teacher_id } = req.body;
  try {
    // Lấy thông tin cấu trúc đề thi
    const templateResult = await db.query('SELECT * FROM exam_templates WHERE id = $1', [template_id]);
    if (templateResult.rowCount === 0) {
      return res.status(404).json({ error: 'Exam template not found' });
    }
    const template = templateResult.rows[0];
    const total = template.total_questions;
    const basicCount = Math.round((template.basic_percent / 100) * total);
    const advancedCount = total - basicCount;

    // Lấy câu hỏi cơ bản
    const basicQuestionsResult = await db.query('SELECT * FROM questions WHERE level = 1 AND teacher_id = $1 ORDER BY RANDOM() LIMIT $2', [
      teacher_id,
      basicCount,
    ]);
    // Lấy câu hỏi nâng cao
    const advancedQuestionsResult = await db.query('SELECT * FROM questions WHERE level = 2 AND teacher_id = $1 ORDER BY RANDOM() LIMIT $2', [
      teacher_id,
      advancedCount,
    ]);
    const questions = [...basicQuestionsResult.rows, ...advancedQuestionsResult.rows];
    if (questions.length < total) {
      return res.status(400).json({ error: 'Not enough questions to generate exam' });
    }

    // Tạo exam_code tự động
    const codeResult = await db.query('SELECT COUNT(*) FROM exams');
    const exam_code = `EX${(parseInt(codeResult.rows[0].count) + 1).toString().padStart(4, '0')}`;

    // Tạo exam
    const examResult = await db.query('INSERT INTO exams (exam_code, template_id, teacher_id) VALUES ($1, $2, $3) RETURNING *', [
      exam_code,
      template_id,
      teacher_id,
    ]);
    const exam = examResult.rows[0];

    // Gán câu hỏi vào exam_questions
    for (let i = 0; i < questions.length; i++) {
      await db.query('INSERT INTO exam_questions (exam_id, question_id, order_index) VALUES ($1, $2, $3)', [exam.id, questions[i].id, i + 1]);
    }

    res.status(201).json({ exam_id: exam.id, exam_code, questions: questions.map((q) => Question.fromRow(q)) });
  } catch (error) {
    console.error('autoGenerateExam error:', error);
    res.status(500).json({ error: 'Failed to auto generate exam' });
  }
};

module.exports = {
  autoGenerateExam,
};
