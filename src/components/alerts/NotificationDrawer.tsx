import React from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { X, Bell, CheckCircle2, Siren } from 'lucide-react';
import { formatDateTime } from '../../utils/formatters';
import { RiskBadge } from '../common/RiskBadge';
import { useNavigate } from 'react-router-dom';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { alerts, acknowledgeAlert } = useHeatwave();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const activeAlerts = alerts.filter((a) => a.status !== 'RESOLVED');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md glass-panel border-l border-slate-800 shadow-2xl flex flex-col justify-between p-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-rose-500 animate-bounce" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider">
                Emergency Notifications
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-1">
            {activeAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                No active heatwave warnings. All systems normal.
              </div>
            ) : (
              activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <RiskBadge level={alert.severity} size="sm" />
                    <span className="text-[10px] text-slate-500 font-mono">
                      {formatDateTime(alert.timestamp)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-white">{alert.title}</h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2">{alert.description}</p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-slate-400 font-semibold">{alert.wardName}</span>
                    <button
                      onClick={() => {
                        acknowledgeAlert(alert.id);
                      }}
                      className="text-[11px] text-amber-400 hover:underline font-bold"
                    >
                      Acknowledge
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={() => {
                onClose();
                navigate('/alerts');
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center space-x-2"
            >
              <Siren className="w-4 h-4" />
              <span>Open Emergency Alert Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;
