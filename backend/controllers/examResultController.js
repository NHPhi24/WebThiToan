// API: Lấy tất cả kết quả thi của một học sinh (theo student_id)
const getExamResultsByStudent = async (req, res) => {
  try {
    // Ưu tiên lấy student_id từ user đăng nhập (nếu có middleware xác thực), fallback lấy từ query
    const student_id = req.user?.id || req.query.student_id;
    if (!student_id) {
      return res.status(400).json({ error: 'Thiếu student_id' });
    }
    const result = await db.query('SELECT * FROM exam_results WHERE student_id = $1 ORDER BY submitted_at DESC', [student_id]);
    const results = result.rows.map(ExamResult.fromRow);
    res.json(results);
  } catch (error) {
    console.error('getExamResultsByStudent error:', error);
    res.status(500).json({ error: 'Failed to fetch exam results for student' });
  }
};
// Xem chi tiết kết quả thi
const getExamResultDetail = async (req, res) => {
  const { id } = req.params;
  try {
    // Lấy kết quả thi
    const resultRes = await db.query('SELECT * FROM exam_results WHERE id = $1', [id]);
    if (resultRes.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy kết quả thi' });
    }
    const result = resultRes.rows[0];
    // Lấy danh sách câu hỏi của đề thi (theo đúng thứ tự)
    const questionsRes = await db.query(
      `SELECT q.id, q.content, q.ans_a, q.ans_b, q.ans_c, q.ans_d, q.correct_ans, q.explanation
       FROM exam_questions eq JOIN questions q ON eq.question_id = q.id
       WHERE eq.exam_id = $1
       ORDER BY eq.order_index ASC`,
      [result.exam_id],
    );
    const questions = questionsRes.rows;
    // answers_log là mảng [{question_id, answer}]
    let answersLog = result.answers_log;
    if (typeof answersLog === 'string') {
      try {
        answersLog = JSON.parse(answersLog);
      } catch {
        answersLog = [];
      }
    }
    // Gộp thông tin từng câu hỏi
    const details = questions.map((q, idx) => {
      const userAnsObj = Array.isArray(answersLog) ? answersLog.find((a) => a.question_id === q.id) : null;
      const your_answer = userAnsObj ? userAnsObj.answer : null;
      let is_correct = false;
      if (typeof your_answer === 'string' && your_answer.trim() !== '') {
        is_correct = your_answer.toUpperCase() === q.correct_ans.toUpperCase();
      }
      return {
        question_id: q.id,
        question_content: q.content,
        ans_a: q.ans_a,
        ans_b: q.ans_b,
        ans_c: q.ans_c,
        ans_d: q.ans_d,
        your_answer,
        correct_answer: q.correct_ans,
        is_correct,
        explanation: q.explanation,
      };
    });
    res.json({
      id: result.id,
      student_id: result.student_id,
      exam_id: result.exam_id,
      session_id: result.session_id,
      score: result.score,
      duration_seconds: result.duration_seconds,
      details,
    });
  } catch (error) {
    console.error('getExamResultDetail error:', error);
    res.status(500).json({ error: 'Failed to get exam result detail' });
  }
};
const db = require('../data/db');
const ExamResult = require('../entities/examResult');
const { createAuditLog } = require('../data/auditLog');

const getAllExamResults = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM exam_results ORDER BY submitted_at DESC');
    const results = result.rows.map(ExamResult.fromRow);
    res.json(results);
  } catch (error) {
    console.error('getAllExamResults error:', error);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
};

