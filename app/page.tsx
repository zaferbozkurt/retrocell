import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <Badge variant="secondary" className="gap-1.5">
          <Sparkles className="size-3" /> Pixel Design System
        </Badge>
        <div className="space-y-3">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            A Radix + Tailwind starter built for hackathons.
          </h1>
          <p className="text-pretty text-base text-muted-foreground sm:text-lg">
            Accessible primitives, semantic color tokens, light & dark themes.
            Drop it into any direction your idea takes.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/design-system">
              View the component review
              <ArrowRight />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </main>
  );
}
