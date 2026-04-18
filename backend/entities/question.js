class Question {
  constructor({ id, teacher_id, content, ans_a, ans_b, ans_c, ans_d, correct_ans, explanation, level, created_at }) {
    this.id = id;
    this.teacher_id = teacher_id;
    this.content = content;
    this.ans_a = ans_a;
    this.ans_b = ans_b;
    this.ans_c = ans_c;
    this.ans_d = ans_d;
    this.correct_ans = correct_ans;
    this.explanation = explanation;
    this.level = level;
    this.created_at = created_at;
  }

  static fromRow(row) {
    return new Question(row);
  }
}

module.exports = Question;
