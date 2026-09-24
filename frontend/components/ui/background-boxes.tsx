"use client";
import React from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

export const BoxesCore = ({ className, ...rest }: { className?: string }) => {
  const columns = 24;
  const rows = 16;
  const totalBoxes = columns * rows;
  
  const colors = [
    "#7dd3fc", // sky-300
    "#fbcfe8", // pink-300
    "#86efac", // green-300
    "#fde047", // yellow-300
    "#fca5a5", // red-300
    "#d8b4fe", // purple-300
    "#93c5fd", // blue-300
    "#c7d2fe", // indigo-300
    "#ddd6fe", // violet-300
  ];
  
  return (
    <div
      style={{
        transform: `translate(-15%, -20%) skewX(-48deg) skewY(14deg) scale(0.8) rotate(0deg) translateZ(0)`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gridTemplateRows: `repeat(${rows}, 1fr)`,
      }}
      className={cn(
        "absolute left-0 top-0 z-0 grid w-[150%] h-[150%] p-4 gap-0 border-l border-t border-solid border-slate-700/20 bg-slate-950/0.01",
        className
      )}
      {...rest}
    >
      {Array.from({ length: totalBoxes }).map((_, index) => {
        const r = Math.floor(index / columns);
        const c = index % columns;
        return (
          <motion.div
            key={index}
            whileHover={{
              backgroundColor: colors[index % colors.length],
              transition: { duration: 0 },
            }}
            animate={{
              backgroundColor: "rgba(0, 0, 0, 0)",
              transition: { duration: 1.5 },
            }}
            className="relative border-r border-b border-solid border-slate-700/20 w-full h-full bg-slate-950/0.01 flex items-center justify-center"
          >
            {/* Plus symbol decoration */}
            {r % 2 === 0 && c % 2 === 0 && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
                className="w-5 h-5 stroke-[0.5] text-slate-700/30 pointer-events-none select-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6v12m6-6H6"
                />
              </svg>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export const Boxes = React.memo(BoxesCore);
