import React from 'react';
import type { RiskLevel } from '../../types/risk';
import { getRiskConfig } from '../../utils/riskUtils';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  showIcon = true,
  size = 'md',
  className = '',
}) => {
  const config = getRiskConfig(level);

  const getIcon = () => {
    switch (level) {
      case 'SEVERE':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'HIGH':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      case 'MODERATE':
        return <AlertCircle className="w-3.5 h-3.5" />;
      case 'LOW':
        return <CheckCircle2 className="w-3.5 h-3.5" />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 font-semibold space-x-1.5',
    lg: 'text-sm px-3 py-1.5 font-bold space-x-2',
  };

  return (
    <span
      className={`inline-flex items-center shrink-0 whitespace-nowrap rounded-full border transition-all ${config.badgeClass} ${sizeClasses[size]} ${className}`}
      style={{
        boxShadow: level === 'SEVERE' ? '0 0 10px rgba(239, 68, 68, 0.4)' : undefined,
      }}
    >
      {showIcon && <span className="shrink-0">{getIcon()}</span>}
      <span className="uppercase tracking-wider whitespace-nowrap shrink-0">{config.label}</span>
    </span>
  );
};

