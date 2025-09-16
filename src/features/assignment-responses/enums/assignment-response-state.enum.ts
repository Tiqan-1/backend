export enum AssignmentResponseState {
    inProgress = 'in-progress', // Student has started but not submitted
    submitted = 'submitted', // Student has submitted, pending auto-grading/manager review
    graded = 'graded', // Manager has finalized the grade
    published = 'published', // Grade is released and visible to the student
    withdrawn = 'withdrawn', // Assignment is withdrawn by the manager
}
