// Import nhiều user, cho phép import phần hợp lệ, trả về kết quả từng dòng
const importUsers = async (req, res) => {
  const users = req.body.users || [];
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Danh sách users không hợp lệ' });
  }
  try {
    // Lấy tất cả username và email cần kiểm tra
    const usernames = users.map((u) => u.username).filter(Boolean);
    const emails = users.map((u) => u.email).filter(Boolean);
    // Truy vấn các user đã tồn tại theo username hoặc email
    const result = await db.query(`SELECT username, email FROM users WHERE username = ANY($1) OR email = ANY($2)`, [usernames, emails]);
    const existed = result.rows;
    const importResults = [];
    for (const user of users) {
      // Kiểm tra trường bắt buộc (grade chỉ bắt buộc nếu là STUDENT)
      if (
        !user.username ||
        !user.password ||
        !user.full_name ||
        !user.role ||
        (user.role.toUpperCase() === 'STUDENT' && (user.grade === undefined || user.grade === null || user.grade === ''))
      ) {
        importResults.push({ username: user.username, status: 'invalid', error: 'Thiếu trường bắt buộc' });
        continue;
      }
      // Username không được chứa dấu cách
      if (typeof user.username === 'string' && user.username.includes(' ')) {
        importResults.push({ username: user.username, status: 'invalid', error: 'Tên đăng nhập không được chứa dấu cách' });
        continue;
      }
      // Kiểm tra role
      const role = (user.role || '').toUpperCase();
      if (!['STUDENT', 'TEACHER', 'ADMIN'].includes(role)) {
        importResults.push({ username: user.username, status: 'invalid', error: 'Role không hợp lệ' });
        continue;
      }
      // Nếu là học sinh, kiểm tra grade hợp lệ
      if (role === 'STUDENT' && ![10, 11, 12].includes(Number(user.grade))) {
        importResults.push({ username: user.username, status: 'invalid', error: 'Khối phải là 10, 11 hoặc 12 với học sinh' });
        continue;
      }
      // Kiểm tra trùng username/email
      const usernameDup = existed.find((e) => e.username === user.username);
      if (usernameDup) {
        importResults.push({ username: user.username, status: 'duplicate_username', error: 'Username đã tồn tại' });
        continue;
      }
      const emailDup = user.email && existed.find((e) => e.email === user.email);
      if (emailDup) {
        importResults.push({ username: user.username, status: 'duplicate_email', error: 'Email đã tồn tại' });
        continue;
      }
      // Tạo user mới
      try {
        // Nếu không phải học sinh hoặc grade rỗng thì set null
        let gradeValue = user.grade;
        if (role !== 'STUDENT' || gradeValue === '' || gradeValue === undefined || gradeValue === null) {
          gradeValue = null;
        }
        const insertRes = await db.query(
          `INSERT INTO users (username, password, full_name, email, role, grade) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, username, full_name, email, role, grade`,
          [user.username, user.password, user.full_name, user.email, role, gradeValue],
        );
        importResults.push({ username: user.username, status: 'created', data: insertRes.rows[0] });
        // Thêm vào existed để tránh trùng tiếp các bản ghi sau
        existed.push({ username: user.username, email: user.email });
      } catch (err) {
        importResults.push({ username: user.username, status: 'error', error: err.message });
      }
    }
    res.status(201).json(importResults);
  } catch (error) {
    console.error('importUsers error:', error);
    res.status(500).json({ error: 'Lỗi import users', detail: error.message });
  }
};
// Kiểm tra trùng username và email cho import user
const checkDuplicateUsers = async (req, res) => {
  const users = req.body.users || [];
  if (!Array.isArray(users) || users.length === 0) {
    return res.status(400).json({ error: 'Danh sách users không hợp lệ' });
  }

  // Lấy tất cả username và email cần kiểm tra
  const usernames = users.map((u) => u.username).filter(Boolean);
  const emails = users.map((u) => u.email).filter(Boolean);

  try {
    // Truy vấn các user đã tồn tại theo username hoặc email
    const result = await db.query(`SELECT username, email FROM users WHERE username = ANY($1) OR email = ANY($2)`, [usernames, emails]);
    const existed = result.rows;

    // Trả về danh sách user bị trùng (theo index trong mảng users)
    const duplicates = users
      .map((u, idx) => {
        const usernameDup = existed.find((e) => e.username === u.username);
        const emailDup = u.email && existed.find((e) => e.email === u.email);
        return {
          index: idx,
          username: u.username,
          email: u.email,
          duplicateUsername: !!usernameDup,
          duplicateEmail: !!emailDup,
        };
      })
      .filter((d) => d.duplicateUsername || d.duplicateEmail);

    res.json({ duplicates });
  } catch (error) {
    console.error('checkDuplicateUsers error:', error);
    res.status(500).json({ error: 'Lỗi kiểm tra trùng user' });
  }
};
// Đổi mật khẩu không mã hóa
const changePassword = async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'Missing newPassword' });
  }
  try {
    const result = await db.query(
      'UPDATE users SET password = $1 WHERE id = $2 RETURNING id, username, full_name, email, role, created_by, profile_info, created_at',
      [newPassword, id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CHANGE_PASSWORD',
      resource_type: 'user',
      resource_id: id.toString(),
      resource_name: result.rows[0].username,
      details: { changed: true },
    });
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('changePassword error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};
// Không export trực tiếp ở đầu file, chỉ export cuối file
// Lấy thông tin user theo id
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'SELECT id, username, password, full_name, email, role, created_by, profile_info, created_at, grade FROM users WHERE id = $1',
      [id],
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Trả về cả password để giáo viên có thể hỗ trợ học sinh tìm lại mật khẩu
    const user = result.rows[0];
    res.json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
// Lấy tất cả học sinh, có thể lọc theo grade
const getAllStudents = async (req, res) => {
  try {
    const { grade } = req.query;
    let query = "SELECT id, username, full_name, email, role, created_by, profile_info, created_at, grade FROM users WHERE role = 'STUDENT'";
    const params = [];
    if (grade) {
      query += ' AND grade = $1';
      params.push(grade);
    }
    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    const users = result.rows.map(User.fromRow);
    res.json(users);
  } catch (error) {
    console.error('getAllStudents error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};
const db = require('../data/db');
const jwt = require('jsonwebtoken');
const User = require('../entities/user');
const { createAuditLog } = require('../data/auditLog');

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, full_name, email, role, created_by, profile_info, created_at, grade FROM users ORDER BY created_at DESC',
    );
    const users = result.rows.map(User.fromRow);
    res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  const { username, email, password, full_name, role, created_by, profile_info, grade } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO users (username, password, full_name, email, role, created_by, profile_info, grade)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, full_name, email, role, created_by, profile_info, created_at, grade`,
      [username, password, full_name, email, role || 'STUDENT', created_by || null, profile_info || {}, grade],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'user',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].username,
      details: { username, email, full_name, role, created_by, profile_info, grade },
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, full_name, role, profile_info, grade } = req.body;

  try {
    const fields = [];
    const values = [];
    let index = 1;

    if (username !== undefined) {
      fields.push(`username=$${index++}`);
      values.push(username);
    }
    if (email !== undefined) {
      fields.push(`email=$${index++}`);
      values.push(email);
    }
    if (password !== undefined) {
      fields.push(`password=$${index++}`);
      values.push(password);
    }
    if (full_name !== undefined) {
      fields.push(`full_name=$${index++}`);
      values.push(full_name);
    }
    if (role !== undefined) {
      fields.push(`role=$${index++}`);
      values.push(role);
    }

    if (profile_info !== undefined) {
      fields.push(`profile_info=$${index++}`);
      values.push(profile_info);
    }
    if (grade !== undefined) {
      fields.push(`grade=$${index++}`);
      values.push(grade);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, username, full_name, email, role, created_by, profile_info, created_at, grade`,
      values,
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE',
      resource_type: 'user',
      resource_id: id.toString(),
      resource_name: result.rows[0].username,
      details: { updatedFields: values.slice(0, -1) },
    });

    res.json(result.rows[0]);
  } catch (error) {
    console.error('updateUser error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'DELETE',
      resource_type: 'user',
      resource_id: id.toString(),
      resource_name: null,
      details: {},
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('deleteUser error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

const loginUser = async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await db.query(
      'SELECT id, username, full_name, email, role, created_by, profile_info, created_at, grade FROM users WHERE username = $1 AND password = $2',
      [username, password],
    );
    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'sai tài khoản hoặc mật khẩu' });
    }
    const user = result.rows[0];
    // Tạo JWT token, chỉ có hiệu lực trong 2 giờ
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET || 'secret-key', { expiresIn: '2h' });
    res.json({ user, token });
  } catch (error) {
    console.error('loginUser error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Middleware kiểm tra JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, process.env.JWT_SECRET || 'secret-key', (err, user) => {
    if (err) return res.status(401).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

module.exports = {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  loginUser,
  getUserById,
  getAllStudents,
  changePassword,
  checkDuplicateUsers,
  authenticateToken,
  importUsers,
};
