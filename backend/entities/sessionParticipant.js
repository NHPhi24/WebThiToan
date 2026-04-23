class SessionParticipant {
  constructor({ session_id, user_id, registered_at, register_status, has_joined }) {
    this.session_id = session_id;
    this.user_id = user_id;
    this.registered_at = registered_at;
    this.register_status = register_status;
    this.has_joined = has_joined ?? false;
  }

  static fromRow(row) {
    return new SessionParticipant(row);
  }
}

module.exports = SessionParticipant;
