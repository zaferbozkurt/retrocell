export type Column = "glad" | "sad" | "action";

export const COLUMN_META: Record<
  Column,
  { title: string; subtitle: string; bg: string; border: string; chip: string; emoji: string }
> = {
  glad: {
    title: "İyi Gitti",
    subtitle: "Devam ettirelim",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    chip: "bg-emerald-100 text-emerald-800",
    emoji: "✨",
  },
  sad: {
    title: "Kötü Gitti",
    subtitle: "Bizi yavaşlatan şeyler",
    bg: "bg-rose-50",
    border: "border-rose-200",
    chip: "bg-rose-100 text-rose-800",
    emoji: "⚠️",
  },
  action: {
    title: "Aksiyon",
    subtitle: "Atılacak somut adımlar",
    bg: "bg-sky-50",
    border: "border-sky-200",
    chip: "bg-sky-100 text-sky-800",
    emoji: "🎯",
  },
};

export type RetroStatus = "active" | "closed";
export type ActionStatus = "open" | "in_progress" | "done";

export const ACTION_STATUS_META: Record<
  ActionStatus,
  { label: string; bg: string; text: string }
> = {
  open: { label: "Açık", bg: "bg-slate-100", text: "text-slate-700" },
  in_progress: { label: "Devam", bg: "bg-amber-100", text: "text-amber-800" },
  done: { label: "Tamamlandı", bg: "bg-emerald-100", text: "text-emerald-800" },
};

export type JiraStatus = "todo" | "in_progress" | "ready_to_test" | "done";

export const JIRA_STATUS_META: Record<
  JiraStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  todo: {
    label: "To Do",
    bg: "bg-slate-100",
    text: "text-slate-700",
    dot: "bg-slate-400",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-blue-100",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  ready_to_test: {
    label: "Ready to Test",
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  done: {
    label: "Done",
    bg: "bg-emerald-100",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
};

export type TeamMemberRole = "scrum_master" | "member";

export type Team = {
  id: string;
  slug: string;
  name: string;
  scrumMasterId: string;
  createdAt: string;
};

export type TeamMember = {
  id: string;
  teamId: string;
  name: string;
  role: TeamMemberRole;
  joinedAt: string;
};

export type Retro = {
  id: string;
  teamId: string;
  sprintName: string;
  date: string;
  status: RetroStatus;
  summary?: string;
};

export type RetroItem = {
  id: string;
  retroId: string;
  column: Column;
  text: string;
  authorId: string;
  createdAt: string;
  similarToItemId?: string;
  similarReason?: string;
  isVague?: boolean;
  vagueQuestion?: string;
  sourceItemId?: string;
  pastDiscussionActionId?: string;
  flagTczb?: boolean;
};

export type Action = {
  id: string;
  retroId: string;
  title: string;
  ownerId: string;
  status: ActionStatus;
  createdAt: string;
  closedAt?: string;
  sourceItemId?: string;
  jiraKey?: string;
  jiraStatus?: JiraStatus;
};

export type SprintNote = {
  id: string;
  teamId: string;
  text: string;
  authorId: string;
  createdAt: string;
  movedToRetro: boolean;
};

export type AppState = {
  teams: Team[];
  members: TeamMember[];
  currentTeamId: string | null;
  currentUserId: string | null;
  retros: Retro[];
  items: RetroItem[];
  actions: Action[];
  notes: SprintNote[];
};
