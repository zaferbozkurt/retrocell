import { Badge } from "@/components/ui/badge";
import { ACTION_STATUS_META, type ActionStatus } from "@/lib/types";

export function ActionStatusPill({ status }: { status: ActionStatus }) {
  const meta = ACTION_STATUS_META[status];
  return (
    <Badge variant={meta.tone} className="capitalize">
      {meta.label}
    </Badge>
  );
}
