"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

function subscribe() {
  return () => {};
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  if (!mounted) {
    return <div className="h-9 w-[108px] rounded-md bg-muted" aria-hidden />;
  }

  return (
    <ToggleGroup
      type="single"
      value={theme ?? "system"}
      onValueChange={(value) => value && setTheme(value)}
      aria-label="Theme"
      size="sm"
    >
      <ToggleGroupItem value="light" aria-label="Light theme">
        <Sun className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="system" aria-label="System theme">
        <Monitor className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" aria-label="Dark theme">
        <Moon className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
