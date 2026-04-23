const db = require('./db');

/**
 * Reset all sequences to max(id) of each table (for dev/test only)
 */
const resetSequences = async () => {
  // List of tables and their id/sequence names
  const tables = [
    { table: 'users', seq: 'users_id_seq' },
    { table: 'questions', seq: 'questions_id_seq' },
    { table: 'exam_templates', seq: 'exam_templates_id_seq' },
    { table: 'exams', seq: 'exams_id_seq' },
    { table: 'exam_sessions', seq: 'exam_sessions_id_seq' },
    { table: 'exam_results', seq: 'exam_results_id_seq' },
    { table: 'system_audit_logs', seq: 'system_audit_logs_id_seq' },
  ];
  for (const { table, seq } of tables) {
    await db.query(`SELECT setval('${seq}', GREATEST(COALESCE((SELECT MAX(id) FROM ${table}), 0), 1));`);
  }
  console.log('All sequences reset to max(id)');
};

if (require.main === module) {
  resetSequences().then(() => process.exit(0));
}

module.exports = resetSequences;
