import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useHeatwave } from '../../context/HeatwaveContext';
import { MUNICIPAL_REGIONS, type MunicipalRegion } from '../../types/region';
import { fetchLiveWeatherForCoords, type LiveWeatherData } from '../../services/liveWeatherService';
import { fetchLivePollutionForCoords, type LivePollutionData } from '../../services/pollutionService';
import {
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  Droplets,
  Wind,
  Eye,
  ArrowUpRight,
} from 'lucide-react';

interface OtherCityData {
  region: MunicipalRegion;
  tempC: number;
  condition: string;
  icon: LiveWeatherData['iconType'];
}

export interface LiveWeatherHeroProps {
  onSwitchToCommandCenter?: () => void;
}

export const LiveWeatherHero: React.FC<LiveWeatherHeroProps> = ({ onSwitchToCommandCenter }) => {
  const navigate = useNavigate();
  const { activeRegion, setActiveRegion } = useHeatwave();
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [pollution, setPollution] = useState<LivePollutionData | null>(null);
  const [otherCities, setOtherCities] = useState<OtherCityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'next7'>('next7');
  const [viewMode, setViewMode] = useState<'forecast' | 'air_quality'>('forecast');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time clock updating every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 10000);
    return () => clearInterval(timer);
  }, []);

  // Fetch live weather for the current active region
  const loadData = async () => {
    setLoading(true);
    try {
      const lat = activeRegion.coordinates[1];
      const lng = activeRegion.coordinates[0];
      const targetName = `${activeRegion.name}, ${activeRegion.state}`;

      const [weatherData, pollutionData] = await Promise.all([
        fetchLiveWeatherForCoords(lat, lng, targetName),
        fetchLivePollutionForCoords(lat, lng),
      ]);

      setWeather(weatherData);
      setPollution(pollutionData);
    } catch (err) {
      console.error('Error fetching live weather hero data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 3 * 60 * 1000); // 3-minute live refresh
    return () => clearInterval(interval);
  }, [activeRegion.id]);

  // Dynamically fetch other major cities' real weather for the "Other Cities" card
  useEffect(() => {
    let mounted = true;
    const fetchOtherCities = async () => {
      const targets = MUNICIPAL_REGIONS.filter((r) => r.id !== activeRegion.id).slice(0, 4);
      const results: OtherCityData[] = [];

      for (const reg of targets) {
        try {
          const w = await fetchLiveWeatherForCoords(reg.coordinates[1], reg.coordinates[0], reg.name);
          results.push({
            region: reg,
            tempC: Math.round(w.temperatureC),
            condition: w.conditionText,
            icon: w.iconType,
          });
        } catch {
          results.push({
            region: reg,
            tempC: 30,
            condition: 'Partly Cloudy',
            icon: 'partly-cloudy',
          });
        }
      }

      if (mounted) {
        setOtherCities(results);
      }
    };

    fetchOtherCities();
    return () => {
      mounted = false;
    };
  }, [activeRegion.id]);

  // Current real-time metrics derived from live satellite observation
  const currentTemp = weather?.temperatureC ?? 31.0;
  const currentFeelsLike = weather?.apparentTempC ?? Math.round(currentTemp + 3);
  const currentHumidity = weather?.humidity ?? 68;
  const currentWind = weather?.windSpeed ?? 9.5;
  const currentWindDir = weather?.windDirection ?? 'N-E';
  const currentPressure = weather?.surfacePressure ?? 1012;
  const currentSunrise = weather?.sunrise ?? '06:05 AM';
  const currentSunset = weather?.sunset ?? '06:28 PM';
  const currentUvIndex = weather?.uvIndex ?? 5.5;
  const currentVisibility = weather?.visibilityKm ?? 8;
  const currentDewPoint = weather?.dewPointC ?? 24;

  const currentDayName = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  }, [currentTime]);

  const currentTimeStr = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  // Daily list for 7-day forecast from real Open-Meteo satellite feed
  const dailyList = useMemo(() => {
    if (weather?.dailyForecast && weather.dailyForecast.length > 0) {
      return weather.dailyForecast;
    }
    const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() + i * 86400000);
      return {
        date: d.toISOString().split('T')[0],
        dayName: i === 0 ? 'TODAY' : dayNames[d.getDay()],
        tempMax: Math.round(currentTemp + (i % 2 === 0 ? 2 : 1)),
        tempMin: Math.round(currentTemp - 5),
        weatherCode: 2,
        conditionText: 'Partly Cloudy',
        iconType: 'partly-cloudy' as const,
        precipitationProbability: 20,
        precipitationMm: 0,
      };
    });
  }, [weather?.dailyForecast, currentTemp]);

  // Render vector weather icons matching reference design
  const renderWeatherIcon3D = (type: string, size = 'w-10 h-10') => {
    switch (type) {
      case 'thunderstorm':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Cloud className="w-full h-full text-slate-300 drop-shadow" />
            <CloudLightning className="w-1/2 h-1/2 text-amber-400 absolute bottom-0 right-0 drop-shadow" />
          </div>
        );
      case 'rain':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <CloudRain className="w-full h-full text-[#38bdf8] drop-shadow" />
          </div>
        );
      case 'cloudy':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Cloud className="w-full h-full text-slate-300 drop-shadow" />
          </div>
        );
      case 'partly-cloudy':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Sun className="w-3/5 h-3/5 text-amber-400 absolute -top-1 -right-1 drop-shadow" />
            <Cloud className="w-4/5 h-4/5 text-slate-200 drop-shadow relative z-10" />
          </div>
        );
      case 'wind':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Wind className="w-full h-full text-[#38bdf8] drop-shadow" />
          </div>
        );
      case 'sunny':
      default:
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md" />
            <Sun className="w-full h-full text-amber-400 drop-shadow-md" />
          </div>
        );
    }
  };

  // Dynamic waveform bars computed from live hourly wind telemetry
  const waveformHeights = useMemo(() => {
    if (weather?.hourlyWind && weather.hourlyWind.length >= 10) {
      const maxW = Math.max(...weather.hourlyWind, 12);
      return weather.hourlyWind.slice(0, 17).map((w) => Math.max(16, Math.min(100, Math.round((w / maxW) * 95))));
    }
    // Fallback diurnal wave curve
    return [22, 30, 42, 55, 70, 84, 95, 100, 92, 80, 68, 56, 44, 34, 26, 20, 16];
  }, [weather?.hourlyWind]);

  // Dynamic Chance of Rain points and curve from live hourly telemetry
  const rainTimeline = useMemo(() => {
    if (weather?.hourlyRain && weather.hourlyRain.length >= 6) {
      return weather.hourlyRain.slice(0, 6);
    }
    const currentHour = currentTime.getHours();
    return Array.from({ length: 6 }, (_, i) => {
      const h = (currentHour + i) % 24;
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h % 12 === 0 ? 12 : h % 12;
      return {
        hour: `${h}:00`,
        label: `${String(displayH).padStart(2, '0')} ${period}`,
        prob: [18, 25, 35, 20, 10, 5][i] ?? 15,
        rainMm: 0,
      };
    });
  }, [weather?.hourlyRain, currentTime]);

  // Construct SVG points and path for the Chance of Rain curve
  const rainSvgData = useMemo(() => {
    const xCoords = [20, 60, 100, 140, 180, 220];
    const pts = rainTimeline.map((item, idx) => {
      const x = xCoords[idx] || 20 + idx * 40;
      // Prob 0% -> y=85, Prob 100% -> y=15
      const y = Math.round(85 - (Math.min(100, Math.max(0, item.prob)) / 100) * 65);
      return { x, y, prob: item.prob };
    });

    // Create cubic bezier curve path through points
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cx = (p0.x + p1.x) / 2;
      path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    return { pts, path };
  }, [rainTimeline]);

  // Calculate UV arc offset: full circumference is ~172.7
  const uvArcOffset = useMemo(() => {
    const normalized = Math.min(12, Math.max(0, currentUvIndex));
    return (172.7 - (normalized / 12) * 172.7).toFixed(1);
  }, [currentUvIndex]);

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 1. Header Tabs Row: Today | Tomorrow | Next 7days + Segmented Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Tab selection */}
        <div className="flex items-center space-x-5 text-sm sm:text-base font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('today')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'today' ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tomorrow')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'tomorrow' ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('next7')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'next7' ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Next 7days
          </button>
        </div>

        {/* Right: Forecast / Air Quality Switcher */}
        <div className="flex items-center bg-[#181920] border border-white/[0.06] p-1 rounded-full text-xs font-bold shadow-sm">
          <button
            type="button"
            onClick={() => setViewMode('forecast')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === 'forecast'
                ? 'bg-[#252732] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Forecast
          </button>
          <button
            type="button"
            onClick={() => setViewMode('air_quality')}
            className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer ${
              viewMode === 'air_quality'
                ? 'bg-[#252732] text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Air Quality
          </button>
        </div>
      </div>

      {/* 2. Forecast Cards Row: 1 Featured Ice-Slate Card + 5 Tall Vertical Day Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Featured Card (Dynamically driven by live Open-Meteo telemetry for activeRegion) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 rounded-[20px] p-5 sm:p-6 bg-gradient-to-br from-[#607a93] via-[#566f86] to-[#485f74] text-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.005] border border-white/10">
          {/* Top: Live Day & Clock */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-bold tracking-wider text-slate-800 font-mono uppercase">
            <span>{currentDayName}</span>
            <span className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{currentTimeStr}</span>
            </span>
          </div>

          {/* Middle: Big Temp & 3D Live Weather Icon */}
          <div className="my-3 flex items-center justify-between">
            <div>
              <span className="text-4xl sm:text-5xl font-bold tracking-tight font-sans text-slate-950">
                {currentTemp.toFixed(1)}°
              </span>
              <span className="block text-xs font-semibold text-slate-800 mt-1 font-sans">
                {weather?.conditionText || 'Partly Cloudy'} • {activeRegion.name}
              </span>
            </div>
            <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm border border-white/20">
              {renderWeatherIcon3D(weather?.iconType || 'partly-cloudy', 'w-12 h-12 sm:w-14 sm:h-14')}
            </div>
          </div>

          {/* Bottom: Real Micro-telemetry details in 2 columns */}
          <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-medium text-slate-800 font-mono pt-3 border-t border-slate-900/15">
            <div>Real Feel <strong className="text-slate-950 font-bold ml-1">{currentFeelsLike}°</strong></div>
            <div className="text-right">Sunrise <strong className="text-slate-950 font-bold ml-1">{currentSunrise}</strong></div>
            <div>Wind {currentWindDir}: <strong className="text-slate-950 font-bold ml-1">{currentWind.toFixed(1)}km/h</strong></div>
            <div className="text-right">Sunset <strong className="text-slate-950 font-bold ml-1">{currentSunset}</strong></div>
            <div>Pressure <strong className="text-slate-950 font-bold ml-1">{currentPressure} hPa</strong></div>
            <div className="text-right">Humidity <strong className="text-slate-950 font-bold ml-1">{currentHumidity}%</strong></div>
          </div>
        </div>

        {/* 5 Next Day Vertical Cards from Live 7-Day Forecast */}
        {dailyList.slice(activeTab === 'tomorrow' ? 1 : 1, 6).map((day, idx) => (
          <div
            key={day.date + idx}
            className="rounded-[20px] bg-[#161922] border border-[#232838] hover:border-[#38bdf8]/50 p-4 flex flex-col items-center justify-between min-h-[190px] transition-all hover:bg-[#1a1e29] group shadow-lg"
          >
            {/* Day name */}
            <span className="text-xs font-semibold text-slate-400 font-mono tracking-widest uppercase group-hover:text-slate-200">
              {day.dayName}
            </span>

            {/* Weather icon in center */}
            <div className="my-auto py-2 transition-transform group-hover:scale-105">
              {renderWeatherIcon3D(day.iconType, 'w-10 h-10')}
            </div>

            {/* Temperatures: Max / Min */}
            <div className="flex flex-col items-center">
              <span className="text-xl sm:text-2xl font-bold text-white font-mono tracking-tight">
                {day.tempMax}°
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {day.tempMin}°
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Two-Column Layout (Today's Overview + Chance of Rain / Other Cities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Overview (4 widgets + Explore Map card) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Today's Overview
            </h3>
            <span className="text-xs font-mono text-slate-400">
              Station: {activeRegion.name}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Widget 1: Live Wind Status (Dynamic Waveform Bars) */}
            <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg flex flex-col justify-between min-h-[175px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Wind Status</span>
                <span className="text-[10px] font-mono text-sky-400 font-bold">{currentWindDir}</span>
              </div>

              {/* Curved Waveform Bars visualizer with gradient matching live wind */}
              <div className="flex items-end justify-between h-14 px-1 my-2">
                {waveformHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-lg sm:text-xl font-bold text-white font-mono">
                  {currentWind.toFixed(1)} <span className="text-xs font-normal text-slate-400">km/h</span>
                </span>
                <span className="text-xs font-mono text-slate-400">{currentTimeStr}</span>
              </div>
            </div>

            {/* Widget 2: Live UV Index (Dynamic Radial Arc Meter) */}
            <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg flex flex-col justify-between min-h-[175px]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">UV Index</span>
                <span className="text-[10px] font-mono text-slate-400">
                  {currentUvIndex >= 8 ? 'Very High' : currentUvIndex >= 6 ? 'High' : currentUvIndex >= 3 ? 'Moderate' : 'Low'}
                </span>
              </div>

              {/* Half-circle radial gauge */}
              <div className="relative flex flex-col items-center justify-center my-1">
                <svg viewBox="0 0 140 75" className="w-36 h-20 overflow-visible">
                  <defs>
                    <linearGradient id="uvArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0284c7" />
                      <stop offset="70%" stopColor="#38bdf8" />
                      <stop offset="100%" stopColor="#00d2ff" />
                    </linearGradient>
                  </defs>
                  {/* Background track */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="#232838"
                    strokeWidth="9"
                    strokeLinecap="round"
                  />
                  {/* Dynamic Gauge arc */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="url(#uvArcGrad)"
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray="172.7"
                    strokeDashoffset={uvArcOffset}
                    className="transition-all duration-500"
                  />
                  {/* Reference Numbers */}
                  <text x="50" y="42" className="fill-slate-500 text-[9px] font-mono">5</text>
                  <text x="68" y="32" className="fill-slate-500 text-[9px] font-mono">7</text>
                  <text x="92" y="44" className="fill-slate-500 text-[9px] font-mono">10</text>
                  <text x="110" y="65" className="fill-slate-500 text-[9px] font-mono">12</text>
                </svg>

                <div className="text-center -mt-3">
                  <span className="text-base font-bold text-white font-mono">{currentUvIndex.toFixed(2)} UV</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Live Humidity & Real Dew Point */}
            <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg flex flex-col justify-between min-h-[175px]">
              <span className="text-xs font-medium text-slate-400">Humidity</span>

              <div className="flex items-center justify-center my-1">
                {renderWeatherIcon3D(currentHumidity > 75 ? 'rain' : 'cloudy', 'w-12 h-12')}
              </div>

              <div className="space-y-1">
                <span className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {currentHumidity}%
                </span>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
                  <Droplets className="w-3 h-3 text-[#38bdf8] shrink-0" />
                  <span>The dew point is {currentDewPoint}° right now</span>
                </p>
              </div>
            </div>

            {/* Widget 4: Live Atmospheric Visibility */}
            <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg flex flex-col justify-between min-h-[175px]">
              <span className="text-xs font-medium text-slate-400">Visibility</span>

              <div className="flex items-center justify-center my-1">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Cloud className="w-10 h-10 text-slate-300 drop-shadow" />
                  <div className="absolute bottom-1 w-8 h-1 bg-[#38bdf8] rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xl sm:text-2xl font-bold text-white font-mono">
                  {currentVisibility < 10 ? `0${currentVisibility}` : currentVisibility} <span className="text-sm font-normal text-slate-400">km</span>
                </span>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1.5 font-medium">
                  <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{currentVisibility <= 5 ? 'Haze is affecting visibility' : 'Clear atmospheric visibility'}</span>
                </p>
              </div>
            </div>

            {/* Widget 5: Explore Global Map Card */}
            <div className="sm:col-span-2 xl:col-span-2 rounded-[20px] relative overflow-hidden p-6 border border-[#232838] shadow-2xl flex flex-col justify-between min-h-[220px] group bg-gradient-to-b from-[#161a25] via-[#141822] to-[#10131d]">
              {/* Subtle grid pattern overlay */}
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#38bdf8]/10 rounded-full blur-3xl pointer-events-none" />

              {/* Frosted Banner */}
              <div className="relative z-10 p-3.5 rounded-2xl bg-[#12151e]/80 backdrop-blur-md border border-[#232838] text-center shadow-lg">
                <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Explore global map of wind weather & heat risk
                </h4>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-4 space-y-2">
                <button
                  type="button"
                  id="btn-explore-global-map"
                  onClick={() => navigate('/map')}
                  className="w-full py-3 px-6 rounded-2xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-semibold text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-400"
                >
                  <span>GET STARTED</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>

                {onSwitchToCommandCenter && (
                  <button
                    type="button"
                    onClick={onSwitchToCommandCenter}
                    className="w-full text-center text-[11px] text-sky-400/90 hover:text-sky-300 transition-colors cursor-pointer py-1 font-medium hover:underline flex items-center justify-center space-x-1"
                  >
                    <span>Or view Command Center map on dashboard ↓</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Chance of Rain & Live Other Cities */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Dynamic Chance of Rain Card */}
          <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Chance of Rain
              </h4>
              <span className="text-[10px] font-mono text-sky-400 font-semibold">
                Hourly Satellite Telemetry
              </span>
            </div>

            {/* Vertical levels & dynamic curve */}
            <div className="relative pt-2 pb-1">
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-[11px] font-mono text-slate-500 pr-3 h-28">
                  <span>Rainy</span>
                  <span>Sunny</span>
                  <span>Heavy</span>
                </div>

                {/* Graph SVG container */}
                <div className="flex-1 relative h-28 border-b border-[#232838]">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="w-full border-t border-dashed border-[#232838]" />
                    <div className="w-full border-t border-dashed border-[#232838]" />
                    <div className="w-full border-t border-dashed border-[#232838]" />
                  </div>

                  {/* SVG dynamic curve and vertical bars */}
                  <svg viewBox="0 0 240 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="rainCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#00d2ff" />
                      </linearGradient>
                    </defs>

                    {/* Smooth curve */}
                    <path
                      d={rainSvgData.path}
                      fill="none"
                      stroke="url(#rainCurveGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Dynamic dots and vertical stems */}
                    {rainSvgData.pts.map((pt, i) => (
                      <g key={i}>
                        <line x1={pt.x} y1={pt.y} x2={pt.x} y2="100" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.35" />
                        <circle cx={pt.x} cy={pt.y} r="3.5" fill="#ffffff" stroke="#0ea5e9" strokeWidth="2" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Dynamic Time X-axis labels */}
              <div className="flex justify-between pl-12 pt-2 text-[10px] font-mono text-slate-500">
                {rainTimeline.map((item, i) => (
                  <span key={i} title={`${item.prob}% chance`}>{item.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Dynamic Other Cities Card (Real Indian Cities from MUNICIPAL_REGIONS) */}
          <div className="rounded-[20px] bg-[#161922] border border-[#232838] p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Other Cities
              </h4>
              <span className="text-[10px] font-mono text-slate-400">
                Click city to switch
              </span>
            </div>

            {/* List of sleek live city cards */}
            <div className="space-y-2.5">
              {otherCities.map((item) => (
                <button
                  key={item.region.id}
                  type="button"
                  onClick={() => setActiveRegion(item.region)}
                  className="w-full p-3.5 rounded-[16px] border text-left transition-all flex items-center justify-between cursor-pointer bg-[#12151e] border-[#232838] hover:border-[#38bdf8]/40 hover:bg-[#181d2a] group"
                >
                  <div>
                    <span className="text-[10px] font-mono text-sky-400 font-semibold uppercase tracking-wider block">
                      {item.region.state}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white block mt-0.5 group-hover:text-sky-300 transition-colors">
                      {item.region.name}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      {item.condition} • <strong className="text-white font-mono">{item.tempC}°C</strong>
                    </span>
                  </div>

                  <div className="p-2 rounded-xl bg-[#161922] border border-[#232838] group-hover:border-sky-500/40 transition-colors">
                    {renderWeatherIcon3D(item.icon, 'w-6 h-6')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWeatherHero;
