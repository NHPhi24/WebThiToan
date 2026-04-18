// Giáo viên duyệt hoặc từ chối đăng ký ca thi
exports.updateRegisterStatus = async (req, res) => {
  const { session_id, user_id } = req.params;
  const { register_status } = req.body;
  if (!session_id || !user_id || ![10, 20, 50].includes(Number(register_status))) {
    return res.status(400).json({ error: 'Thiếu thông tin hoặc trạng thái không hợp lệ' });
  }
  try {
    const result = await db.query('UPDATE session_participants SET register_status = $1 WHERE session_id = $2 AND user_id = $3 RETURNING *', [
      register_status,
      session_id,
      user_id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
    }
    res.json(SessionParticipant.fromRow(result.rows[0]));
  } catch (err) {
    console.error('update register status error:', err);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái đăng ký' });
  }
};
const db = require('../data/db');
const SessionParticipant = require('../entities/sessionParticipant');

// Đăng ký ca thi (cho mọi user)
exports.register = async (req, res) => {
  const { session_id, user_id } = req.body;
  if (!session_id || !user_id) {
    return res.status(400).json({ error: 'Thiếu session_id hoặc user_id' });
  }
  try {
    // Kiểm tra đã đăng ký chưa
    const check = await db.query('SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2', [session_id, user_id]);
    if (check.rows.length > 0) {
      return res.status(409).json({ error: 'Đã đăng ký ca thi này' });
    }
    const now = new Date();
    const result = await db.query(
      'INSERT INTO session_participants (session_id, user_id, registered_at, register_status) VALUES ($1, $2, $3, $4) RETURNING *',
      [
        session_id,
        user_id,
        now,
        10, // 10: chờ duyệt
      ],
    );
    res.status(201).json(SessionParticipant.fromRow(result.rows[0]));
  } catch (err) {
    console.error('register session participant error:', err);
    res.status(500).json({ error: 'Lỗi đăng ký ca thi' });
  }
};
