class User {
  constructor({ id, username, password, full_name, email, role, created_by, profile_info, created_at, grade }) {
    this.id = id;
    this.username = username;
    this.password = password;
    this.full_name = full_name;
    this.email = email;
    this.role = role;
    this.created_by = created_by;
    this.profile_info = profile_info;
    this.created_at = created_at;
    this.grade = grade;
  }

  static fromRow(row) {
    return new User(row);
  }
}

module.exports = User;
