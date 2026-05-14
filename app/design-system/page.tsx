import { ShowcaseClient } from "./showcase-client";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";

export default function DesignSystemPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <header className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Badge variant="secondary">Design system review</Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Pixel — component review
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground">
            Every component, in one page. Token-driven theming, full keyboard
            support via Radix Primitives, and Tailwind v4 utility classes.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <ShowcaseClient />
    </div>
  );
}
