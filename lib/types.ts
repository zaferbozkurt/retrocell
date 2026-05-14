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

export type TeamMemberRole = "scrum_master" | "member";

export type Team = {
  id: string;
  name: string;
  inviteCode: string;
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
  revealed: boolean;
  similarToItemId?: string;
  similarReason?: string;
  isVague?: boolean;
  vagueQuestion?: string;
  sourceItemId?: string;
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