const createExamResult = async (req, res) => {
  let { student_id, exam_id, session_id, answers_log, is_submitted, submitted_at, duration_seconds } = req.body;
  // Ép kiểu về số để tránh lỗi so khớp
  student_id = Number(student_id);
  exam_id = Number(exam_id);
  session_id = Number(session_id);
  try {
    // 1. Lấy danh sách câu hỏi của đề thi (theo đúng thứ tự)
    const questionsRes = await db.query(
      `SELECT q.id, q.correct_ans FROM exam_questions eq JOIN questions q ON eq.question_id = q.id WHERE eq.exam_id = $1 ORDER BY eq.order_index ASC`,
      [exam_id],
    );
    const questions = questionsRes.rows;
    // 2. Chuyển answers_log thành mảng đúng thứ tự câu hỏi
    const orderedAnswers = questions.map((q) => ({ question_id: q.id, answer: answers_log ? answers_log[q.id] || null : null }));

    // 3. Đối chiếu đáp án học sinh
    let correct = 0;
    let total = questions.length;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const userAns = orderedAnswers[i].answer;
      if (typeof userAns === 'string' && userAns.toUpperCase() === q.correct_ans.toUpperCase()) correct++;
    }
    // 4. Tính điểm (thang điểm 10, làm tròn 2 số thập phân)
    const score = total > 0 ? Math.round((correct / total) * 10 * 100) / 100 : 0;

    // 5. Kiểm tra đã có kết quả chưa (theo đúng constraint session_id, student_id)
    const existed = await db.query(`SELECT * FROM exam_results WHERE student_id=$1 AND session_id=$2`, [student_id, session_id]);
    let result;
    if (existed.rows.length > 0) {
      // Đã có: update lại exam_id, answers_log, score, is_submitted, submitted_at, duration_seconds
      result = await db.query(
        `UPDATE exam_results SET exam_id=$1, score=$2, answers_log=$3, is_submitted=$4, submitted_at=$5, duration_seconds=$6 WHERE id=$7 RETURNING *`,
        [exam_id, score, JSON.stringify(orderedAnswers), is_submitted || false, submitted_at, duration_seconds || 0, existed.rows[0].id],
      );
    } else {
      // Chưa có: insert mới
      try {
        result = await db.query(
          `INSERT INTO exam_results (student_id, exam_id, session_id, score, answers_log, is_submitted, submitted_at, duration_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING *`,
          [student_id, exam_id, session_id, score, JSON.stringify(orderedAnswers), is_submitted || false, submitted_at, duration_seconds || 0],
        );
      } catch (insertErr) {
        // Nếu lỗi duplicate key thì chuyển sang update
        if (insertErr.code === '23505') {
          const existed2 = await db.query(`SELECT * FROM exam_results WHERE student_id=$1 AND session_id=$2`, [student_id, session_id]);
          if (existed2.rows.length > 0) {
            result = await db.query(
              `UPDATE exam_results SET exam_id=$1, score=$2, answers_log=$3, is_submitted=$4, submitted_at=$5, duration_seconds=$6 WHERE id=$7 RETURNING *`,
              [exam_id, score, JSON.stringify(orderedAnswers), is_submitted || false, submitted_at, duration_seconds || 0, existed2.rows[0].id],
            );
          } else {
            throw insertErr;
          }
        } else {
          throw insertErr;
        }
      }
    }
    await createAuditLog({
      actor_id: req.body.actor_id || req.body.student_id || null,
      created_by: req.body.created_by || req.body.actor_username || null,
      action: existed.rows.length > 0 ? 'UPDATE' : 'CREATE',
      resource_type: 'exam_result',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].exam_id?.toString(),
      details: { student_id, exam_id, session_id, score, is_submitted, duration_seconds },
    });
    res.status(201).json(ExamResult.fromRow(result.rows[0]));
  } catch (error) {
    console.error('createExamResult error:', error);
    res.status(500).json({ error: 'Failed to create or update exam result' });
  }
};

// Nộp tự động: cập nhật bài thi nếu chưa nộp
const autoSubmitExamResult = async (req, res) => {
  const { student_id, exam_id, session_id, duration_seconds } = req.body;
  try {
    // Tìm bài thi chưa nộp
    const result = await db.query(`SELECT * FROM exam_results WHERE student_id=$1 AND exam_id=$2 AND session_id=$3 AND is_submitted=false LIMIT 1`, [
      student_id,
      exam_id,
      session_id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Không tìm thấy bài thi chưa nộp hoặc đã nộp rồi.' });
    }
    // Cập nhật trạng thái nộp tự động và thời gian làm bài
    const updated = await db.query(`UPDATE exam_results SET is_submitted=true, submitted_at=$1, duration_seconds=$2 WHERE id=$3 RETURNING *`, [
      new Date().toISOString(),
      duration_seconds || 0,
      result.rows[0].id,
    ]);
    await createAuditLog({
      actor_id: student_id,
      action: 'AUTO_SUBMIT',
      resource_type: 'exam_result',
      resource_id: result.rows[0].id?.toString() || null,
      resource_name: result.rows[0].exam_id?.toString(),
      details: { student_id, exam_id, session_id, auto: true, duration_seconds },
    });
    res.json(ExamResult.fromRow(updated.rows[0]));
  } catch (error) {
    console.error('autoSubmitExamResult error:', error);
    res.status(500).json({ error: 'Failed to auto submit exam result' });
  }
};

module.exports = {
  getAllExamResults,
  createExamResult,
  autoSubmitExamResult,
  getExamResultDetail,
  getExamResultsByStudent,
};
