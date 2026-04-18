class ExamSession {
  constructor({ id, session_name, start_time, duration, teacher_id, status, created_at }) {
    this.id = id;
    this.session_name = session_name;
    this.start_time = start_time;
    this.duration = duration;
    this.teacher_id = teacher_id;
    this.status = status;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new ExamSession(row);
  }
}

module.exports = ExamSession;
