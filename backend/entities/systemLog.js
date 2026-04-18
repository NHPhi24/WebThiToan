class SystemLog {
  constructor({ id, actor_id, created_by, action, resource_type, resource_id, resource_name, details, created_at }) {
    this.id = id;
    this.actor_id = actor_id;
    this.created_by = created_by;
    this.action = action;
    this.resource_type = resource_type;
    this.resource_id = resource_id;
    this.resource_name = resource_name;
    this.details = details;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new SystemLog({
      id: row.id,
      actor_id: row.actor_id,
      created_by: row.created_by,
      action: row.action,
      resource_type: row.resource_type,
      resource_id: row.resource_id,
      resource_name: row.resource_name,
      details: row.details,
      created_at: row.created_at,
    });
  }
}

module.exports = SystemLog;
