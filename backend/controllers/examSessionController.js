// API: GET /exam-sessions/ongoing/with-register-status?user_id=...
const getOngoingExamSessionsWithRegisterStatus = async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'Thiếu user_id' });
  try {
    // Lấy các ca thi đang diễn ra
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY start_time DESC');
    const ongoingSessions = result.rows.filter((row) => getSessionStatus(row) === 'ONGOING');
    if (ongoingSessions.length === 0) return res.json([]);
    const sessionIds = ongoingSessions.map((s) => s.id);
    // Lấy trạng thái đăng ký của user cho các ca thi này
    const regRes = await db.query(`SELECT session_id, register_status FROM session_participants WHERE user_id = $1 AND session_id = ANY($2)`, [
      user_id,
      sessionIds,
    ]);
    const regMap = {};
    regRes.rows.forEach((r) => {
      regMap[r.session_id] = r.register_status;
    });
    // Lấy danh sách các ca thi mà user đã nộp bài (is_submitted=true)
    const examResultRes = await db.query(
      `SELECT session_id FROM exam_results WHERE student_id = $1 AND is_submitted = true AND session_id = ANY($2)`,
      [user_id, sessionIds],
    );
    const submittedSessionIds = new Set(examResultRes.rows.map((r) => r.session_id));
    // Gắn trạng thái đăng ký và has_submitted vào từng ca thi
    const resultList = ongoingSessions.map((s) => {
      const session = ExamSession.fromRow(s);
      session.register_status = regMap[s.id] ?? null; // null nếu chưa đăng ký
      session.has_submitted = submittedSessionIds.has(s.id); // true nếu đã nộp bài
      return session;
    });
    res.json(resultList);
  } catch (error) {
    console.error('getOngoingExamSessionsWithRegisterStatus error:', error);
    res.status(500).json({ error: 'Failed to fetch ongoing exam sessions with register status' });
  }
};
// API: POST /exam-sessions/:id/start
// Random 1 mã đề từ exam_ids, trả về mã đề và danh sách câu hỏi cho học sinh
const db = require('../data/db');
const Exam = require('../entities/exam');
const Question = require('../entities/question');

const shuffleArray = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const shuffleAnswers = (q) => {
  // Đảo ngẫu nhiên đáp án A/B/C/D và cập nhật lại correct_ans
  const options = [
    { key: 'A', text: q.ans_a },
    { key: 'B', text: q.ans_b },
    { key: 'C', text: q.ans_c },
    { key: 'D', text: q.ans_d },
  ];
  const shuffled = shuffleArray(options);
  const keyMap = ['A', 'B', 'C', 'D'];
  const newQ = { ...q };
  shuffled.forEach((opt, idx) => {
    newQ[`ans_${keyMap[idx].toLowerCase()}`] = opt.text;
    if (opt.key === q.correct_ans) {
      newQ.correct_ans = keyMap[idx];
    }
  });
  return newQ;
};

const startExamSessionForStudent = async (req, res) => {
  const { id } = req.params; // sessionId
  try {
    // Lấy ca thi
    const sessionRes = await db.query('SELECT * FROM exam_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) return res.status(404).json({ error: 'Exam session not found' });
    const session = sessionRes.rows[0];
    // Chỉ lấy 1 đề duy nhất cho ca thi
    const examId = Array.isArray(session.exam_ids) ? session.exam_ids[0] : session.exam_ids;
    if (!examId) return res.status(400).json({ error: 'Ca thi chưa có mã đề nào' });
    // Lấy thông tin mã đề
    const examRes = await db.query('SELECT * FROM exams WHERE id = $1', [examId]);
    if (examRes.rows.length === 0) return res.status(404).json({ error: 'Exam not found' });
    const exam = Exam.fromRow(examRes.rows[0]);
    // Lấy danh sách câu hỏi của mã đề
    const qRes = await db.query(
      `SELECT q.*, eq.order_index FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = $1 ORDER BY eq.order_index ASC`,
      [examId],
    );
    let questions = qRes.rows.map((row) => ({ ...Question.fromRow(row), order_index: row.order_index }));
    // Đảo ngẫu nhiên thứ tự câu hỏi
    questions = shuffleArray(questions).map(shuffleAnswers);
    res.json({
      exam_id: exam.id,
      exam_code: exam.exam_code,
      questions,
    });
  } catch (error) {
    console.error('startExamSessionForStudent error:', error);
    res.status(500).json({ error: 'Failed to start exam session', detail: error.message });
  }
};

// Lấy ca thi đang diễn ra mà học sinh đã được phê duyệt
const getOngoingApprovedExamSessionsByUser = async (req, res) => {
  const user_id = req.query.user_id;
  if (!user_id) return res.status(400).json({ error: 'Thiếu user_id' });
  try {
    // Lấy các ca thi đang diễn ra
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY start_time DESC');
    const now = Date.now();
    const ongoingSessions = result.rows.filter((row) => getSessionStatus(row) === 'ONGOING');
    if (ongoingSessions.length === 0) return res.json([]);
    // Lấy các ca thi mà user đã được phê duyệt
    const sessionIds = ongoingSessions.map((s) => s.id);
    const approvedRes = await db.query(`SELECT * FROM session_participants WHERE user_id = $1 AND register_status = 20 AND session_id = ANY($2)`, [
      user_id,
      sessionIds,
    ]);
    const approvedSessionIds = approvedRes.rows.map((r) => r.session_id);
    const filtered = ongoingSessions.filter((s) => approvedSessionIds.includes(s.id));
    res.json(filtered.map(ExamSession.fromRow));
  } catch (error) {
    console.error('getOngoingApprovedExamSessionsByUser error:', error);
    res.status(500).json({ error: 'Failed to fetch ongoing approved exam sessions' });
  }
};
// Lấy ca thi đang diễn ra
const getOngoingExamSessions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY start_time DESC');
    const now = Date.now();
    const sessions = result.rows
      .filter((row) => getSessionStatus(row) === 'ONGOING')
      .map((row) => {
        const session = ExamSession.fromRow(row);
        session.status = 'ONGOING';
        return session;
      });
    res.json(sessions);
  } catch (error) {
    console.error('getOngoingExamSessions error:', error);
    res.status(500).json({ error: 'Failed to fetch ongoing exam sessions' });
  }
};

