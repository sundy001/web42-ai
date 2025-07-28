"use client";

import { cn } from "@/lib/utils/cn";
import {
  Children,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

interface ResizablePanelsProps {
  className?: string;
  children: ReactNode;
  defaultLeftWidth?: number; // percentage
  minLeftWidth?: number; // pixels
  maxLeftWidth?: number; // pixels
  separatorClassName?: string;
}

export default function ResizablePanels({
  className,
  children,
  defaultLeftWidth = 50,
  minLeftWidth = 250,
  maxLeftWidth = 690,
  separatorClassName = "",
}: ResizablePanelsProps) {
  const [leftPanelWidth, setLeftPanelWidth] = useState(defaultLeftWidth);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Calculate min and max percentages based on container width
      const minPercent = (minLeftWidth / containerRect.width) * 100;
      const maxPercent = (maxLeftWidth / containerRect.width) * 100;

      setLeftPanelWidth(Math.min(Math.max(newWidth, minPercent), maxPercent));
    },
    [isResizing, minLeftWidth, maxLeftWidth],
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Extract exactly two children
  const childrenArray = Children.toArray(children);

  if (childrenArray.length !== 2) {
    throw new Error("ResizablePanels must contain exactly two children");
  }

  const [leftPanel, rightPanel] = childrenArray;

  return (
    <div className="flex h-full w-full" ref={containerRef}>
      {/* Left Panel */}
      <div
        className={cn("flex flex-col", className)}
        style={{
          width: `${leftPanelWidth}%`,
          minWidth: `${minLeftWidth}px`,
          maxWidth: `${maxLeftWidth}px`,
        }}
      >
        {leftPanel}
      </div>

      {/* Separator */}
      <div
        className={`w-1 bg-border hover:bg-primary/20 cursor-col-resize transition-colors relative group ${separatorClassName}`}
        onMouseDown={handleMouseDown}
      >
        <div className="absolute inset-y-0 -left-1 -right-1 group-hover:bg-primary/10" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">{rightPanel}</div>
    </div>
  );
}
