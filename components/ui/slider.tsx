"use client";

import { Slider as SliderPrimitive } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/cn";

export const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => {
  const values =
    (props.value as number[] | undefined) ??
    (props.defaultValue as number[] | undefined) ?? [props.min ?? 0];
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        "data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:flex-col",
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5">
        <SliderPrimitive.Range className="absolute h-full bg-primary data-[orientation=vertical]:w-full" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          key={i}
          className={cn(
            "block size-4 rounded-full border border-primary/50 bg-background shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            "disabled:pointer-events-none disabled:opacity-50",
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});
Slider.displayName = "Slider";
