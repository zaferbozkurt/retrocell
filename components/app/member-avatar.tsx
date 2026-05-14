"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";
import type { Member } from "@/lib/types";

type Size = "xs" | "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  xs: "size-5 text-[10px]",
  sm: "size-7 text-xs",
  md: "size-9 text-sm",
  lg: "size-12 text-base",
};

export function MemberAvatar({
  member,
  size = "sm",
  className,
  withTooltip = true,
  ring,
}: {
  member: Member | undefined;
  size?: Size;
  className?: string;
  withTooltip?: boolean;
  ring?: boolean;
}) {
  if (!member) {
    return (
      <Avatar className={cn(sizeClass[size], className)}>
        <AvatarFallback className="bg-muted text-muted-foreground">?</AvatarFallback>
      </Avatar>
    );
  }
  const node = (
    <Avatar
      className={cn(
        sizeClass[size],
        ring && "ring-2 ring-background",
        className,
      )}
      style={{ backgroundColor: member.color }}
    >
      <AvatarFallback
        className="text-white"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </AvatarFallback>
    </Avatar>
  );
  if (!withTooltip) return node;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{node}</span>
      </TooltipTrigger>
      <TooltipContent>
        {member.name}
        {member.role ? ` · ${member.role}` : ""}
      </TooltipContent>
    </Tooltip>
  );
}

export function MemberStack({
  members,
  size = "sm",
  max = 4,
  className,
}: {
  members: Member[];
  size?: Size;
  max?: number;
  className?: string;
}) {
  const shown = members.slice(0, max);
  const rest = members.length - shown.length;
  return (
    <div className={cn("flex -space-x-2", className)}>
      {shown.map((m) => (
        <MemberAvatar key={m.id} member={m} size={size} ring />
      ))}
      {rest > 0 ? (
        <Avatar className={cn(sizeClass[size], "ring-2 ring-background")}>
          <AvatarFallback className="bg-muted text-xs text-muted-foreground">
            +{rest}
          </AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
