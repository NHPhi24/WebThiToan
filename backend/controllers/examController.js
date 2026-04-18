const db = require('../data/db');
const Exam = require('../entities/exam');
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

const createExam = async (req, res) => {
  const { exam_code, template_id, teacher_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO exams (exam_code, template_id, teacher_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [exam_code, template_id, teacher_id],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'exam',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].exam_code,
      details: { template_id, teacher_id },
    });

    res.status(201).json(Exam.fromRow(result.rows[0]));
  } catch (error) {
    console.error('createExam error:', error);
    res.status(500).json({ error: 'Failed to create exam' });
  }
};

module.exports = {
  getAllExams,
  createExam,
};
