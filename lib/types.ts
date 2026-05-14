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

export type Retro = {
  id: string;
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
  author: string;
  createdAt: string;
  similarToItemId?: string;
  similarReason?: string;
  isVague?: boolean;
  vagueQuestion?: string;
};

export type Action = {
  id: string;
  retroId: string;
  title: string;
  owner: string;
  status: ActionStatus;
  createdAt: string;
  closedAt?: string;
};

export type SprintNote = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  movedToRetro: boolean;
};

export type AppState = {
  currentUser: string;
  retros: Retro[];
  items: RetroItem[];
  actions: Action[];
  notes: SprintNote[];
};
