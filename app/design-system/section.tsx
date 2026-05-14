import { cn } from "@/lib/cn";

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("scroll-mt-12 border-t pt-10 first:border-t-0 first:pt-0", className)}>
      <div className="mb-6 space-y-1.5">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function Demo({
  label,
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
      )}
      <div className="rounded-lg border bg-card p-6">{children}</div>
    </div>
  );
}
