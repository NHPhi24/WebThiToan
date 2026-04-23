class ExamSession {
  constructor({ id, session_name, start_time, duration, teacher_id, status, manual_status_time, created_at, exam_ids }) {
    this.id = id;
    this.session_name = session_name;
    this.start_time = start_time;
    this.duration = duration;
    this.teacher_id = teacher_id;
    this.status = status;
    this.manual_status_time = manual_status_time;
    this.exam_ids = exam_ids;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new ExamSession(row);
  }
}

module.exports = ExamSession;
