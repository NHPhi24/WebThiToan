// Xóa cấu trúc đề thi
const deleteExamTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    // Xóa bản ghi
    const result = await db.query('DELETE FROM exam_templates WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam template not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || null,
      action: 'DELETE',
      resource_type: 'exam_template',
      resource_id: id,
      resource_name: result.rows[0].template_name,
      details: result.rows[0],
    });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('deleteExamTemplate error:', error);
    res.status(500).json({ error: 'Failed to delete exam template' });
  }
};
const db = require('../data/db');
const ExamTemplate = require('../entities/examTemplate');
const { createAuditLog } = require('../data/auditLog');

const getAllExamTemplates = async (req, res) => {
  try {
    // Join với bảng users để lấy thông tin giáo viên
    const result = await db.query(`
      SELECT et.*, u.full_name as teacher_full_name, u.username as teacher_username
      FROM exam_templates et
      LEFT JOIN users u ON et.teacher_id = u.id
      ORDER BY et.id DESC
    `);
    // Gắn thêm trường teacher_full_name vào object trả về
    const templates = result.rows.map((row) => ({
      ...ExamTemplate.fromRow(row),
      teacher_full_name: row.teacher_full_name,
      teacher_username: row.teacher_username,
    }));
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

    // Lấy lại bản ghi vừa tạo, join với users để trả về teacher_full_name
    const detailResult = await db.query(
      `
      SELECT et.*, u.full_name as teacher_full_name, u.username as teacher_username
      FROM exam_templates et
      LEFT JOIN users u ON et.teacher_id = u.id
      WHERE et.id = $1
    `,
      [result.rows[0].id],
    );
    res.status(201).json({
      ...ExamTemplate.fromRow(detailResult.rows[0]),
      teacher_full_name: detailResult.rows[0].teacher_full_name,
      teacher_username: detailResult.rows[0].teacher_username,
    });
  } catch (error) {
    console.error('createExamTemplate error:', error);
    res.status(500).json({ error: 'Failed to create exam template' });
  }
};

const updateExamTemplate = async (req, res) => {
  const { id } = req.params;
  const { template_name, total_questions, basic_percent, advanced_percent, teacher_id } = req.body;
  try {
    const result = await db.query(
      `UPDATE exam_templates
       SET template_name = $1,
           total_questions = $2,
           basic_percent = $3,
           advanced_percent = $4,
           teacher_id = $5
       WHERE id = $6
       RETURNING *`,
      [template_name, total_questions, basic_percent, advanced_percent, teacher_id, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam template not found' });
    }

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE',
      resource_type: 'exam_template',
      resource_id: id,
      resource_name: template_name,
      details: { template_name, total_questions, basic_percent, advanced_percent, teacher_id },
    });

    // Lấy lại bản ghi vừa cập nhật, join với users để trả về teacher_full_name, created_at...
    const detailResult = await db.query(
      `
      SELECT et.*, u.full_name as teacher_full_name, u.username as teacher_username
      FROM exam_templates et
      LEFT JOIN users u ON et.teacher_id = u.id
      WHERE et.id = $1
    `,
      [id],
    );
    res.json({
      ...ExamTemplate.fromRow(detailResult.rows[0]),
      teacher_full_name: detailResult.rows[0].teacher_full_name,
      teacher_username: detailResult.rows[0].teacher_username,
    });
  } catch (error) {
    console.error('updateExamTemplate error:', error);
    res.status(500).json({ error: 'Failed to update exam template' });
  }
};

module.exports = {
  getAllExamTemplates,
  createExamTemplate,
  updateExamTemplate,
  deleteExamTemplate,
};
