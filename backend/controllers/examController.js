const db = require('../data/db');
const Exam = require('../entities/exam');
const Question = require('../entities/question');
const { createAuditLog } = require('../data/auditLog');

const getAllExams = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exams ORDER BY created_at DESC');
    const exams = result.rows.map(Exam.fromRow);
    res.json(exams);
  } catch (error) {
    console.error('getAllExams error:', error);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
};

// API: GET /exams/:id/questions
const getQuestionsByExamId = async (req, res) => {
  const examId = req.params.id;
  try {
    const result = await db.query(
      `SELECT q.* , eq.order_index FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = $1 ORDER BY eq.order_index ASC`,
      [examId],
    );
    const questions = result.rows.map((row) => ({ ...Question.fromRow(row), order_index: row.order_index }));
    res.json(questions);
  } catch (error) {
    console.error('getQuestionsByExamId error:', error);
    res.status(500).json({ error: 'Failed to fetch questions for exam' });
  }
};

// Xóa đề thi
const deleteExam = async (req, res) => {
  const { id } = req.params;
  try {
    // Xóa các câu hỏi liên kết với đề thi này (nếu có)
    await db.query('DELETE FROM exam_questions WHERE exam_id = $1', [id]);
    // Xóa đề thi
    const result = await db.query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || null,
      action: 'DELETE',
      resource_type: 'exam',
      resource_id: id,
      resource_name: result.rows[0].exam_code,
      details: result.rows[0],
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('deleteExam error:', error);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
};

module.exports = {
  getAllExams,
  getQuestionsByExamId,
  deleteExam,
};
