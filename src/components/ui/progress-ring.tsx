"use client";

import { cn } from "@/lib/utils";

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const getProgressColor = (value: number) => {
  if (value === 0) return "rgb(156, 163, 175)"; // gray-400
  
  if (value <= 25) {
    // Transition from gray to red (0-25%)
    const progress = value / 25;
    return `rgb(${Math.round(156 + (239-156)*progress)},${Math.round(163 + (68-163)*progress)},${Math.round(175 + (68-175)*progress)})`;
  }
  
  if (value <= 60) {
    // Transition from red to yellow (25-60%)
    const progress = (value - 25) / 35;
    return `rgb(${Math.round(239 + (234-239)*progress)},${Math.round(68 + (179-68)*progress)},${Math.round(68 + (8-68)*progress)})`;
  }
  
  if (value <= 99) {
    // Transition from yellow to green (60-99%)
    const progress = (value - 60) / 39;
    return `rgb(${Math.round(234 + (22-234)*progress)},${Math.round(179 + (163-179)*progress)},${Math.round(8 + (74-8)*progress)})`;
  }
  
  // 100% is blue
  return "rgb(59, 130, 246)"; // blue-500
};

export function ProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  const color = getProgressColor(percentage);

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          stroke="rgb(156, 163, 175, 0.2)"
          fill="none"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className="transition-all duration-300 ease-in-out"
          stroke={color}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span style={{ color }}>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
} 