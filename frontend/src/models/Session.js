// frontend/src/utils/Session.js

class Session {
  constructor({ sessionId, grade, bookIds, teacherPersona }) {
    this.sessionId = sessionId;
    this.grade = grade;
    this.bookIds = bookIds;
    this.teacherPersona = teacherPersona;
  }

  static async create(grade, bookIds) {
    // Just create a random sessionId and save grade/bookIds
    const sessionId = Math.random().toString(36).substring(2);
    return new Session({ sessionId, grade, bookIds });
  }

  setSession(details) {
    Object.assign(this, details);
  }
}

export default Session;
