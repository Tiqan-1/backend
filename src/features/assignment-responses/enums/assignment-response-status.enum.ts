export enum AssignmentResponseStatus {
    IN_PROGRESS = 'in-progress', // Student has started but not submitted
    SUBMITTED = 'submitted',     // Student has submitted, pending auto-grading/manager review
    GRADED = 'graded',           // Manager has finalized the grade
    PUBLISHED = 'published',     // Grade is released and visible to the student
}