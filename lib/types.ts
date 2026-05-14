export type Member = {
  id: string;
  name: string;
  initials: string;
  color: string;
  role?: string;
};

export type ColumnId = "went-well" | "didnt-go-well" | "ideas" | "shoutouts";

export const COLUMN_META: Record<
  ColumnId,
  { title: string; subtitle: string; accent: string; emoji: string }
> = {
  "went-well": {
    title: "Went well",
    subtitle: "What we want to repeat",
    accent: "success",
    emoji: "✨",
  },
  "didnt-go-well": {
    title: "Didn't go well",
    subtitle: "What slowed us down",
    accent: "destructive",
    emoji: "⚠️",
  },
  ideas: {
    title: "Ideas",
    subtitle: "What we could try next",
    accent: "info",
    emoji: "💡",
  },
  shoutouts: {
    title: "Shoutouts",
    subtitle: "Who deserves recognition",
    accent: "warning",
    emoji: "🎉",
  },
};

export type RetroStatus = "draft" | "live" | "closed";

export type Retro = {
  id: string;
  title: string;
  sprintLabel?: string;
  status: RetroStatus;
  facilitatorId: string;
  createdAt: string;
  closedAt?: string;
  summary?: string;
  participants: string[]; // member ids
};

export type RetroItem = {
  id: string;
  retroId: string;
  columnId: ColumnId;
  content: string;
  authorId: string;
  votes: string[]; // member ids
  createdAt: string;
  linkedActionId?: string;
};

export type ActionStatus =
  | "open"
  | "in_progress"
  | "blocked"
  | "done"
  | "dropped";

export const ACTION_STATUS_META: Record<
  ActionStatus,
  { label: string; tone: "default" | "info" | "warning" | "success" | "destructive" | "secondary" }
> = {
  open: { label: "Open", tone: "secondary" },
  in_progress: { label: "In progress", tone: "info" },
  blocked: { label: "Blocked", tone: "warning" },
  done: { label: "Done", tone: "success" },
  dropped: { label: "Dropped", tone: "destructive" },
};

export type ActionHistoryEntry = {
  at: string;
  type:
    | "created"
    | "status"
    | "owner"
    | "due"
    | "comment"
    | "nudge"
    | "carried"
    | "edited";
  from?: string;
  to?: string;
  note?: string;
  byId?: string;
};

export type ActionNudge = {
  at: string;
  byId: string;
  message: string;
};

export type ActionItem = {
  id: string;
  title: string;
  detail?: string;
  ownerId: string;
  dueDate: string; // YYYY-MM-DD
  status: ActionStatus;
  retroId: string;
  sourceItemId?: string;
  createdAt: string;
  updatedAt: string;
  carriedOverCount: number;
  history: ActionHistoryEntry[];
  nudges: ActionNudge[];
};

export type AppState = {
  currentUserId: string;
  members: Member[];
  retros: Retro[];
  retroItems: RetroItem[];
  actions: ActionItem[];
  teamName: string;
};
