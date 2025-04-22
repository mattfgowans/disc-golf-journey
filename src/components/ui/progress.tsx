"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value?: number;
  className?: string;
}

const getProgressColor = (value: number) => {
  if (value === 0) return "bg-gray-400/40";
  
  // For values between 0-100, calculate color transitions
  if (value <= 25) {
    // Transition from gray to red (0-25%)
    const intensity = (value / 25) * 100;
    return `bg-[rgb(${Math.round(211 + (244-211)*(value/25))},${Math.round(211 + (67-211)*(value/25))},${Math.round(211 + (54-211)*(value/25))}]/40`;
  }
  
  if (value <= 60) {
    // Transition from red to yellow (25-60%)
    const progress = (value - 25) / 35;
    return `bg-[rgb(${Math.round(244 + (234-244)*progress)},${Math.round(67 + (179-67)*progress)},${Math.round(54 + (8-54)*progress)}]/40`;
  }
  
  if (value <= 99) {
    // Transition from yellow to green (60-99%)
    const progress = (value - 60) / 39;
    return `bg-[rgb(${Math.round(234 + (22-234)*progress)},${Math.round(179 + (163-179)*progress)},${Math.round(8 + (74-8)*progress)}]/40`;
  }
  
  // 100% is blue
  return "bg-blue-500/40";
};

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value = 0, ...props }, ref) => {
  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-full w-full overflow-hidden rounded-lg bg-secondary/20",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all duration-300",
          getProgressColor(value)
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress } 