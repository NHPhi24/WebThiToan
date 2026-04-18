const db = require('../data/db');
const ExamTemplate = require('../entities/examTemplate');
const { createAuditLog } = require('../data/auditLog');

const getAllExamTemplates = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_templates ORDER BY id DESC');
    const templates = result.rows.map(ExamTemplate.fromRow);
    res.json(templates);
  } catch (error) {
    console.error('getAllExamTemplates error:', error);
    res.status(500).json({ error: 'Failed to fetch exam templates' });
  }
};

const createExamTemplate = async (req, res) => {
  const { template_name, total_questions, basic_percent, advanced_percent, teacher_id } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO exam_templates (template_name, total_questions, basic_percent, advanced_percent, teacher_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [template_name, total_questions || 50, basic_percent || 70, advanced_percent || 30, teacher_id],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'exam_template',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].template_name,
      details: { total_questions, basic_percent, advanced_percent, teacher_id },
    });

    res.status(201).json(ExamTemplate.fromRow(result.rows[0]));
  } catch (error) {
    console.error('createExamTemplate error:', error);
    res.status(500).json({ error: 'Failed to create exam template' });
  }
};

module.exports = {
  getAllExamTemplates,
  createExamTemplate,
};