// Lấy ca thi sẵn sàng (chưa bắt đầu)
const getReadyExamSessions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY start_time DESC');
    const now = Date.now();
    const sessions = result.rows
      .filter((row) => getSessionStatus(row) === 'READY')
      .map((row) => {
        const session = ExamSession.fromRow(row);
        session.status = 'READY';
        return session;
      });
    res.json(sessions);
  } catch (error) {
    console.error('getReadyExamSessions error:', error);
    res.status(500).json({ error: 'Failed to fetch ready exam sessions' });
  }
};
const ExamSession = require('../entities/examSession');
const { createAuditLog } = require('../data/auditLog');

// Biến lưu thời điểm đổi trạng thái thủ công cho từng ca thi (id -> timestamp)
const manualStatusChangeTimes = {};

const getSessionStatus = (row) => {
  // Nếu trạng thái là FINISHED thì kết thúc luôn
  if (row.status === 'FINISHED') return 'FINISHED';
  // Nếu trạng thái là ONGOING và có manual_status_time thì tính theo thời điểm đổi + duration
  if (row.status === 'ONGOING' && row.manual_status_time) {
    const start = new Date(row.manual_status_time).getTime();
    const durationNum = Number(row.duration);
    if (!start || !durationNum || isNaN(durationNum)) return 'UNKNOWN';
    const now = Date.now();
    const end = start + durationNum * 60000;
    if (now <= end) return 'ONGOING';
    return 'FINISHED';
  }
  // Nếu trạng thái là READY hoặc null thì tính theo start_time như cũ
  const durationNum = Number(row.duration);
  const start = row.start_time ? new Date(row.start_time).getTime() : null;
  if (!start || !durationNum || isNaN(durationNum)) return 'UNKNOWN';
  const now = Date.now();
  const end = start + durationNum * 60000;
  if (now < start) return 'READY';
  if (now >= start && now <= end) return 'ONGOING';
  return 'FINISHED';
};

const getAllExamSessions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_sessions ORDER BY created_at DESC');
    const sessions = result.rows.map((row) => {
      const session = ExamSession.fromRow(row);
      session.status = getSessionStatus(row);
      return session;
    });
    res.json(sessions);
  } catch (error) {
    console.error('getAllExamSessions error:', error);
    res.status(500).json({ error: 'Failed to fetch exam sessions' });
  }
};

