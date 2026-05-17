// Học sinh tự hủy đăng ký ca thi
exports.cancelRegister = async (req, res) => {
  const { session_id, user_id } = req.body;
  if (!session_id || !user_id) {
    return res.status(400).json({ error: 'Thiếu session_id hoặc user_id' });
  }
  try {
    const result = await db.query('DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2 RETURNING *', [session_id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đăng ký để hủy' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('cancelRegister error:', err);
    res.status(500).json({ error: 'Lỗi hủy đăng ký ca thi' });
  }
};
// Học sinh bắt đầu vào phòng thi: cập nhật has_joined = true
exports.markJoined = async (req, res) => {
  const { session_id, user_id } = req.body;
  if (!session_id || !user_id) {
    return res.status(400).json({ error: 'Thiếu session_id hoặc user_id' });
  }
  try {
    const result = await db.query('UPDATE session_participants SET has_joined = TRUE WHERE session_id = $1 AND user_id = $2 RETURNING *', [
      session_id,
      user_id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bản ghi' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('markJoined error:', err);
    res.status(500).json({ error: 'Lỗi cập nhật trạng thái tham gia thi' });
  }
};
const crypto = require('crypto');
const User = require('../entities/user');
exports.importSessionParticipants = async (req, res) => {
  const { session_id, users } = req.body;
  if (!session_id || !Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Thiếu session_id hoặc danh sách users' });
  }
  try {
    const now = new Date();
    // Lấy grade và max_participants của ca thi
    const sessionRes = await db.query('SELECT grade, max_participants FROM exam_sessions WHERE id = $1', [session_id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ca thi' });
    }
    const sessionGrade = sessionRes.rows[0].grade;
    const maxParticipants = sessionRes.rows[0].max_participants;
    // Đếm số học sinh đã đăng ký (được duyệt hoặc chờ duyệt)
    let currentCount = 0;
    if (maxParticipants) {
      const countRes = await db.query('SELECT COUNT(*) FROM session_participants WHERE session_id = $1', [session_id]);
      currentCount = Number(countRes.rows[0].count);
      if (currentCount + users.length > maxParticipants) {
        return res.status(400).json({ error: `Đã đủ số lượng học sinh tối đa (${maxParticipants}) cho ca thi này!` });
      }
    }
    const results = [];
    for (const user of users) {
      let uid = null;
      let userGrade = user.grade;
      let newAccount = null;
      // Tìm user theo username
      let userRes = null;
      if (user.username) {
        userRes = await db.query('SELECT id, grade FROM users WHERE username = $1', [user.username]);
      }
      if (userRes && userRes.rows.length > 0) {
        // User đã tồn tại, chỉ cần username, không cần password
        uid = userRes.rows[0].id;
        userGrade = userRes.rows[0].grade;
        // Kiểm tra trường bắt buộc cho user đã có: chỉ cần username, full_name, email, grade
        if (!user.username || !user.full_name || !user.email || !user.grade) {
          results.push({ username: user.username, status: 'invalid', error: 'Thiếu trường bắt buộc' });
          continue;
        }
      } else {
        // User chưa tồn tại, cần đủ các trường và password
        if (!user.username || !user.password || !user.full_name || !user.email || !user.grade) {
          results.push({ username: user.username, status: 'invalid', error: 'Thiếu trường bắt buộc' });
          continue;
        }
        // Kiểm tra trùng username/email
        const username = user.username;
        const email = user.email;
        const usernameCheck = await db.query('SELECT id FROM users WHERE username = $1', [username]);
        if (usernameCheck.rows.length > 0) {
          results.push({ username, status: 'duplicate_username', error: 'Username đã tồn tại' });
          continue;
        }
        const emailCheck = await db.query('SELECT id FROM users WHERE email = $1', [email]);
        if (emailCheck.rows.length > 0) {
          results.push({ username, status: 'duplicate_email', error: 'Email đã tồn tại' });
          continue;
        }
        // Tạo tài khoản mới
        const password = user.password;
        const full_name = user.full_name;
        userGrade = user.grade || sessionGrade;
        const insertUser = await db.query(
          `INSERT INTO users (username, password, full_name, email, role, grade) VALUES ($1, $2, $3, $4, 'STUDENT', $5) RETURNING id, username, full_name, email, grade`,
          [username, password, full_name, email, userGrade],
        );
        uid = insertUser.rows[0].id;
        newAccount = { username, password, full_name, email, grade: userGrade };
      }
      // Kiểm tra grade
      if (!userGrade || !sessionGrade || String(userGrade) !== String(sessionGrade)) {
        results.push({ username: user.username, status: 'grade_mismatch', newAccount });
        continue;
      }
      // Kiểm tra đã đăng ký chưa
      const check = await db.query('SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2', [session_id, uid]);
      if (check.rows.length > 0) {
        results.push({ username: user.username, status: 'exists', newAccount });
        continue;
      }
      const result = await db.query(
        'INSERT INTO session_participants (session_id, user_id, registered_at, register_status) VALUES ($1, $2, $3, $4) RETURNING *',
        [session_id, uid, now, 20],
      );
      results.push({ username: user.username, status: 'registered', data: SessionParticipant.fromRow(result.rows[0]), newAccount });
    }
    res.status(201).json(results);
  } catch (err) {
    console.error('[IMPORT PARTICIPANTS ERROR] message:', err.message, '\nstack:', err.stack, '\nbody:', req.body);
    res.status(500).json({ error: 'Lỗi import học sinh vào ca thi', detail: err.message });
  }
};
// Lấy danh sách user đã đăng ký của 1 ca thi
exports.getUsersBySession = async (req, res) => {
  const { session_id } = req.params;
  if (!session_id) return res.status(400).json({ error: 'Thiếu session_id' });
  try {
    // Lấy danh sách user đã đăng ký và trạng thái đã nộp bài hay chưa
    const result = await db.query(
      `
      SELECT sp.*, u.full_name, u.email, u.grade,
        sp.has_joined
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.session_id = $1
      ORDER BY sp.registered_at DESC
    `,
      [session_id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('getUsersBySession error:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách user của ca thi' });
  }
};
// Xóa học sinh khỏi ca thi
exports.removeParticipant = async (req, res) => {
  const { session_id, user_id } = req.params;
  if (!session_id || !user_id) {
    return res.status(400).json({ error: 'Thiếu session_id hoặc user_id' });
  }
  try {
    const result = await db.query('DELETE FROM session_participants WHERE session_id = $1 AND user_id = $2 RETURNING *', [session_id, user_id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy đăng ký' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('remove participant error:', err);
    res.status(500).json({ error: 'Lỗi xóa học sinh khỏi ca thi' });
  }
};
// Lấy danh sách đăng ký ca thi kèm thông tin user và ca thi
exports.getAllSessionParticipants = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sp.*, u.full_name, u.email, u.grade, es.session_name
      FROM session_participants sp
      JOIN users u ON sp.user_id = u.id
      JOIN exam_sessions es ON sp.session_id = es.id
      ORDER BY sp.registered_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('getAllSessionParticipants error:', err);
    res.status(500).json({ error: 'Lỗi lấy danh sách đăng ký ca thi' });
  }
};
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
  console.log('register body:', req.body);
  const { session_id, user_id } = req.body;
  if (!session_id || !user_id) {
    console.error('Thiếu session_id hoặc user_id:', req.body);
    return res.status(400).json({ error: 'Thiếu session_id hoặc user_id' });
  }
  // Cho phép user_id là số hoặc mảng
  const userIds = Array.isArray(user_id) ? user_id : [user_id];
  if (userIds.length === 0) {
    return res.status(400).json({ error: 'Danh sách user_id rỗng' });
  }
  try {
    const now = new Date();
    const results = [];
    // Lấy grade và max_participants của ca thi
    const sessionRes = await db.query('SELECT grade, max_participants FROM exam_sessions WHERE id = $1', [session_id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy ca thi' });
    }
    const sessionGrade = sessionRes.rows[0].grade;
    const maxParticipants = sessionRes.rows[0].max_participants;
    // Đếm số học sinh đã đăng ký (được duyệt hoặc chờ duyệt)
    let currentCount = 0;
    if (maxParticipants) {
      const countRes = await db.query('SELECT COUNT(*) FROM session_participants WHERE session_id = $1', [session_id]);
      currentCount = Number(countRes.rows[0].count);
      if (currentCount + userIds.length > maxParticipants) {
        return res.status(400).json({ error: `Đã đủ số lượng học sinh tối đa (${maxParticipants}) cho ca thi này!` });
      }
    }
    for (const uid of userIds) {
      // Lấy grade của user
      const userRes = await db.query('SELECT grade FROM users WHERE id = $1', [uid]);
      if (userRes.rows.length === 0) {
        results.push({ user_id: uid, status: 'user_not_found' });
        continue;
      }
      const userGrade = userRes.rows[0].grade;
      if (!userGrade || !sessionGrade || String(userGrade) !== String(sessionGrade)) {
        results.push({ user_id: uid, status: 'grade_mismatch' });
        continue;
      }
      // Kiểm tra đã đăng ký chưa
      const check = await db.query('SELECT * FROM session_participants WHERE session_id = $1 AND user_id = $2', [session_id, uid]);
      if (check.rows.length > 0) {
        results.push({ user_id: uid, status: 'exists' });
        continue;
      }
      const result = await db.query(
        'INSERT INTO session_participants (session_id, user_id, registered_at, register_status) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          session_id,
          uid,
          now,
          20, // 20: đã duyệt
        ],
      );
      results.push({ user_id: uid, status: 'registered', data: SessionParticipant.fromRow(result.rows[0]) });
    }
    res.status(201).json(results);
  } catch (err) {
    console.error('[REGISTER ERROR] message:', err.message, '\nstack:', err.stack, '\nbody:', req.body, '\nparams:', req.params);
    res.status(500).json({ error: 'Lỗi đăng ký ca thi', detail: err.message });
  }
};
