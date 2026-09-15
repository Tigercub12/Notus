export interface User {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  google_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  canvas_image_url: string | null;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  note_id: string | null;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  recurrence_rule: string | null;
  is_notified: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  note_id: string;
  r2_key: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_at: string;
}
