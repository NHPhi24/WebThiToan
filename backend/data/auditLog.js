const db = require('./db');

const createAuditLog = async ({
  actor_id = null,
  created_by = null,
  action,
  resource_type,
  resource_id = null,
  resource_name = null,
  details = {},
}) => {
  const result = await db.query(
    `INSERT INTO system_audit_logs (
       actor_id,
       created_by,
       action,
       resource_type,
       resource_id,
       resource_name,
       details
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [actor_id, created_by, action, resource_type, resource_id, resource_name, details]
  );

  return result.rows[0];
};

module.exports = {
  createAuditLog,
};
