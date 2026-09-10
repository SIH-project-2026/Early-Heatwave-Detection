import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading heatwave risk data & satellite forecast...',
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center min-h-[300px] ${className}`}>
      <div className="relative flex items-center justify-center">
        <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-rose-500 animate-spin" />
        <ShieldAlert className="w-6 h-6 text-rose-400 absolute" />
      </div>
      <p className="mt-4 text-sm font-medium text-slate-300 animate-pulse">{message}</p>
      <span className="mt-1 text-xs text-slate-500">Municipal Early Warning Command Center</span>
    </div>
  );
};
