class SessionExam {
  constructor({ session_id, exam_id }) {
    this.session_id = session_id;
    this.exam_id = exam_id;
  }

  static fromRow(row) {
    return new SessionExam(row);
  }
}

module.exports = SessionExam;