const createExamSession = async (req, res) => {
  const { session_name, start_time, duration, teacher_id, status, exam_ids, grade, lock_duration_seconds, max_participants } = req.body;

  try {
    // Kiểm tra trùng tên ca thi
    const dupCheck = await db.query('SELECT id FROM exam_sessions WHERE LOWER(session_name) = LOWER($1)', [session_name]);
    if (dupCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Tên ca thi đã tồn tại' });
    }

    const result = await db.query(
      `INSERT INTO exam_sessions (session_name, start_time, duration, teacher_id, status, exam_ids, grade, lock_duration_seconds, max_participants)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        session_name,
        start_time,
        duration,
        teacher_id,
        status || 'READY',
        exam_ids || [],
        grade,
        lock_duration_seconds || 10,
        max_participants ?? null,
      ],
    );

    await createAuditLog({
      actor_id: req.body.actor_id || req.body.teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'CREATE',
      resource_type: 'exam_session',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].session_name,
      details: { start_time, duration, status, teacher_id, exam_ids, grade, lock_duration_seconds, max_participants },
    });

    res.status(201).json({ ...ExamSession.fromRow(result.rows[0]), created_at: new Date() });
  } catch (error) {
    console.error('createExamSession error:', error);
    res.status(500).json({ error: 'Failed to create exam session' });
  }
};

// Lấy chi tiết ca thi
const getExamSessionById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('SELECT * FROM exam_sessions WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    const session = ExamSession.fromRow(result.rows[0]);
    session.status = getSessionStatus(result.rows[0]);
    res.json(session);
  } catch (error) {
    console.error('getExamSessionById error:', error);
    res.status(500).json({ error: 'Failed to fetch exam session' });
  }
};

// Sửa ca thi
const updateExamSession = async (req, res) => {
  const { id } = req.params;
  const { session_name, start_time, duration, teacher_id, status, exam_ids, grade, lock_duration_seconds, max_participants } = req.body;
  try {
    const result = await db.query(
      `UPDATE exam_sessions SET session_name=$1, start_time=$2, duration=$3, teacher_id=$4, status=$5, exam_ids=$6, grade=$7, lock_duration_seconds=$8, max_participants=$9 WHERE id=$10 RETURNING *`,
      [session_name, start_time, duration, teacher_id, status, exam_ids || [], grade, lock_duration_seconds || 10, max_participants ?? null, id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || teacher_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: session_name,
      details: { start_time, duration, status, teacher_id, exam_ids, grade, lock_duration_seconds, max_participants },
    });
    res.json(ExamSession.fromRow(result.rows[0]));
  } catch (error) {
    console.error('updateExamSession error:', error);
    res.status(500).json({ error: 'Failed to update exam session' });
  }
};

// Xóa ca thi
const deleteExamSession = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM exam_sessions WHERE id=$1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'DELETE',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: result.rows[0].session_name,
      details: {},
    });
    res.json({ message: 'Exam session deleted successfully' });
  } catch (error) {
    console.error('deleteExamSession error:', error);
    res.status(500).json({ error: 'Failed to delete exam session' });
  }
};

// Thay đổi trạng thái ca thi
const updateExamSessionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    // Lấy thông tin ca thi hiện tại
    const sessionRes = await db.query('SELECT * FROM exam_sessions WHERE id = $1', [id]);
    if (sessionRes.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    const session = sessionRes.rows[0];
    // Kiểm tra quyền: chỉ người tạo (teacher_id) được đổi trạng thái
    const actor_id = req.body.actor_id || null;
    if (!actor_id) {
      return res.status(403).json({ error: 'Thiếu actor_id để xác thực quyền' });
    }
    if (String(actor_id) !== String(session.teacher_id)) {
      return res.status(403).json({ error: 'Chỉ người tạo ca thi mới được đổi trạng thái' });
    }
    // Nếu đổi về READY mà đã quá thời gian bắt đầu thì báo lỗi
    if ((status === 'READY' || !status) && session.start_time) {
      const now = Date.now();
      const start = new Date(session.start_time).getTime();
      if (now >= start) {
        return res.status(400).json({ error: 'Không thể chuyển về trạng thái Sẵn sàng khi đã quá thời gian bắt đầu ca thi.' });
      }
    }
    let result;
    if (status === 'ONGOING') {
      // Đổi sang ONGOING: lưu thời điểm đổi
      result = await db.query(`UPDATE exam_sessions SET status=$1, manual_status_time=NOW() WHERE id=$2 RETURNING *`, [status, id]);
    } else if (status === 'READY' || !status) {
      // Đổi sang READY hoặc reset: xóa manual_status_time
      result = await db.query(`UPDATE exam_sessions SET status=$1, manual_status_time=NULL WHERE id=$2 RETURNING *`, [status || 'READY', id]);
    } else if (status === 'FINISHED') {
      // Đổi sang FINISHED: set manual_status_time null
      result = await db.query(`UPDATE exam_sessions SET status=$1, manual_status_time=NULL WHERE id=$2 RETURNING *`, [status, id]);
    } else {
      // Trường hợp khác (phòng lỗi)
      result = await db.query(`UPDATE exam_sessions SET status=$1 WHERE id=$2 RETURNING *`, [status, id]);
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exam session not found' });
    }
    await createAuditLog({
      actor_id: req.body.actor_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: 'UPDATE_STATUS',
      resource_type: 'exam_session',
      resource_id: id,
      resource_name: result.rows[0].session_name,
      details: { status },
    });
    res.json(ExamSession.fromRow(result.rows[0]));
  } catch (error) {
    console.error('updateExamSessionStatus error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

module.exports = {
  getAllExamSessions,
  createExamSession,
  getExamSessionById,
  updateExamSession,
  deleteExamSession,
  updateExamSessionStatus,
  getOngoingExamSessions,
  getReadyExamSessions,
  getOngoingApprovedExamSessionsByUser,
  startExamSessionForStudent,
  getOngoingExamSessionsWithRegisterStatus,
};
