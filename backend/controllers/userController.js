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
    const result = await db.query('SELECT id, username, full_name, email, role, created_by, profile_info, created_at FROM users WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = User.fromRow(result.rows[0]);
    res.json(user);
  } catch (error) {
    console.error('getUserById error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
// Lấy tất cả học sinh
const getAllStudents = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, username, full_name, email, role, created_by, profile_info, created_at FROM users WHERE role = 'STUDENT' ORDER BY created_at DESC",
    );
    const users = result.rows.map(User.fromRow);
    res.json(users);
  } catch (error) {
    console.error('getAllStudents error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};
const db = require('../data/db');
const User = require('../entities/user');
const { createAuditLog } = require('../data/auditLog');

const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, full_name, email, role, created_by, profile_info, created_at FROM users ORDER BY created_at DESC',
    );
    const users = result.rows.map(User.fromRow);
    res.json(users);
  } catch (error) {
    console.error('getAllUsers error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const createUser = async (req, res) => {
  const { username, email, password, full_name, role, created_by, profile_info } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO users (username, password, full_name, email, role, created_by, profile_info)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, full_name, email, role, created_by, profile_info, created_at`,
      [username, password, full_name, email, role || 'STUDENT', created_by || null, profile_info || {}],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'user',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].username,
      details: { username, email, full_name, role, created_by, profile_info },
    });

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('createUser error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, password, full_name, role, profile_info } = req.body;

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

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING id, username, full_name, email, role, created_by, profile_info, created_at`,
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
      'SELECT id, username, full_name, email, role, created_by, profile_info, created_at FROM users WHERE username = $1 AND password = $2',
      [username, password],
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('loginUser error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
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
};
