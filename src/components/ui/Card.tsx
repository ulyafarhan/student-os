import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, children, glass, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-xl p-4 transition-all duration-300",
        glass 
          ? "bg-white/10 backdrop-blur-lg border border-white/20 shadow-xl" 
          : "bg-app-surface border border-app-border text-app-text-main", 
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};