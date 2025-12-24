// frontend/src/utils/Session.js

class Session {
  constructor({ sessionId, studentId, subjectId, featureName, grade, bookIds, teacherPersona, chapterId }) {
    this.sessionId = sessionId;
    this.studentId = studentId;
    this.subjectId = subjectId;
    this.featureName = featureName;
    this.grade = grade;
    this.bookIds = bookIds;
    this.teacherPersona = teacherPersona;
    this.chapterId = chapterId;
  }

  static async create(studentId, subjectId = null, featureName = null, chapterId = null) {
    // Create a random sessionId and save the IDs
    const sessionId = Math.random().toString(36).substring(2);
    return new Session({ 
      sessionId, 
      studentId, 
      subjectId, 
      featureName,
      chapterId
    });
  }

  setSession(details) {
    Object.assign(this, details);
  }
}

export default Session;
