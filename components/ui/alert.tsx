import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid grid-cols-[auto_1fr] gap-x-3 [&_svg]:size-4 [&_svg]:translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        info: "border-info/40 bg-info/10 text-foreground [&_svg]:text-info",
        success:
          "border-success/40 bg-success/10 text-foreground [&_svg]:text-success",
        warning:
          "border-warning/40 bg-warning/10 text-foreground [&_svg]:text-warning",
        destructive:
          "border-destructive/40 bg-destructive/10 text-foreground [&_svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  ),
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("col-start-2 font-medium leading-none tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("col-start-2 mt-1 text-sm text-muted-foreground", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";
