const db = require('../data/db');
const SystemLog = require('../entities/systemLog');

const getAllSystemLogs = async (req, res) => {
  try {
    const { actor_id, created_by, resource_type, action, limit = 100 } = req.query;
    const conditions = [];
    const values = [];
    let index = 1;

    if (actor_id) {
      conditions.push(`actor_id = $${index++}`);
      values.push(actor_id);
    }
    if (created_by) {
      conditions.push(`created_by = $${index++}`);
      values.push(created_by);
    }
    if (resource_type) {
      conditions.push(`resource_type = $${index++}`);
      values.push(resource_type);
    }
    if (action) {
      conditions.push(`action = $${index++}`);
      values.push(action);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await db.query(`SELECT * FROM system_audit_logs ${whereClause} ORDER BY created_at DESC LIMIT $${index}`, [...values, limit]);

    const logs = result.rows.map(SystemLog.fromRow);
    res.json(logs);
  } catch (error) {
    console.error('getAllSystemLogs error:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
};

module.exports = {
  getAllSystemLogs,
};
