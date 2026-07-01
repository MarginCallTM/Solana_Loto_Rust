"use client";

// Infinite "notification stack" primitive (motion/react).
// A sliding window of the last `maxVisible` events: each tick a new item springs
// in at the top and the oldest springs out at the bottom, looping forever over
// the children. Content-agnostic: callers pass their own cards as children.
import React, {
  ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion, MotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export function AnimatedListItem({ children }: { children: React.ReactNode }) {
  const animations: MotionProps = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1, originY: 0 },
    exit: { scale: 0, opacity: 0 },
    transition: { type: "spring", stiffness: 350, damping: 40 },
  };

  return (
    <motion.div {...animations} layout className="mx-auto w-full">
      {children}
    </motion.div>
  );
}

export interface AnimatedListProps extends ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  delay?: number;
  maxVisible?: number;
}

export const AnimatedList = React.memo(
  ({
    children,
    className,
    delay = 1000,
    maxVisible = 6,
    ...props
  }: AnimatedListProps) => {
    const [index, setIndex] = useState(0);
    const childrenArray = useMemo(
      () => React.Children.toArray(children),
      [children],
    );

    // Advance forever — index never resets, so the feed loops endlessly.
    useEffect(() => {
      if (childrenArray.length === 0) return;
      const timeout = setTimeout(() => setIndex((i) => i + 1), delay);
      return () => clearTimeout(timeout);
    }, [index, delay, childrenArray.length]);

    // The last `maxVisible` positions, newest first, mapped cyclically onto the
    // children so it never runs out. `pos` is monotonic → stable unique keys,
    // so AnimatePresence sees exactly one enter (top) and one exit (bottom).
    const itemsToShow = useMemo(() => {
      const len = childrenArray.length;
      if (len === 0) return [];
      const out: React.ReactNode[] = [];
      for (let k = 0; k < maxVisible; k++) {
        const pos = index - k;
        if (pos < 0) break;
        const child = childrenArray[pos % len] as React.ReactElement;
        out.push(<AnimatedListItem key={pos}>{child}</AnimatedListItem>);
      }
      return out;
    }, [index, childrenArray, maxVisible]);

    return (
      <div
        className={cn("flex flex-col items-center gap-4", className)}
        {...props}
      >
        <AnimatePresence>{itemsToShow}</AnimatePresence>
      </div>
    );
  },
);
AnimatedList.displayName = "AnimatedList";
