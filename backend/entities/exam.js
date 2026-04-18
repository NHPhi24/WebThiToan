class Exam {
  constructor({ id, exam_code, template_id, teacher_id, created_at }) {
    this.id = id;
    this.exam_code = exam_code;
    this.template_id = template_id;
    this.teacher_id = teacher_id;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Exam(row);
  }
}

module.exports = Exam;
