const db = require('../data/db');
const ExamSession = require('../entities/examSession');
const { createAuditLog } = require('../data/auditLog');

// Biến lưu thời điểm đổi trạng thái thủ công cho từng ca thi (id -> timestamp)
const manualStatusChangeTimes = {};

const getSessionStatus = (id, start_time, duration) => {
  const durationNum = Number(duration);
  if ((!start_time && !manualStatusChangeTimes[id]) || !durationNum || isNaN(durationNum)) return 'UNKNOWN';
  const now = Date.now();
  // Nếu đã đổi trạng thái thủ công thì lấy mốc đó, chưa thì lấy start_time
  const start = manualStatusChangeTimes[id] || new Date(start_time).getTime();
  if (isNaN(start)) return 'UNKNOWN';
  const end = start + durationNum * 60000;
  if (now < start) return 'READY';
  if (now >= start && now <= end) return 'ONGOING';
  return 'FINISHED';
};

const getAllExamSessions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY start_time DESC');
    const sessions = result.rows.map((row) => {
      const session = ExamSession.fromRow(row);
      session.status = getSessionStatus(session.id, session.start_time, session.duration);
      return session;
    });
    res.json(sessions);
  } catch (error) {
    console.error('getAllExamSessions error:', error);
    res.status(500).json({ error: 'Failed to fetch exam sessions' });
  }
};

const createExamSession = async (req, res) => {
  const { session_name, start_time, duration, teacher_id, status } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO exam_sessions (session_name, start_time, duration, teacher_id, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [session_name, start_time, duration, teacher_id, status || 'READY'],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'exam_session',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].session_name,
      details: { start_time, duration, status, teacher_id },
    });

    res.status(201).json({ ...ExamSession.fromRow(result.rows[0]), created_at: new Date() });
  } catch (error) {
    console.error('createExamSession error:', error);
    res.status(500).json({ error: 'Failed to create exam session' });
  }
};

// Lấy chi tiết ca thi
const getExamSessionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM exam_sessions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    const session = ExamSession.fromRow(result.rows[0]);
    session.status = getSessionStatus(session.id, session.start_time, session.duration);
    res.json(session);
  } catch (error) {
    console.error('getExamSessionById error:', error);
    res.status(500).json({ error: 'Failed to fetch exam session' });
  }
};

// Sửa ca thi
const updateExamSession = async (req, res) => {
  const { id } = req.params;
  const { session_name, start_time, duration, teacher_id, status } = req.body;
  try {
    const result = await db.query(
      `UPDATE exam_sessions SET session_name=$1, start_time=$2, duration=$3, teacher_id=$4, status=$5 WHERE id=$6 RETURNING *`,
      [session_name, start_time, duration, teacher_id, status, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: session_name,
      details: { start_time, duration, status, teacher_id },
    });
    res.json(ExamSession.fromRow(result.rows[0]));
  } catch (error) {
    console.error('updateExamSession error:', error);
    res.status(500).json({ error: 'Failed to update exam session' });
  }
};

// Xóa ca thi
const deleteExamSession = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM exam_sessions WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'DELETE',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: result.rows[0].session_name,
      details: {},
    });
    res.json({ message: 'Exam session deleted successfully' });
  } catch (error) {
    console.error('deleteExamSession error:', error);
    res.status(500).json({ error: 'Failed to delete exam session' });
  }
};

// Thay đổi trạng thái ca thi
const updateExamSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await db.query(`UPDATE exam_sessions SET status=$1 WHERE id=$2 RETURNING *`, [status, id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    // Lưu thời điểm đổi trạng thái thủ công (chỉ khi đổi sang ONGOING hoặc FINISHED)
    if (status === 'ONGOING' || status === 'FINISHED') {
      manualStatusChangeTimes[id] = Date.now();
    } else {
      delete manualStatusChangeTimes[id];
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE_STATUS',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: result.rows[0].session_name,
      details: { status },
    });
    res.json(ExamSession.fromRow(result.rows[0]));
  } catch (error) {
    console.error('updateExamSessionStatus error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = {
  getAllExamSessions,
  createExamSession,
  getExamSessionById,
  updateExamSession,
  deleteExamSession,
  updateExamSessionStatus,
};
