// frontend/src/utils/Session.js

class Session {
  constructor({ sessionId, studentId, subjectId, featureId, grade, bookIds, teacherPersona }) {
    this.sessionId = sessionId;
    this.studentId = studentId;
    this.subjectId = subjectId;
    this.featureId = featureId;
    this.grade = grade;
    this.bookIds = bookIds;
    this.teacherPersona = teacherPersona;
  }

  static async create(studentId, subjectId = null, featureId = null) {
    // Create a random sessionId and save the IDs
    const sessionId = Math.random().toString(36).substring(2);
    return new Session({ 
      sessionId, 
      studentId, 
      subjectId, 
      featureId
    });
  }

  setSession(details) {
    Object.assign(this, details);
  }
}

export default Session;
