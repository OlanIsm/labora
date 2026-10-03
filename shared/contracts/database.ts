export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      assignment_recipients: {
        Row: {
          assigned_at: string;
          assignment_version_id: string;
          source_class_id: string | null;
          student_id: string;
        };
        Insert: {
          assigned_at?: string;
          assignment_version_id: string;
          source_class_id?: string | null;
          student_id: string;
        };
        Update: {
          assigned_at?: string;
          assignment_version_id?: string;
          source_class_id?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_recipients_assignment_version_id_fkey";
            columns: ["assignment_version_id"];
            isOneToOne: false;
            referencedRelation: "assignment_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_recipients_source_class_id_fkey";
            columns: ["source_class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_recipients_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_targets: {
        Row: {
          assignment_id: string;
          class_id: string | null;
          id: string;
          student_id: string | null;
        };
        Insert: {
          assignment_id: string;
          class_id?: string | null;
          id?: string;
          student_id?: string | null;
        };
        Update: {
          assignment_id?: string;
          class_id?: string | null;
          id?: string;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_targets_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_targets_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_targets_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      assignment_versions: {
        Row: {
          assignment_id: string;
          config: NonNullable<Json>;
          experiment_version_id: string;
          id: string;
          published_at: string;
          version: number;
        };
        Insert: {
          assignment_id: string;
          config: NonNullable<Json>;
          experiment_version_id: string;
          id?: string;
          published_at?: string;
          version: number;
        };
        Update: {
          assignment_id?: string;
          config?: NonNullable<Json>;
          experiment_version_id?: string;
          id?: string;
          published_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "assignment_versions_assignment_id_fkey";
            columns: ["assignment_id"];
            isOneToOne: false;
            referencedRelation: "assignments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignment_versions_experiment_version_id_fkey";
            columns: ["experiment_version_id"];
            isOneToOne: false;
            referencedRelation: "experiment_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      assignments: {
        Row: {
          created_at: string;
          draft_config: NonNullable<Json>;
          due_at: string | null;
          experiment_id: string;
          id: string;
          published_version_id: string | null;
          revision: number;
          school_id: string;
          status: string;
          teacher_id: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          draft_config: NonNullable<Json>;
          due_at?: string | null;
          experiment_id: string;
          id?: string;
          published_version_id?: string | null;
          revision?: number;
          school_id: string;
          status?: string;
          teacher_id: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          draft_config?: NonNullable<Json>;
          due_at?: string | null;
          experiment_id?: string;
          id?: string;
          published_version_id?: string | null;
          revision?: number;
          school_id?: string;
          status?: string;
          teacher_id?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "assignments_experiment_id_fkey";
            columns: ["experiment_id"];
            isOneToOne: false;
            referencedRelation: "experiments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_published_version_id_id_fkey";
            columns: ["published_version_id", "id"];
            isOneToOne: false;
            referencedRelation: "assignment_versions";
            referencedColumns: ["id", "assignment_id"];
          },
          {
            foreignKeyName: "assignments_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      class_members: {
        Row: {
          class_id: string;
          joined_at: string;
          left_at: string | null;
          student_id: string;
        };
        Insert: {
          class_id: string;
          joined_at?: string;
          left_at?: string | null;
          student_id: string;
        };
        Update: {
          class_id?: string;
          joined_at?: string;
          left_at?: string | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "class_members_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          archived_at: string | null;
          created_at: string;
          id: string;
          name: string;
          school_id: string;
          teacher_id: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          school_id: string;
          teacher_id: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          id?: string;
          name?: string;
          school_id?: string;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "classes_teacher_id_fkey";
            columns: ["teacher_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      experiment_results: {
        Row: {
          assignment_version_id: string | null;
          completed_at: string;
          experiment_accuracy: number;
          experiment_version_id: string;
          id: string;
          observations: NonNullable<Json>;
          quiz_accuracy: number;
          score: number;
          scoring_version: number;
          session_id: string;
          steps_completed: number;
          steps_total: number;
          student_id: string;
        };
        Insert: {
          assignment_version_id?: string | null;
          completed_at?: string;
          experiment_accuracy: number;
          experiment_version_id: string;
          id?: string;
          observations: NonNullable<Json>;
          quiz_accuracy: number;
          score: number;
          scoring_version?: number;
          session_id: string;
          steps_completed: number;
          steps_total: number;
          student_id: string;
        };
        Update: {
          assignment_version_id?: string | null;
          completed_at?: string;
          experiment_accuracy?: number;
          experiment_version_id?: string;
          id?: string;
          observations?: NonNullable<Json>;
          quiz_accuracy?: number;
          score?: number;
          scoring_version?: number;
          session_id?: string;
          steps_completed?: number;
          steps_total?: number;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experiment_results_assignment_version_id_fkey";
            columns: ["assignment_version_id"];
            isOneToOne: false;
            referencedRelation: "assignment_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiment_results_experiment_version_id_fkey";
            columns: ["experiment_version_id"];
            isOneToOne: false;
            referencedRelation: "experiment_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiment_results_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "lab_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "experiment_results_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      experiment_versions: {
        Row: {
          created_at: string;
          definition: NonNullable<Json>;
          engine_version: number;
          experiment_id: string;
          id: string;
          version: number;
        };
        Insert: {
          created_at?: string;
          definition: NonNullable<Json>;
          engine_version?: number;
          experiment_id: string;
          id?: string;
          version: number;
        };
        Update: {
          created_at?: string;
          definition?: NonNullable<Json>;
          engine_version?: number;
          experiment_id?: string;
          id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: "experiment_versions_experiment_id_fkey";
            columns: ["experiment_id"];
            isOneToOne: false;
            referencedRelation: "experiments";
            referencedColumns: ["id"];
          },
        ];
      };
      experiments: {
        Row: {
          created_at: string;
          current_version_id: string | null;
          duration_minutes: number;
          id: string;
          published: boolean;
          subject: string;
          summary: string;
          title: string;
        };
        Insert: {
          created_at?: string;
          current_version_id?: string | null;
          duration_minutes: number;
          id: string;
          published?: boolean;
          subject: string;
          summary: string;
          title: string;
        };
        Update: {
          created_at?: string;
          current_version_id?: string | null;
          duration_minutes?: number;
          id?: string;
          published?: boolean;
          subject?: string;
          summary?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "experiments_current_version_id_id_fkey";
            columns: ["current_version_id", "id"];
            isOneToOne: false;
            referencedRelation: "experiment_versions";
            referencedColumns: ["id", "experiment_id"];
          },
        ];
      };
      invitations: {
        Row: {
          class_id: string | null;
          created_by: string;
          expires_at: string;
          id: string;
          invited_email: string | null;
          max_uses: number;
          revoked_at: string | null;
          role: string;
          school_id: string;
          token_hash: string;
          uses: number;
        };
        Insert: {
          class_id?: string | null;
          created_by: string;
          expires_at: string;
          id?: string;
          invited_email?: string | null;
          max_uses: number;
          revoked_at?: string | null;
          role: string;
          school_id: string;
          token_hash: string;
          uses?: number;
        };
        Update: {
          class_id?: string | null;
          created_by?: string;
          expires_at?: string;
          id?: string;
          invited_email?: string | null;
          max_uses?: number;
          revoked_at?: string | null;
          role?: string;
          school_id?: string;
          token_hash?: string;
          uses?: number;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_class_id_school_id_fkey";
            columns: ["class_id", "school_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id", "school_id"];
          },
          {
            foreignKeyName: "invitations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_actions: {
        Row: {
          accepted: boolean;
          action_type: string;
          client_event_id: string;
          created_at: string;
          feedback: string;
          id: string;
          outcome: NonNullable<Json>;
          payload: NonNullable<Json>;
          sequence: number;
          session_id: string;
        };
        Insert: {
          accepted: boolean;
          action_type: string;
          client_event_id: string;
          created_at?: string;
          feedback: string;
          id?: string;
          outcome: NonNullable<Json>;
          payload: NonNullable<Json>;
          sequence: number;
          session_id: string;
        };
        Update: {
          accepted?: boolean;
          action_type?: string;
          client_event_id?: string;
          created_at?: string;
          feedback?: string;
          id?: string;
          outcome?: NonNullable<Json>;
          payload?: NonNullable<Json>;
          sequence?: number;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_actions_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "lab_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_notes: {
        Row: {
          author_id: string;
          conclusion: string;
          created_at: string;
          hypothesis: string;
          id: string;
          measurement_snapshot: NonNullable<Json>;
          observation: string;
          session_id: string;
          updated_at: string;
        };
        Insert: {
          author_id: string;
          conclusion?: string;
          created_at?: string;
          hypothesis?: string;
          id?: string;
          measurement_snapshot?: NonNullable<Json>;
          observation?: string;
          session_id: string;
          updated_at?: string;
        };
        Update: {
          author_id?: string;
          conclusion?: string;
          created_at?: string;
          hypothesis?: string;
          id?: string;
          measurement_snapshot?: NonNullable<Json>;
          observation?: string;
          session_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lab_notes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_notes_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "lab_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      lab_sessions: {
        Row: {
          assignment_version_id: string | null;
          current_step: number;
          experiment_version_id: string | null;
          id: string;
          last_saved_at: string;
          mode: string;
          revision: number;
          simulation_key: string | null;
          start_event_id: string;
          started_at: string;
          state: NonNullable<Json>;
          state_version: number;
          status: string;
          student_id: string;
          subject: string;
          submitted_at: string | null;
        };
        Insert: {
          assignment_version_id?: string | null;
          current_step?: number;
          experiment_version_id?: string | null;
          id?: string;
          last_saved_at?: string;
          mode: string;
          revision?: number;
          simulation_key?: string | null;
          start_event_id: string;
          started_at?: string;
          state: NonNullable<Json>;
          state_version?: number;
          status?: string;
          student_id: string;
          subject: string;
          submitted_at?: string | null;
        };
        Update: {
          assignment_version_id?: string | null;
          current_step?: number;
          experiment_version_id?: string | null;
          id?: string;
          last_saved_at?: string;
          mode?: string;
          revision?: number;
          simulation_key?: string | null;
          start_event_id?: string;
          started_at?: string;
          state?: NonNullable<Json>;
          state_version?: number;
          status?: string;
          student_id?: string;
          subject?: string;
          submitted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lab_sessions_assignment_version_id_experiment_version_id_fkey";
            columns: ["assignment_version_id", "experiment_version_id"];
            isOneToOne: false;
            referencedRelation: "assignment_versions";
            referencedColumns: ["id", "experiment_version_id"];
          },
          {
            foreignKeyName: "lab_sessions_assignment_version_id_student_id_fkey";
            columns: ["assignment_version_id", "student_id"];
            isOneToOne: false;
            referencedRelation: "assignment_recipients";
            referencedColumns: ["assignment_version_id", "student_id"];
          },
          {
            foreignKeyName: "lab_sessions_experiment_version_id_fkey";
            columns: ["experiment_version_id"];
            isOneToOne: false;
            referencedRelation: "experiment_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lab_sessions_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          assignment_version_id: string | null;
          created_at: string;
          dedupe_key: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          result_id: string | null;
          type: string;
        };
        Insert: {
          assignment_version_id?: string | null;
          created_at?: string;
          dedupe_key: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          result_id?: string | null;
          type: string;
        };
        Update: {
          assignment_version_id?: string | null;
          created_at?: string;
          dedupe_key?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          result_id?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_assignment_version_id_fkey";
            columns: ["assignment_version_id"];
            isOneToOne: false;
            referencedRelation: "assignment_versions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey";
            columns: ["recipient_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_result_id_fkey";
            columns: ["result_id"];
            isOneToOne: false;
            referencedRelation: "experiment_results";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          created_at: string;
          display_name: string;
          id: string;
          preferences: NonNullable<Json>;
          updated_at: string;
        };
        Insert: {
          avatar_path?: string | null;
          created_at?: string;
          display_name: string;
          id: string;
          preferences?: NonNullable<Json>;
          updated_at?: string;
        };
        Update: {
          avatar_path?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          preferences?: NonNullable<Json>;
          updated_at?: string;
        };
        Relationships: [];
      };
      quiz_responses: {
        Row: {
          answer: NonNullable<Json>;
          answered_at: string;
          attempt_no: number;
          id: string;
          is_correct: boolean;
          points_awarded: number;
          question_key: string;
          session_id: string;
        };
        Insert: {
          answer: NonNullable<Json>;
          answered_at?: string;
          attempt_no: number;
          id?: string;
          is_correct: boolean;
          points_awarded: number;
          question_key: string;
          session_id: string;
        };
        Update: {
          answer?: NonNullable<Json>;
          answered_at?: string;
          attempt_no?: number;
          id?: string;
          is_correct?: boolean;
          points_awarded?: number;
          question_key?: string;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quiz_responses_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "lab_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      school_members: {
        Row: {
          joined_at: string;
          role: string;
          school_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          role: string;
          school_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          role?: string;
          school_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          owner_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          owner_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          owner_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "schools_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      labora_accept_invitation: {
        Args: { actor: string; digest: string; email_address: string };
        Returns: Json;
      };
      labora_answer_keys: {
        Args: { assignment_id?: string; version_id: string };
        Returns: Json;
      };
      labora_assignment_report: {
        Args: {
          actor: string;
          assignment: string;
          page_limit: number;
          page_offset: number;
        };
        Returns: Json;
      };
      labora_commit_event: {
        Args: {
          actor: string;
          event: string;
          event_payload: Json;
          event_type: string;
          expected_revision: number;
          is_accepted: boolean;
          new_state: Json;
          quiz?: Json;
          response: Json;
          session: string;
        };
        Returns: Json;
      };
      labora_create_school: {
        Args: { actor: string; school_name: string };
        Returns: Json;
      };
      labora_progress_summary: { Args: { actor: string }; Returns: Json };
      labora_publish: {
        Args: {
          actor: string;
          assignment: string;
          classes: string[];
          expected_revision: number;
          keys: Json;
          public_config: Json;
        };
        Returns: Json;
      };
      labora_rate_limit: {
        Args: { quota: number; scope_key: string };
        Returns: boolean;
      };
      labora_submit: {
        Args: {
          actor: string;
          assessment: Json;
          expected_revision: number;
          session: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
