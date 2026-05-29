const db = require('./db');

const initDb = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE,
      role VARCHAR(10) NOT NULL,
      created_by INTEGER REFERENCES users(id),
      profile_info JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade INTEGER CHECK (grade IN (10, 11, 12))
    );

    CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY,
      teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      -- Topic or classification of the question (e.g., hàm số, tích phân)
      topic VARCHAR(100),
      content TEXT NOT NULL,
      ans_a TEXT NOT NULL,
      ans_b TEXT NOT NULL,
      ans_c TEXT NOT NULL,
      ans_d TEXT NOT NULL,
      correct_ans TEXT NOT NULL,
      explanation TEXT,
      level INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade INTEGER CHECK (grade IN (10, 11, 12))
    );

    CREATE TABLE IF NOT EXISTS exam_templates (
      id SERIAL PRIMARY KEY,
      template_name VARCHAR(100),
      total_questions INTEGER DEFAULT 50,
      basic_percent INTEGER DEFAULT 70,
      advanced_percent INTEGER DEFAULT 30,
      teacher_id INTEGER REFERENCES users(id),
      structure JSONB DEFAULT '[]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade INTEGER CHECK (grade IN (10, 11, 12))
    );

    CREATE TABLE IF NOT EXISTS exams (
      id SERIAL PRIMARY KEY,
      exam_code VARCHAR(20) UNIQUE,
      template_id INTEGER REFERENCES exam_templates(id) ON DELETE SET NULL,
      teacher_id INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade INTEGER CHECK (grade IN (10, 11, 12))
    );

    CREATE TABLE IF NOT EXISTS exam_questions (
      exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
      order_index INTEGER,
      PRIMARY KEY (exam_id, question_id)
    );

    CREATE TABLE IF NOT EXISTS exam_sessions (
      id SERIAL PRIMARY KEY,
      session_name VARCHAR(100) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      duration INTEGER NOT NULL,
      teacher_id INTEGER REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'READY',
      manual_status_time TIMESTAMP NULL,
      exam_ids INTEGER[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grade VARCHAR(20) NULL,
      lock_duration_seconds INTEGER DEFAULT 10,
      max_participants INTEGER DEFAULT NULL
    );
    
    CREATE TABLE IF NOT EXISTS session_participants (
      session_id INTEGER REFERENCES exam_sessions(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      register_status INT DEFAULT 10, -- 10: chờ duyệt, 20: phê duyệt, 50: từ chối
      has_joined BOOLEAN DEFAULT FALSE, -- Đã tham gia thi hay chưa (vào phòng thi lần đầu)
      
      PRIMARY KEY (session_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS exam_results (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL,
      exam_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      score DECIMAL(4, 2) DEFAULT 0,
      answers_log JSONB DEFAULT '{}',
      violation_logs JSONB DEFAULT '[]', -- Log vi phạm: [{time, type, note}]
      is_submitted BOOLEAN DEFAULT FALSE,
      submitted_at TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0, -- Thời gian làm bài (giây)

      CONSTRAINT fk_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
      CONSTRAINT fk_exam FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
      CONSTRAINT fk_session FOREIGN KEY (session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
      UNIQUE (session_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS system_audit_logs (
      id SERIAL PRIMARY KEY,
      actor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      created_by VARCHAR(100),
      action VARCHAR(20) NOT NULL,
      resource_type VARCHAR(50) NOT NULL,
      resource_id VARCHAR(100),
      resource_name VARCHAR(255),
      details JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Đảm bảo cột is_submitted tồn tại (nếu nâng cấp từ bản cũ)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_results' AND column_name = 'is_submitted'
      ) THEN
        ALTER TABLE exam_results ADD COLUMN is_submitted BOOLEAN DEFAULT FALSE;
      END IF;
    END
    $$;
    -- Đảm bảo cột topic tồn tại trong bảng questions (migration an toàn)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'topic'
      ) THEN
        ALTER TABLE questions ADD COLUMN topic VARCHAR(100);
      END IF;
    END
    $$;
    -- Nếu đang có cột tags cũ, xoá nó (migration an toàn)
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'tags'
      ) THEN
        ALTER TABLE questions DROP COLUMN tags;
      END IF;
    END
    $$;
    -- Đảm bảo cột structure tồn tại trong exam_templates
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_templates' AND column_name = 'structure'
      ) THEN
        ALTER TABLE exam_templates ADD COLUMN structure JSONB DEFAULT '[]';
      END IF;
    END
    $$;
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'system_audit_logs' AND column_name = 'actor_username'
      ) THEN
        ALTER TABLE system_audit_logs RENAME COLUMN actor_username TO created_by;
      END IF;
    END
    $$;
    -- Đảm bảo cột max_participants tồn tại (nếu nâng cấp từ bản cũ)
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_sessions' AND column_name = 'max_participants'
      ) THEN
        ALTER TABLE exam_sessions ADD COLUMN max_participants INTEGER DEFAULT NULL;
      END IF;
    END
    $$;
     -- Đảm bảo cột violation_logs tồn tại (nếu nâng cấp từ bản cũ)
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_results' AND column_name = 'violation_logs'
          ) THEN
            ALTER TABLE exam_results ADD COLUMN violation_logs JSONB DEFAULT '[]';
          END IF;
        END
        $$;

    INSERT INTO users (username, password, full_name, email, role, created_at)
    VALUES ('admin', '123qwe', 'Administrator', 'admin@example.com', 'ADMIN', CURRENT_TIMESTAMP)
    ON CONFLICT (username) DO NOTHING;
  `);
};

const { runAllMigrations } = require('./migrationUtils');

module.exports = async () => {
  await initDb();
  await runAllMigrations(db);
};
