// backend/data/migrationUtils.js
const migrateColumnIfNotExists = async (db, table, column, typeDefault) => {
  const check = await db.query(`SELECT column_name FROM information_schema.columns WHERE table_name=$1 AND column_name=$2`, [table, column]);
  if (check.rows.length === 0) {
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${typeDefault}`);
    console.log(`Đã thêm cột ${column} vào ${table}`);
  }
};

const migrations = [
  // migration đăng ký ca thi
  { table: 'session_participants', column: 'has_joined', type: 'BOOLEAN DEFAULT FALSE' },
  // migration lưu log làm bài thi
  { table: 'exam_results', column: 'duration_seconds', type: 'INTEGER DEFAULT 0' },
  // migration ca thi
  { table: 'exam_sessions', column: 'grade', type: 'VARCHAR(20) NULL' },
  { table: 'exam_sessions', column: 'lock_duration_seconds', type: 'INTEGER DEFAULT 10' },
  // migration exam_results: đảm bảo có is_submitted
  { table: 'exam_results', column: 'is_submitted', type: 'BOOLEAN DEFAULT FALSE' },
  // migration cáu trúc đề thi
  { table: 'exam_templates', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  // migration đề thi
  { table: 'exams', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  // migration câu hỏi
  { table: 'questions', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
  // migration người dùng
  { table: 'users', column: 'grade', type: 'INTEGER CHECK (grade IN (10, 11, 12))' },
];

const runAllMigrations = async (db) => {
  for (const m of migrations) {
    await migrateColumnIfNotExists(db, m.table, m.column, m.type);
  }
};

module.exports = { runAllMigrations };
