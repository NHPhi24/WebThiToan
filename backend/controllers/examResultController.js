const db = require('../data/db');
const ExamResult = require('../entities/examResult');
const { createAuditLog } = require('../data/auditLog');

const getAllExamResults = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_results ORDER BY submitted_at DESC');
    const results = result.rows.map(ExamResult.fromRow);
    res.json(results);
  } catch (error) {
    console.error('getAllExamResults error:', error);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
};

const createExamResult = async (req, res) => {
  const { student_id, exam_id, session_id, score, answers_log, is_submitted, submitted_at } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO exam_results (student_id, exam_id, session_id, score, answers_log, is_submitted, submitted_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [student_id, exam_id, session_id, score || 0, answers_log || {}, is_submitted || false, submitted_at],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.student_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'exam_result',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].exam_id?.toString(),
      details: { student_id, exam_id, session_id, score, is_submitted },
    });

    res.status(201).json(ExamResult.fromRow(result.rows[0]));
  } catch (error) {
    console.error('createExamResult error:', error);
    res.status(500).json({ error: 'Failed to create exam result' });
  }
};

module.exports = {
  getAllExamResults,
  createExamResult,
};
