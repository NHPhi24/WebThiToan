class ExamTemplate {
  constructor({ id, template_name, total_questions, basic_percent, advanced_percent, teacher_id }) {
    this.id = id;
    this.template_name = template_name;
    this.total_questions = total_questions;
    this.basic_percent = basic_percent;
    this.advanced_percent = advanced_percent;
    this.teacher_id = teacher_id;
  }

  static fromRow(row) {
    return new ExamTemplate(row);
  }
}

module.exports = ExamTemplate;
