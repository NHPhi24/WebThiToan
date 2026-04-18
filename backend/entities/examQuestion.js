class ExamQuestion {
  constructor({ exam_id, question_id, order_index }) {
    this.exam_id = exam_id;
    this.question_id = question_id;
    this.order_index = order_index;
  }

  static fromRow(row) {
    return new ExamQuestion(row);
  }
}

module.exports = ExamQuestion;
