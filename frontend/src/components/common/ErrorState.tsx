import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to connect to heatwave telemetry service.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`glass-card rounded-2xl p-8 text-center flex flex-col items-center justify-center border-rose-500/30 ${className}`}>
      <div className="p-3 bg-rose-500/10 rounded-full text-rose-400 border border-rose-500/30 mb-3">
        <AlertOctagon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-bold text-white">Data Sync Interrupted</h3>
      <p className="mt-1 text-sm text-slate-300 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 inline-flex items-center space-x-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold text-xs transition-colors shadow-lg shadow-rose-950/50"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Retry Connection</span>
        </button>
      )}
    </div>
  );
};
