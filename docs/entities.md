## Entity Breakdown

### Summary

 - Teacher teaches particular subject, she has a persona and teaching style
 - Child learns particular subjects
 - Each subject is divided across chapters, and chapters across topics
 - Each topic has multiple lesson plans, depending on the days it require to teach that topic
 - Each topic can also specify or refer to the pre-requisite topics.. i.e. the topics a child would require to understand before he start with this topic
 - Each lesson plan has sections like I Do, We Do, You do, and a learning objective
 - Each section have how to teach - which is the teaching pedagogy
 - Each section can have set of resources only from belows types, which teacher can use to teach
    - Concept video
    - Questions
    - Quiz
    - Practice test
 - For each child as he learns we also maintain a reflection of his learning level, based on the evaluation of lesson plan that happened
 - LearningLevel is always at a topic level, and tells how a child is with that topic and can have information like
     - level: could be weak, average, strong
     - do not understand: hints or teacher notes of what a child do not understand in that topic
     - what next: hints or teacher notes of what a child should do next to improve further
 - Lesson plan are stitched for each individual.. So lesson plan would be for a child and a topic..i.e different child fo same topic can have different lesson plan.. For ex, for a PRO student lesson plan might me more about You Do, and practice. For weak.. It would be a lot of I Do, and learning..

### Tables

🧒 Child
* id
* name
* grade
* enrolled_subjects: (M:M with Subject)

👩‍🏫 Teacher
* id
* name
* persona (e.g. encouraging, strict, humorous)
* teaching_style (e.g. visual, inquiry-based, etc.)
* teaches_subjects: (M:M with Subject)

📚 Subject
* id
* name
* Relationship: 1:M with Chapter

📖 Chapter
* id
* name
* subject_id (FK)
* Relationship: 1:M with Topic

🧩 Topic
* id
* name
* chapter_id (FK)
* Relationship: 1:M with LessonPlan

📚 TopicPrerequisite
* topic_id – the topic to be taught
* prerequisite_topic_id – the topic that must be understood before

📘 LessonPlan
* id
* child_id (FK)
* topic_id (FK)
* learning_objective
* Relationship: 1:M with LessonSection

🧩 LessonSection
* id
* lesson_plan_id (FK)
* type: Enum(I Do, We Do, You Do)
* teaching_pedagogy
* M:M with Resource

🎥 Resource
* id
* type: Enum(Concept Video, Question, Quiz, Practice Test)
* url
* metadata (optional, like difficulty level, duration, etc.)

🌱 LearningLevel
* id
* child_id (FK)
* topic_id (FK)
* level: Enum(Weak, Average, Strong)
* do_not_understand: text
* what_next: text
* last_evaluated_on

🔗 Relationships Summary
* Child ↔ Subject: M:M
* Teacher ↔ Subject: M:M
* Subject → Chapter → Topic → LessonPlan → LessonSection
* LessonSection ↔ Resource: M:M
* Child ↔ Topic: via LearningLevel
