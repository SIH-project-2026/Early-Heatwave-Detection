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
  Building2,
  Phone,
  Clock,
  Activity,
  CheckCircle2,
  Bed,
  ShieldAlert,
} from 'lucide-react';
import { formatNumber, formatTemp, formatHvi } from '../../utils/formatters';
import { calculateRiskLevel } from '../../utils/riskUtils';
import { useNavigate } from 'react-router-dom';
import { calculateHviFromTemp } from '../../services/liveWeatherService';
import { resolveAmbulanceForLocation, resolveHospitalForLocation } from '../../utils/medicalUtils';
import { playDispatchSound, playHeatwaveAlertSound } from '../../utils/soundService';

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
  const { currentStep, selectedHourOffset, resources, dispatchResource, activeRegion } = useHeatwave();
  const navigate = useNavigate();

  // Track dispatched units and alerted hospitals keyed by unit ID or location ID
  const [dispatchedUnitIds, setDispatchedUnitIds] = React.useState<Set<string>>(new Set());
  const [alertedHospitalIds, setAlertedHospitalIds] = React.useState<Set<string>>(new Set());

  // Standardize input: convert ward prop to location if location is not passed directly
  const location: LocationItem | null = locationProp
    ? locationProp
    : wardProp
    ? wardToLocationItem(wardProp)
    : null;

  // Empty / Fallback state handling
  if (!location) {
    return (
      <div className="rounded-3xl bg-[#181920] p-6 border border-white/[0.08] shadow-2xl space-y-4 text-center text-slate-400 font-sans card-highlight-rim">
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

  if (selectedHourOffset !== 0 && currentStep && currentStep.wardRisks && currentStep.wardRisks[location.id]) {
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

  // Play gentle heatwave alert chime when inspecting a severe risk ward
  React.useEffect(() => {
    if (currentRisk === 'SEVERE') {
      playHeatwaveAlertSound();
    }
  }, [currentRisk, location.id]);

  // Live NDVI & Socio-demographic metrics
  const displayNdvi = Number(Math.max(0.08, Math.min(0.65, 0.45 - (displayUtci - 35) * 0.02)).toFixed(2));
  const ndviText = displayNdvi.toFixed(2);
  const ndviLabel = displayNdvi < 0.2 ? 'CRITICAL LOW' : displayNdvi < 0.35 ? 'LOW' : 'ADEQUATE';

  const displayOutdoorWorkers = location.population
    ? Math.round(location.population * (displayUtci > 45 ? 0.22 : 0.15))
    : 12870;

  // Dynamically resolve location-tailored Ambulance and Hospital services specifically for THIS location!
  const assignedAmbulance = React.useMemo(() => {
    return resolveAmbulanceForLocation(location, activeRegion, resources);
  }, [location, activeRegion, resources]);

  const assignedHospital = React.useMemo(() => {
    return resolveHospitalForLocation(location, activeRegion, resources);
  }, [location, activeRegion, resources]);

  const isAmbulanceDispatched =
    assignedAmbulance.status === 'DISPATCHED' ||
    dispatchedUnitIds.has(assignedAmbulance.id) ||
    dispatchedUnitIds.has(location.id);

  const isHospitalAlerted =
    assignedHospital.status === 'DISPATCHED' ||
    alertedHospitalIds.has(assignedHospital.id) ||
    alertedHospitalIds.has(location.id);

  // Dynamic recommended actions synchronized to the current risk level
  const dynamicActions =
    currentRisk === 'SEVERE'
      ? [
          `Pre-position ALS Ambulance (${assignedAmbulance.name}) with ice immersion at ${location.name}`,
          `Pre-alert ${assignedHospital.name} emergency room for heatstroke admissions`,
          `Deploy emergency high-capacity water tanker to ${location.name}`,
          'Halt outdoor labor & heavy construction (11 AM - 4 PM)',
          'Open air-cooled emergency cooling shelter at public school premises',
          'Distribute ORS hydration sachets to outdoor workers & street vendors',
        ]
      : currentRisk === 'HIGH'
      ? [
          `Place mobile heat emergency ambulance on standby for ${location.name}`,
          `Pre-alert nearest hospital trauma department for potential heat exhaustion casualties`,
          `Issue high thermal stress advisory broadcast for ${location.name}`,
          'Deploy mobile hydration unit to high density areas',
          'Activate shade canopies and misting stations at transit hubs',
        ]
      : [
          `Standard thermal telemetry monitoring across ${location.name}`,
          'Keep public park shade shelters accessible',
        ];

  return (
    <div className="rounded-3xl bg-[#181920] border border-white/[0.08] shadow-2xl w-full select-none font-sans card-highlight-rim flex flex-col h-[580px] sm:h-[620px] xl:h-[640px] max-h-[88vh] overflow-hidden">
      {/* 1. PINNED HEADER: Ward Code, Telemetry Tag, Close Button, Title, Zone, Coordinates */}
      <div className="p-4 sm:p-5 border-b border-white/[0.08] bg-[#181920] shrink-0 space-y-2 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center space-x-2 min-w-0">
            <span className="text-xs font-mono font-bold text-rose-300 bg-rose-500/15 px-2.5 py-1 rounded-xl border border-rose-500/30 whitespace-nowrap shrink-0 shadow-sm">
              {location.code || location.id}
            </span>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wide truncate">
              Live Telemetry
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0 border border-white/[0.06]"
            title="Close Location Panel"
            aria-label="Close Location Panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h2 className="text-base sm:text-lg font-bold text-white font-sans tracking-tight leading-snug break-words">
            {location.name}
          </h2>
          {location.zone && (
            <div className="text-[11px] text-slate-300 font-mono mt-0.5 leading-snug break-words">
              {location.zone}
            </div>
          )}
          {location.coordinates && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-400 font-mono mt-1">
              <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>
                {location.coordinates[1].toFixed(4)}°N, {location.coordinates[0].toFixed(4)}°E
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400 font-sans">Active Ward Station</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SCROLLABLE CONTENT BODY */}
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Primary Risk & Dynamic HVI Banner */}
        <div className="relative overflow-hidden rounded-2xl p-4 border shadow-lg card-highlight-rim forecast-hvi-banner">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                Forecast Risk (+{selectedHourOffset}h)
              </span>
              <div className="mt-1.5 flex items-center space-x-2">
                <RiskBadge level={currentRisk} size="md" />
              </div>
            </div>

            <div className="text-right border-l border-white/[0.08] pl-4 shrink-0">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block font-mono">
                HVI Score
              </span>
              <div className="flex items-baseline justify-end space-x-1 mt-0.5">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {formatHvi(displayHvi)}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">/ 1.0</span>
              </div>
              {/* Visual HVI Scale bar */}
              <div className="w-20 h-1.5 rounded-full bg-white/[0.08] overflow-hidden mt-1 ml-auto p-[1px]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                  style={{ width: `${Math.min(100, Math.max(10, displayHvi * 100))}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: Dynamic Thermal Stress Indices & Live Weather Telemetry */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Live Weather Telemetry Report</span>
            </h3>

            <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 flex items-center space-x-1.5 shadow-sm shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>LIVE REPORT</span>
            </span>
          </div>

          {/* Live Weather Source Badge (Cleaned up, no text collision) */}
          <div className="px-3.5 py-2.5 rounded-2xl bg-[#13141a] border border-white/[0.06] text-xs text-slate-300 flex items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span className="text-emerald-400 font-bold text-xs truncate">
                OpenWeatherMap Satellite
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 shrink-0 font-medium bg-white/[0.05] px-2 py-0.5 rounded-md">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} Live
            </span>
          </div>

          {/* 4 Metric Blocks with High-Contrast Typography & Subtle Glowing Borders */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* UTCI Heat Stress */}
            <div className="relative overflow-hidden bg-[#13141a] p-2.5 sm:p-3 rounded-2xl border border-rose-500/20 shadow-md group hover:border-rose-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate">
                UTCI Heat Stress
              </span>
              <span className="text-base sm:text-lg font-bold text-rose-400 font-sans mt-0.5 block tracking-tight">
                {formatTemp(displayUtci)}
              </span>
              <div className="mt-1 flex items-center space-x-1 text-[10px] text-rose-300/80 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span className="truncate">Severe &gt;46°C Limit</span>
              </div>
            </div>

            {/* WBGT Index */}
            <div className="relative overflow-hidden bg-[#13141a] p-2.5 sm:p-3 rounded-2xl border border-orange-500/20 shadow-md group hover:border-orange-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate">
                WBGT Index
              </span>
              <span className="text-base sm:text-lg font-bold text-orange-400 font-sans mt-0.5 block tracking-tight">
                {formatTemp(displayWbgt)}
              </span>
              <div className="mt-1 flex items-center space-x-1 text-[10px] text-orange-300/80 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />
                <span className="truncate">Labor Safe &gt;32°C</span>
              </div>
            </div>

            {/* Ambient Air Temp */}
            <div className="relative overflow-hidden bg-[#13141a] p-2.5 sm:p-3 rounded-2xl border border-amber-500/20 shadow-md group hover:border-amber-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate">
                Ambient Air Temp
              </span>
              <span className="text-base sm:text-lg font-bold text-amber-300 font-sans mt-0.5 block tracking-tight">
                {formatTemp(displayTemp)}
              </span>
              <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                <span className="truncate">Dry Bulb Sensor</span>
              </div>
            </div>

            {/* Relative Humidity */}
            <div className="relative overflow-hidden bg-[#13141a] p-2.5 sm:p-3 rounded-2xl border border-sky-500/20 shadow-md group hover:border-sky-500/40 transition-colors">
              <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block truncate">
                Relative Humidity
              </span>
              <span className="text-base sm:text-lg font-bold text-sky-300 font-sans mt-0.5 block tracking-tight">
                {displayHumidity}%
              </span>
              <div className="mt-1 flex items-center space-x-1 text-[10px] text-slate-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span className="truncate">Dew Point Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Air Quality & Pollution Detector Widget (Compact Integrated Mode) */}
        <LivePollutionDetector compact />

        {/* Section: Heatwave Emergency Medical Response (Ambulance & Hospital Service) */}
        <div className="rounded-2xl bg-[#13141a] p-4 border border-rose-500/30 card-highlight-rim space-y-3.5 shadow-md">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2.5">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 shrink-0">
                <Siren className="w-4 h-4 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
                  Emergency Medical Response
                </h3>
                <p className="text-[11px] text-rose-300 font-medium truncate">
                  Ambulance & Hospital Services
                </p>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 shrink-0">
              {currentRisk === 'SEVERE' ? 'RED PRIORITY' : 'HIGH STANDBY'}
            </span>
          </div>

          {/* Assigned Ambulance Service Card */}
          {assignedAmbulance && (
            <div className="bg-[#181920] p-3.5 rounded-xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 shrink-0">
                    <Siren className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-rose-300 uppercase tracking-wider block">
                      ALS Emergency Ambulance
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{assignedAmbulance.name}</h4>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                    isAmbulanceDispatched
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isAmbulanceDispatched ? 'EN ROUTE' : 'STANDBY'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-0.5">
                <div className="flex items-center space-x-1.5 text-slate-200 bg-[#13141a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                  <Clock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-[11px]">ETA: <strong className="text-white font-mono">~{assignedAmbulance.etaMinutes || 4} min</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-200 bg-[#13141a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                  <Activity className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate font-mono text-[11px]">{assignedAmbulance.vehicleNumber || 'ALS-108'}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  playDispatchSound();
                  if (onDispatchResource) onDispatchResource(assignedAmbulance.id);
                  else dispatchResource(assignedAmbulance.id);
                  setDispatchedUnitIds((prev) => new Set(prev).add(assignedAmbulance.id).add(location.id));
                }}
                disabled={isAmbulanceDispatched}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer ${
                  isAmbulanceDispatched
                    ? 'bg-[#13141a] text-emerald-400 border border-emerald-500/30 cursor-default'
                    : 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950/50'
                }`}
              >
                {isAmbulanceDispatched ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Ambulance Dispatched (En Route)</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-3.5 h-3.5" />
                    <span>Dispatch Ambulance</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Designated Referral Hospital Card */}
          {assignedHospital && (
            <div className="bg-[#181920] p-3.5 rounded-xl border border-white/[0.06] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0 flex-1">
                  <div className="p-1.5 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono font-bold text-teal-300 uppercase tracking-wider block">
                      Referral Hospital
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">{assignedHospital.name}</h4>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border shrink-0 ${
                    isHospitalAlerted
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                  }`}
                >
                  {isHospitalAlerted ? 'PRE-ALERTED' : '24x7 ER'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-0.5">
                <div className="flex items-center space-x-1.5 text-slate-200 bg-[#13141a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                  <Bed className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span className="text-[11px]">Beds: <strong className="text-teal-300 font-mono">{assignedHospital.availableBeds || 18}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5 text-slate-200 bg-[#13141a] px-2.5 py-1.5 rounded-lg border border-white/[0.05]">
                  <Activity className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="text-[11px]">ICU: <strong className="text-rose-300 font-mono">{assignedHospital.icuBeds || 6}</strong></span>
                </div>
              </div>

              <button
                onClick={() => {
                  playDispatchSound();
                  setAlertedHospitalIds((prev) => new Set(prev).add(assignedHospital.id).add(location.id));
                }}
                disabled={isHospitalAlerted}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shadow-sm cursor-pointer ${
                  isHospitalAlerted
                    ? 'bg-[#13141a] text-teal-400 border border-teal-500/30 cursor-default'
                    : 'bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-950/50'
                }`}
              >
                {isHospitalAlerted ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Hospital ER Pre-Alerted</span>
                  </>
                ) : (
                  <>
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Pre-Alert Hospital ER</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Section 2: Dynamic Socio-Demographic Vulnerability */}
        <div className="rounded-2xl bg-[#13141a] p-4 border border-white/[0.06] space-y-2.5 shadow-md">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Socio-Demographic Vulnerability</span>
          </h3>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center bg-[#181920] px-3.5 py-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-300 font-medium">Ward Population</span>
              <span className="font-bold text-white font-mono">
                {location.population ? formatNumber(location.population) : 'Data unavailable'}
              </span>
            </div>

            <div className="flex justify-between items-center bg-[#181920] px-3.5 py-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-300 font-medium">NDVI Vegetation</span>
              <span className={`font-bold font-mono ${displayNdvi < 0.2 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {ndviText} ({ndviLabel})
              </span>
            </div>

            {location.informalSettlementDensity && (
              <div className="flex justify-between items-center bg-[#181920] px-3.5 py-2 rounded-xl border border-white/[0.05]">
                <span className="text-slate-300 font-medium">Informal Settlements</span>
                <span className="font-bold text-amber-400 font-mono uppercase">
                  {location.informalSettlementDensity}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center bg-[#181920] px-3.5 py-2 rounded-xl border border-white/[0.05]">
              <span className="text-slate-300 font-medium">Outdoor Laborers Est.</span>
              <span className="font-bold text-slate-100 font-mono">
                {formatNumber(displayOutdoorWorkers)}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Recommended Response Actions */}
        {dynamicActions && dynamicActions.length > 0 && (
          <div className="rounded-2xl bg-[#13141a] p-4 border border-white/[0.06] space-y-2.5 shadow-md">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recommended Response Actions</span>
            </h3>

            <ul className="space-y-1.5">
              {dynamicActions.map((action, idx) => (
                <li
                  key={idx}
                  className="text-xs text-slate-200 bg-[#181920] p-2.5 rounded-xl border border-white/[0.05] flex items-start space-x-2 leading-relaxed"
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      currentRisk === 'SEVERE'
                        ? 'bg-rose-500 animate-pulse'
                        : currentRisk === 'HIGH'
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                  />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3. PINNED BOTTOM ACTION BUTTONS (Always accessible) */}
      <div className="p-3.5 sm:p-4 border-t border-white/[0.08] bg-[#181920] shrink-0 z-10">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => navigate('/analytics')}
            className="px-2.5 py-2.5 rounded-xl bg-[#13141a] hover:bg-white/[0.06] text-slate-200 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border border-white/[0.08] cursor-pointer"
          >
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
            <span>Forecast</span>
          </button>

          <button
            onClick={() => {
              if (onDispatchResource) onDispatchResource(location.id);
              else navigate('/resources');
            }}
            className="px-2.5 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 font-bold text-xs transition-all flex items-center justify-center space-x-1.5 border border-amber-500/30 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5 text-amber-400" />
            <span>Resources</span>
          </button>

          <button
            onClick={() => {
              if (onSendAlert) onSendAlert(location);
              else navigate('/alerts');
            }}
            className="px-2.5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-rose-950/50 cursor-pointer"
          >
            <Siren className="w-3.5 h-3.5" />
            <span>Alert</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Export WardDetailsPanel alias for backward compatibility
export const WardDetailsPanel = LocationDetails;
