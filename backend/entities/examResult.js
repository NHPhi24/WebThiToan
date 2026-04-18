class ExamResult {
  constructor({ id, student_id, exam_id, session_id, score, answers_log, is_submitted, submitted_at }) {
    this.id = id;
    this.student_id = student_id;
    this.exam_id = exam_id;
    this.session_id = session_id;
    this.score = score;
    this.answers_log = answers_log;
    this.is_submitted = is_submitted;
    this.submitted_at = submitted_at;
  }

  static fromRow(row) {
    return new ExamResult(row);
  }
}

module.exports = ExamResult;
