"use client";

import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/cn";
import { toggleVariants } from "@/components/ui/toggle";

type ToggleVariantContextValue = VariantProps<typeof toggleVariants>;

const ToggleGroupContext = React.createContext<ToggleVariantContextValue>({
  size: "md",
  variant: "default",
});

export const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(
      "inline-flex items-center gap-0 rounded-md border bg-background p-0.5",
      className,
    )}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = "ToggleGroup";

export const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants>
>(({ className, variant, size, ...props }, ref) => {
  const ctx = React.useContext(ToggleGroupContext);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: variant ?? ctx.variant,
          size: size ?? ctx.size,
        }),
        "rounded-sm border-0",
        className,
      )}
      {...props}
    />
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";
