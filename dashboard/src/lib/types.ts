/** One row of the Supabase `activity_logs` ledger (a completed event). */
export type ActivityLog = {
  gcal_event_id: string;
  title: string;
  done: boolean;
  occurred_on: string; // YYYY-MM-DD
  planned_start: string | null; // ISO timestamptz
  planned_end: string | null; // ISO timestamptz
  color: string | null; // #RRGGBB
  ended_at: string; // ISO timestamptz
};
