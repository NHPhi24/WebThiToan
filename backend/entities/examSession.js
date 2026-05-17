class ExamSession {
  constructor({
    id,
    session_name,
    start_time,
    duration,
    teacher_id,
    status,
    manual_status_time,
    created_at,
    exam_ids,
    grade,
    lock_duration_seconds,
    max_participants,
  }) {
    this.id = id;
    this.session_name = session_name;
    this.start_time = start_time;
    this.duration = duration;
    this.teacher_id = teacher_id;
    this.status = status;
    this.manual_status_time = manual_status_time;
    this.exam_ids = exam_ids;
    this.created_at = created_at;
    this.grade = grade;
    this.lock_duration_seconds = lock_duration_seconds;
    this.max_participants = max_participants;
  }

  static fromRow(row) {
    return new ExamSession(row);
  }
}

module.exports = ExamSession;
