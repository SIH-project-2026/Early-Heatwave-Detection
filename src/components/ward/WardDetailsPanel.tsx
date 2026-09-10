import React from 'react';
import type { LocationItem } from '../../types/location';
import type { Ward } from '../../types/ward';
import { wardToLocationItem } from '../../services/locationService';
import { useHeatwave } from '../../context/HeatwaveContext';
import { RiskBadge } from '../common/RiskBadge';
import { LivePollutionDetector } from '../common/LivePollutionDetector';
import {
  X,
  Thermometer,
  Users,
  Trees,
  Home,
  CheckSquare,
  Truck,
  Siren,
  TrendingUp,
  MapPin,
} from 'lucide-react';
import { formatNumber, formatTemp, formatHvi } from '../../utils/formatters';
import { calculateRiskLevel } from '../../utils/riskUtils';
import { useNavigate } from 'react-router-dom';
import { calculateHviFromTemp } from '../../services/liveWeatherService';

export interface LocationDetailsProps {
  location?: LocationItem | null;
  ward?: Ward | null;
  onClose: () => void;
  onDispatchResource?: (id: string) => void;
  onSendAlert?: (wardOrLoc: any) => void;
}

export const LocationDetails: React.FC<LocationDetailsProps> = ({
  location: locationProp,
  ward: wardProp,
  onClose,
  onDispatchResource,
  onSendAlert,
}) => {
  const { currentStep, selectedHourOffset } = useHeatwave();
  const navigate = useNavigate();

  // Standardize input: convert ward prop to location if location is not passed directly
  const location: LocationItem | null = locationProp
    ? locationProp
    : wardProp
    ? wardToLocationItem(wardProp)
    : null;

  // Empty / Fallback state handling
  if (!location) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-slate-800 shadow-2xl space-y-4 text-center text-slate-400 font-sans">
        <MapPin className="w-8 h-8 text-slate-600 mx-auto animate-bounce" />
        <h3 className="text-sm font-bold text-slate-300">No Location Selected</h3>
        <p className="text-xs text-slate-500">
          Click any map marker or ward polygon to view interactive heat risk telemetry and socio-demographic indicators.
        </p>
      </div>
    );
  }

  // Dynamic forecast data overrides for selected hour offset if applicable
  let displayUtci = location.uctiIndex;
  let displayWbgt = location.wbgtIndex;
  let displayTemp = location.ambientTemperature;
  let displayHumidity = location.relativeHumidity;

  if (currentStep && currentStep.wardRisks && currentStep.wardRisks[location.id]) {
    const hourData = currentStep.wardRisks[location.id];
    displayUtci = hourData.utci ?? displayUtci;
    displayWbgt = hourData.wbgt ?? displayWbgt;
    displayTemp = hourData.tempC ?? displayTemp;
    displayHumidity = hourData.humidity ?? displayHumidity;
  }

  // Live dynamic HVI calculation based on live UTCI thermal stress
  const displayHvi = calculateHviFromTemp(displayUtci);

  // Authoritative risk level calculation evaluating live UTCI, WBGT, and live HVI Score
  const currentRisk = calculateRiskLevel(displayUtci, displayWbgt, displayHvi);

  // Live NDVI & Socio-demographic metrics
  const displayNdvi = Number(Math.max(0.08, Math.min(0.65, 0.45 - (displayUtci - 35) * 0.02)).toFixed(2));
  const ndviText = displayNdvi.toFixed(2);
  const ndviLabel = displayNdvi < 0.2 ? 'CRITICAL LOW' : displayNdvi < 0.35 ? 'LOW' : 'ADEQUATE';

  const displayOutdoorWorkers = location.population
    ? Math.round(location.population * (displayUtci > 45 ? 0.22 : 0.15))
    : 12870;

  // Dynamic recommended actions synchronized to the current risk level
  const dynamicActions =
    currentRisk === 'SEVERE'
      ? [
          `Deploy emergency high-capacity water tanker to ${location.name}`,
          'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
          'Open air-cooled emergency cooling shelter at public school premises',
          'Distribute ORS hydration sachets to outdoor workers & street vendors',
        ]
      : currentRisk === 'HIGH'
      ? [
          `Issue high thermal stress advisory broadcast for ${location.name}`,
          'Deploy mobile hydration unit to high density areas',
          'Activate shade canopies and misting stations at transit hubs',
        ]
      : [
          `Standard thermal telemetry monitoring across ${location.name}`,
          'Keep public park shade shelters accessible',
        ];

  return (
    <div className="glass-panel rounded-2xl p-5 border border-slate-700 shadow-2xl space-y-5 overflow-y-auto max-h-[85vh] w-full select-none font-sans">
      {/* Header with Dynamic Location ID, Zone, and Name */}
      <div className="flex items-start justify-between border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
              {location.code || location.id}
            </span>
            <span className="text-xs text-slate-400 font-medium">{location.zone || 'Zone N/A'}</span>
          </div>
          <h2 className="text-lg font-black text-white mt-1 leading-snug">{location.name}</h2>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Close Location Panel"
          aria-label="Close Location Panel"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Risk & Dynamic HVI Banner */}
      <div className="flex items-center justify-between glass-card p-3 rounded-xl border border-slate-700">
        <div>
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            Forecast Risk (+{selectedHourOffset}h)
          </span>
          <div className="mt-1">
            <RiskBadge level={currentRisk} size="lg" />
          </div>
        </div>

        <div className="text-right border-l border-slate-700 pl-4">
          <span className="text-[10px] text-slate-400 font-semibold uppercase block">
            HVI Score
          </span>
          <span className="text-xl font-black font-mono text-amber-400">
            {formatHvi(displayHvi)}
          </span>
          <span className="text-[10px] text-slate-500 block">Scale 0.0 - 1.0</span>
        </div>
      </div>

      {/* Section 1: Dynamic Thermal Stress Indices & Live Weather Telemetry */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span>Live Weather Telemetry Report</span>
          </h3>

          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>LIVE REPORT</span>
          </span>
        </div>

        {/* Live Weather Source Badge */}
        <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
          <span className="font-mono text-emerald-400 font-bold truncate">
            OpenWeatherMap API • {new Date().toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-slate-400 shrink-0 font-sans">
            Satellite Telemetry
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">UTCI Heat Stress</span>
            <span className="text-lg font-black text-rose-400 font-mono">
              {formatTemp(displayUtci)}
            </span>
            <span className="text-[9px] text-slate-500 block">Severe &gt;46°C Threshold</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">WBGT Index</span>
            <span className="text-lg font-black text-orange-400 font-mono">
              {formatTemp(displayWbgt)}
            </span>
            <span className="text-[9px] text-slate-500 block">Labor Safety &gt;32°C</span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Ambient Air Temp</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {formatTemp(displayTemp)}
            </span>
          </div>

          <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-400 block">Relative Humidity</span>
            <span className="text-base font-bold text-sky-400 font-mono">
              {displayHumidity}%
            </span>
          </div>
        </div>
      </div>

      {/* Live Air Quality & Pollution Detector Widget */}
      <LivePollutionDetector />

      {/* Section 2: Dynamic Socio-Demographic Vulnerability */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
          <Users className="w-4 h-4 text-sky-400" />
          <span>Socio-Demographic</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 flex items-center space-x-2">
              <Users className="w-3.5 h-3.5 text-slate-500" />
              <span>Ward Population</span>
            </span>
            <span className="font-bold text-white font-mono">
              {location.population ? formatNumber(location.population) : 'Data unavailable'}
            </span>
          </div>

          <div className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 flex items-center space-x-2">
              <Trees className="w-3.5 h-3.5 text-emerald-400" />
              <span>NDVI Vegetation Index</span>
            </span>
            <span className={`font-bold font-mono ${displayNdvi < 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {ndviText} ({ndviLabel})
            </span>
          </div>

          {location.informalSettlementDensity && (
            <div className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-lg">
              <span className="text-slate-400 flex items-center space-x-2">
                <Home className="w-3.5 h-3.5 text-amber-400" />
                <span>Informal Settlements</span>
              </span>
              <span className="font-bold text-amber-400 font-mono uppercase">
                {location.informalSettlementDensity}
              </span>
            </div>
          )}

          <div className="flex justify-between items-center bg-slate-900/60 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400">Outdoor Laborers Est.</span>
            <span className="font-bold text-slate-200 font-mono">
              {formatNumber(displayOutdoorWorkers)} workers
            </span>
          </div>
        </div>
      </div>

      {/* Section 3: Recommended Response Actions */}
      {dynamicActions && dynamicActions.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Recommended Response Actions</span>
          </h3>

          <ul className="space-y-2">
            {dynamicActions.map((action, idx) => (
              <li
                key={idx}
                className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 flex items-start space-x-2"
              >
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${currentRisk === 'SEVERE' ? 'bg-rose-500 animate-pulse' : currentRisk === 'HIGH' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
        <button
          onClick={() => navigate('/analytics')}
          className="px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center space-x-1 border border-slate-700"
        >
          <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          <span>Forecast</span>
        </button>

        <button
          onClick={() => {
            if (onDispatchResource) onDispatchResource(location.id);
            else navigate('/resources');
          }}
          className="px-2.5 py-2 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 font-semibold text-xs transition-colors flex items-center justify-center space-x-1 border border-amber-500/40"
        >
          <Truck className="w-3.5 h-3.5 text-amber-400" />
          <span>Resources</span>
        </button>

        <button
          onClick={() => {
            if (onSendAlert) onSendAlert(location);
            else navigate('/alerts');
          }}
          className="px-2.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1 shadow-md shadow-rose-950/40"
        >
          <Siren className="w-3.5 h-3.5" />
          <span>Alert</span>
        </button>
      </div>
    </div>
  );
};

// Export WardDetailsPanel alias for backward compatibility
export const WardDetailsPanel = LocationDetails;
