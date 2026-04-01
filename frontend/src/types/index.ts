// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = "tutor" | "student" | "parent" | "admin";

export interface AuthTokens {
  access_token: string;
  token_type: string;
  role: UserRole;
}

// ── Student ───────────────────────────────────────────────────────────────────
export type KeyStage = "KS3" | "KS4" | "KS5" | "College";
export type AbilityBand = "Foundation" | "Core" | "Higher" | "Extension";
export type MasteryStatus =
  | "not_started"
  | "taught"
  | "practising"
  | "developing"
  | "secure"
  | "needs_reteach"
  | "exceeded";

export interface Student {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  date_of_birth?: string;
  year_group?: string;
  key_stage?: KeyStage;
  ability_band?: AbilityBand;
  is_active: boolean;
  created_at: string;
}

export interface StudentDetail extends Student {
  send_notes?: string;
  support_strategies?: string;
  preferred_scaffolds?: string;
  literacy_notes?: string;
  communication_preferences?: string;
  additional_considerations?: Record<string, string>;
  tutor_id: number;
  user_id?: number;
}

// ── Curriculum ────────────────────────────────────────────────────────────────
export interface Subject {
  id: number;
  name: string;
  key_stage?: string;
  description?: string;
  is_active: boolean;
}

export interface Topic {
  id: number;
  subject_id: number;
  name: string;
  description?: string;
  year_group?: string;
  key_stage?: string;
  curriculum_ref?: string;
  order_index: number;
}

// ── Lesson ────────────────────────────────────────────────────────────────────
export type LessonType =
  | "introduction"
  | "revision"
  | "exam_prep"
  | "intervention"
  | "catch_up"
  | "consolidation"
  | "assessment";

export type DifficultyLevel = "foundation" | "core" | "higher" | "extension";

export interface LessonPlan {
  id: number;
  tutor_id: number;
  student_id: number;
  topic_id: number;
  title: string;
  lesson_type: LessonType;
  duration_minutes: number;
  difficulty_level: DifficultyLevel;
  learning_objective: string;
  content_json: Record<string, unknown>;
  ai_generated: boolean;
  tutor_approved: boolean;
  created_at: string;
  updated_at: string;
}

// ── Session ───────────────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "late" | "absent" | "cancelled";
export type SessionStatus = "scheduled" | "delivered" | "cancelled" | "no_show";

export interface LessonSession {
  id: number;
  lesson_plan_id?: number;
  student_id: number;
  tutor_id: number;
  scheduled_at: string;
  started_at?: string;
  ended_at?: string;
  attendance_status: AttendanceStatus;
  engagement_score?: number;
  tutor_notes?: string;
  session_summary?: string;
  status: SessionStatus;
  created_at: string;
}

// ── Assessment ────────────────────────────────────────────────────────────────
export interface QuizQuestion {
  question: string;
  question_type: "mcq" | "short" | "true_false";
  options?: string[];
  answer: string;
  marks: number;
  explanation?: string;
}

// ── Progress ──────────────────────────────────────────────────────────────────
export interface ProgressRecord {
  id: number;
  student_id: number;
  topic_id: number;
  topic_name: string;
  subject_name: string;
  mastery_status: MasteryStatus;
  sessions_on_topic: number;
  average_score?: number;
  tutor_override: boolean;
  last_assessed?: string;
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export interface Recommendation {
  rule_id: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  action: string;
  topic_id?: number;
  topic_name?: string;
}

export interface StudentAnalytics {
  student_id: number;
  student_name: string;
  total_sessions: number;
  attendance_rate: number;
  average_engagement?: number;
  average_quiz_score?: number;
  topics_secure: number;
  topics_needs_reteach: number;
  topics_not_started: number;
  last_session_date?: string;
  flagged_observations: number;
  outstanding_homework: number;
  recommendations: Recommendation[];
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface Report {
  id: number;
  student_id: number;
  generated_by: number;
  report_type: string;
  title: string;
  period_start?: string;
  period_end?: string;
  content_json: Record<string, unknown>;
  ai_draft?: string;
  final_text?: string;
  ai_generated: boolean;
  tutor_approved: boolean;
  approved_at?: string;
  pdf_path?: string;
  created_at: string;
}

// ── Homework ──────────────────────────────────────────────────────────────────
export type HomeworkStatus = "set" | "in_progress" | "submitted" | "marked" | "overdue";

export interface HomeworkTask {
  id: number;
  student_id: number;
  session_id?: number;
  title: string;
  description: string;
  due_date?: string;
  task_content_json: Record<string, unknown>;
  status: HomeworkStatus;
  ai_generated: boolean;
  tutor_approved: boolean;
  tutor_feedback?: string;
  completed_at?: string;
  created_at: string;
}

// ── Parent ────────────────────────────────────────────────────────────────────
export interface ParentGuardian {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  phone?: string;
  relationship_label: string;
  communication_preference: string;
  user_id: number;
  created_at: string;
  linked_student_ids?: number[];
  temp_password?: string; // only returned on creation
}

export interface ChildSummary {
  student_id: number;
  first_name: string;
  year_group?: string;
  key_stage?: string;
  total_sessions: number;
  attendance_rate: number;
  topics_secure: number;
  topics_needs_reteach: number;
  last_session_date?: string;
  outstanding_homework: number;
}

// ── User ──────────────────────────────────────────────────────────────────────
export interface CurrentUser {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  last_login?: string;
  created_at: string;
}

export interface TutorProfile {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  bio?: string;
  phone?: string;
  subjects_json?: string[];
  qualifications_json?: Array<{ title: string; institution: string }>;
}

// ── Student portal ────────────────────────────────────────────────────────────
export interface StudentDashboardData {
  student_name: string;
  year_group?: string;
  upcoming_sessions: number;
  total_topics_tracked: number;
  topics_secure: number;
  outstanding_homework: number;
  recent_sessions: Array<{
    id: number;
    scheduled_at: string;
    status: string;
    attendance_status: string;
  }>;
  homework: Array<{
    id: number;
    title: string;
    due_date?: string;
    status: HomeworkStatus;
  }>;
}

// ── Student summary (list view) ───────────────────────────────────────────────
export type StudentSummary = Student;

// ── Self reflection ───────────────────────────────────────────────────────────
export interface SelfReflection {
  id: number;
  student_id: number;
  session_id?: number;
  confidence_before?: number;
  confidence_after?: number;
  found_hard?: string;
  what_helped?: string;
  what_next?: string;
  tutor_read: boolean;
  created_at: string;
}

// ── Observation ───────────────────────────────────────────────────────────────
export type ObservationNoteType =
  | "observation"
  | "strength"
  | "misconception"
  | "concern"
  | "engagement"
  | "behaviour"
  | "general";

export interface ObservationNote {
  id: number;
  tutor_id: number;
  student_id: number;
  session_id?: number;
  note_type: ObservationNoteType;
  content: string;
  is_flagged: boolean;
  created_at: string;
}
