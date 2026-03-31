import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AdPlaceholderProps {
  type: 'banner' | 'rectangle';
  className?: string;
}

export function AdPlaceholder({ type, className }: AdPlaceholderProps) {
  return (
    <div 
      className={cn(
        "flex flex-col items-center justify-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-xl relative overflow-hidden group",
        type === 'banner' ? "w-full max-w-[728px] h-[90px] mx-auto my-6" : "w-full max-w-[300px] h-[250px] mx-auto my-4",
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 opacity-50"></div>
      <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase z-10">Advertisement</span>
      <span className="text-[10px] text-gray-300 mt-1 z-10">Adsterra Placeholder</span>
      
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"></div>
    </div>
  );
}
