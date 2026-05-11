// backend/data/migrationUtils.js
const migrateColumnIfNotExists = async (db, table, column, typeDefault) => {
  const check = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`, [table, column]);
  if (check.rows.length === 0) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDefault}`);
    console.log(`Đã thêm cột ${column} vào ${table}`);
  }
};

const migrations = [
  { table: 'session_participants', column: 'has_joined', type: 'BOOLEAN DEFAULT FALSE' },
  { table: 'exam_results', column: 'duration_seconds', type: 'INTEGER DEFAULT 0' },
  { table: 'exam_sessions', column: 'grade', type: 'VARCHAR(20) NULL' },
  { table: 'exam_templates', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  { table: 'exams', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  { table: 'questions', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  { table: 'users', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
];

const runAllMigrations = async (db) => {
  for (const m of migrations) {
    await migrateColumnIfNotExists(db, m.table, m.column, m.type);
  }
};

module.exports = { runAllMigrations };
