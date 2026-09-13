import React, { useState, useEffect, useMemo } from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { fetchLiveWeatherForCoords, type LiveWeatherData } from '../../services/liveWeatherService';
import { fetchLivePollutionForCoords, type LivePollutionData } from '../../services/pollutionService';
import {
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  CloudSun,
  Droplets,
  Wind,
  Eye,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface SubStation {
  id: string;
  name: string;
  shortName: string;
  country: string;
  city: string;
  lat: number;
  lng: number;
  condition: string;
  icon: 'cloudy' | 'sunny' | 'rain' | 'wind' | 'partly-cloudy';
}

const CORRIDOR_STATIONS: SubStation[] = [
  {
    id: 'sohna',
    name: 'Sohna Valley & Foothills',
    shortName: 'Sohna',
    country: 'Haryana / NCR',
    city: 'Sohna Valley',
    lat: 28.2464,
    lng: 77.0697,
    condition: 'Mostly Sunny',
    icon: 'sunny',
  },
  {
    id: 'gurgaon-core',
    name: 'Gurugram City Core',
    shortName: 'Cyber Hub',
    country: 'Haryana / Metro',
    city: 'Gurugram City',
    lat: 28.4595,
    lng: 77.0266,
    condition: 'Cloudy',
    icon: 'cloudy',
  },
  {
    id: 'manesar',
    name: 'Manesar Industrial Belt',
    shortName: 'Manesar',
    country: 'Haryana / IMT',
    city: 'Manesar Belt',
    lat: 28.3516,
    lng: 76.9416,
    condition: 'Windy',
    icon: 'wind',
  },
  {
    id: 'badshahpur',
    name: 'Badshahpur / Sohna Road',
    shortName: 'SPR Corridor',
    country: 'Haryana / SPR',
    city: 'Badshahpur',
    lat: 28.3965,
    lng: 77.0543,
    condition: 'Light Showers',
    icon: 'rain',
  },
];

export const LiveWeatherHero: React.FC = () => {
  const { activeRegion } = useHeatwave();
  const [weather, setWeather] = useState<LiveWeatherData | null>(null);
  const [pollution, setPollution] = useState<LivePollutionData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'next7'>('next7');
  const [viewMode, setViewMode] = useState<'forecast' | 'air_quality'>('forecast');
  const [selectedStationId, setSelectedStationId] = useState<string>('sohna');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const matchedStation =
        CORRIDOR_STATIONS.find((s) => s.id === selectedStationId) || CORRIDOR_STATIONS[0];
      const lat = matchedStation.lat;
      const lng = matchedStation.lng;
      const targetName = `${matchedStation.name}, Gurugram, Haryana`;

      const [weatherData, pollutionData] = await Promise.all([
        fetchLiveWeatherForCoords(lat, lng, targetName),
        fetchLivePollutionForCoords(lat, lng),
      ]);

      setWeather(weatherData);
      setPollution(pollutionData);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Error fetching live weather hero data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedStationId, activeRegion.id]);

  // Current metrics
  const currentTemp = weather?.temperatureC ?? 28;
  const currentFeelsLike = weather?.apparentTempC ?? 32;
  const currentHumidity = weather?.humidity ?? 84;
  const currentWind = weather?.windSpeed ?? 7.5;
  const currentCondition = weather?.conditionText ?? 'Partly Cloudy';
  const currentVisibility = 4; // km

  const currentDayName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
  }, []);

  const currentTimeStr = useMemo(() => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }, [lastRefreshed]);

  // Daily list for 7-day forecast
  const dailyList = weather?.dailyForecast && weather.dailyForecast.length > 0
    ? weather.dailyForecast
    : [
        { date: '2026-09-12', dayName: 'Fri', tempMax: 28, tempMin: 21, conditionText: 'Partly Cloudy', iconType: 'partly-cloudy' as const, precipitationProbability: 25 },
        { date: '2026-09-13', dayName: 'Sat', tempMax: 10, tempMin: 6, conditionText: 'Mostly Cloudy', iconType: 'cloudy' as const, precipitationProbability: 15 },
        { date: '2026-09-14', dayName: 'Sun', tempMax: 15, tempMin: 8, conditionText: 'Overcast', iconType: 'cloudy' as const, precipitationProbability: 10 },
        { date: '2026-09-15', dayName: 'Mon', tempMax: 11, tempMin: 5, conditionText: 'Wind & Rain', iconType: 'rain' as const, precipitationProbability: 65 },
        { date: '2026-09-16', dayName: 'Tue', tempMax: 10, tempMin: 4, conditionText: 'Thunderstorm', iconType: 'thunderstorm' as const, precipitationProbability: 80 },
        { date: '2026-09-17', dayName: 'Wed', tempMax: 12, tempMin: 7, conditionText: 'Heavy Rain', iconType: 'rain' as const, precipitationProbability: 90 },
        { date: '2026-09-18', dayName: 'Thu', tempMax: 10, tempMin: 5, conditionText: 'Squall Lightning', iconType: 'thunderstorm' as const, precipitationProbability: 75 },
      ];

  // Render 3D-styled Weather Icons
  const renderWeatherIcon3D = (type: string, size = 'w-10 h-10') => {
    switch (type) {
      case 'thunderstorm':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Cloud className="w-full h-full text-slate-300 drop-shadow-md" />
            <CloudLightning className="w-1/2 h-1/2 text-amber-400 absolute bottom-0 right-0 drop-shadow-lg animate-pulse" />
          </div>
        );
      case 'rain':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <CloudRain className="w-full h-full text-sky-400 drop-shadow-md" />
          </div>
        );
      case 'cloudy':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Cloud className="w-full h-full text-slate-200 drop-shadow-md" />
          </div>
        );
      case 'partly-cloudy':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Sun className="w-3/5 h-3/5 text-amber-400 absolute -top-1 -right-1 drop-shadow-md animate-spin-slow" />
            <Cloud className="w-4/5 h-4/5 text-slate-200 drop-shadow-md relative z-10" />
          </div>
        );
      case 'wind':
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <Wind className="w-full h-full text-sky-300 drop-shadow-md" />
          </div>
        );
      case 'sunny':
      default:
        return (
          <div className={`relative ${size} flex items-center justify-center`}>
            <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-md" />
            <Sun className="w-full h-full text-amber-400 drop-shadow-lg animate-spin-slow" />
          </div>
        );
    }
  };

  // Waveform bars data for Wind Status card
  const waveformHeights = [24, 32, 45, 56, 68, 80, 92, 100, 95, 86, 75, 62, 50, 40, 32, 26, 20];

  // Chance of Rain curve points
  const rainHours = [
    { label: '10AM', val: 55 },
    { label: '11AM', val: 78 },
    { label: '12AM', val: 92 },
    { label: '01PM', val: 38 },
    { label: '02PM', val: 82 },
    { label: '03PM', val: 30 },
  ];

  return (
    <div className="space-y-6 font-sans select-none">
      {/* 1. Header Tabs Row: Today | Tomorrow | Next 7days + Segmented Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Tab selection */}
        <div className="flex items-center space-x-5 text-sm sm:text-base font-semibold">
          <button
            onClick={() => setActiveTab('today')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'today' ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setActiveTab('tomorrow')}
            className={`transition-colors cursor-pointer ${
              activeTab === 'tomorrow' ? 'text-white font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Tomorrow
          </button>
          <button
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

      {/* 2. Forecast Cards Row: 1 Featured Ice-Slate Card + 6 Tall Vertical Day Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4">
        {/* Featured Today Card (Ice-slate matte background matching reference) */}
        <div className="col-span-2 sm:col-span-2 lg:col-span-2 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#7691a2] to-[#8fa8b8] text-slate-900 shadow-xl flex flex-col justify-between relative overflow-hidden transition-transform hover:scale-[1.01]">
          {/* Top: Day & Time */}
          <div className="flex items-center justify-between text-xs sm:text-sm font-black tracking-tight text-slate-900/90 font-mono uppercase">
            <span>{currentDayName}</span>
            <span>{currentTimeStr}</span>
          </div>

          {/* Middle: Big Temp & 3D Sun Weather Icon */}
          <div className="my-3 flex items-center justify-between">
            <span className="text-5xl sm:text-6xl font-black tracking-tighter font-sans text-slate-950">
              {currentTemp}°
            </span>
            <div className="p-2 bg-white/20 backdrop-blur-md rounded-2xl shadow-sm">
              {renderWeatherIcon3D('sunny', 'w-14 h-14 sm:w-16 sm:h-16')}
            </div>
          </div>

          {/* Bottom: Micro-telemetry details in 2 columns */}
          <div className="grid grid-cols-2 gap-y-1 text-[11px] font-bold text-slate-900/80 font-mono pt-2 border-t border-slate-900/15">
            <div>Real Feel <strong className="text-slate-950">{currentFeelsLike}°</strong></div>
            <div className="text-right">Sunrise <strong className="text-slate-950">5:30AM</strong></div>
            <div>Wind N-E: <strong className="text-slate-950">{currentWind}km/h</strong></div>
            <div className="text-right">Sunset <strong className="text-slate-950">6:45PM</strong></div>
            <div>Pressure <strong className="text-slate-950">100MB</strong></div>
            <div className="text-right">Humidity <strong className="text-slate-950">{currentHumidity}%</strong></div>
          </div>
        </div>

        {/* 5-6 Next Day Vertical Cards matching reference image */}
        {dailyList.slice(1, 6).map((day, idx) => (
          <div
            key={day.date + idx}
            className="rounded-3xl bg-[#181920] border border-white/[0.06] hover:border-white/[0.15] p-4 flex flex-col items-center justify-between min-h-[190px] transition-all hover:bg-[#1d1f28] group shadow-lg"
          >
            {/* Day name */}
            <span className="text-xs font-bold text-slate-400 font-mono tracking-wider uppercase group-hover:text-slate-200">
              {day.dayName}
            </span>

            {/* Weather icon in center */}
            <div className="my-auto py-2 transition-transform group-hover:scale-110">
              {renderWeatherIcon3D(day.iconType, 'w-10 h-10')}
            </div>

            {/* Large temperature */}
            <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
              {day.tempMax}°
            </span>
          </div>
        ))}
      </div>

      {/* 3. Main Two-Column Layout (Today's Overview + Chance of Rain / Other Cities) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Today's Overview (4 widgets + Explore Map card) */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Today's Overview
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Widget 1: Wind Status (Waveform Bars) */}
            <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg flex flex-col justify-between min-h-[170px]">
              <span className="text-xs font-medium text-slate-400">Wind Status</span>

              {/* Curved Waveform Bars visualizer */}
              <div className="flex items-end justify-between h-14 px-1 my-2">
                {waveformHeights.map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-sky-500 to-sky-300 opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xl sm:text-2xl font-black text-white font-mono">
                  {currentWind} <span className="text-xs font-normal text-slate-400">km/h</span>
                </span>
                <span className="text-xs font-mono text-slate-400">6.20 AM</span>
              </div>
            </div>

            {/* Widget 2: UV Index (Radial Arc Meter) */}
            <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg flex flex-col justify-between min-h-[170px]">
              <span className="text-xs font-medium text-slate-400">UV Index</span>

              {/* Half-circle radial gauge */}
              <div className="relative flex flex-col items-center justify-center my-1">
                <svg viewBox="0 0 140 75" className="w-36 h-20 overflow-visible">
                  <defs>
                    <linearGradient id="uvArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#38bdf8" />
                      <stop offset="60%" stopColor="#2ba8fe" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                  {/* Background track */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="#232530"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Gauge arc */}
                  <path
                    d="M 15 70 A 55 55 0 0 1 125 70"
                    fill="none"
                    stroke="url(#uvArcGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="172.7"
                    strokeDashoffset="75"
                  />
                  {/* Numbers */}
                  <text x="50" y="42" className="fill-slate-400 text-[9px] font-mono">5</text>
                  <text x="68" y="32" className="fill-slate-400 text-[9px] font-mono">7</text>
                  <text x="92" y="44" className="fill-slate-400 text-[9px] font-mono">10</text>
                  <text x="110" y="65" className="fill-slate-400 text-[9px] font-mono">12</text>
                </svg>

                <div className="text-center -mt-3">
                  <span className="text-lg font-black text-white font-mono">5.50 UV</span>
                </div>
              </div>
            </div>

            {/* Widget 3: Humidity */}
            <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg flex flex-col justify-between min-h-[170px]">
              <span className="text-xs font-medium text-slate-400">Humidity</span>

              <div className="flex items-center justify-center my-1">
                {renderWeatherIcon3D('thunderstorm', 'w-12 h-12')}
              </div>

              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  {currentHumidity}%
                </span>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
                  <Droplets className="w-3 h-3 text-sky-400 shrink-0" />
                  <span>The dew point is 27° right now</span>
                </p>
              </div>
            </div>

            {/* Widget 4: Visibility */}
            <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg flex flex-col justify-between min-h-[170px]">
              <span className="text-xs font-medium text-slate-400">Visibility</span>

              <div className="flex items-center justify-center my-1">
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <Cloud className="w-10 h-10 text-slate-300 drop-shadow-md" />
                  <div className="absolute bottom-1 w-8 h-1 bg-sky-400/80 rounded-full" />
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono">
                  0{currentVisibility} <span className="text-sm font-normal text-slate-400">km</span>
                </span>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1 font-medium">
                  <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Haze is affecting visibility</span>
                </p>
              </div>
            </div>

            {/* Widget 5: Explore Global Map Card (Feature Card with Get Started button) */}
            <div className="sm:col-span-2 xl:col-span-2 rounded-3xl relative overflow-hidden p-6 border border-white/[0.08] shadow-2xl flex flex-col justify-between min-h-[220px] group bg-gradient-to-b from-[#1b2330] via-[#151c27] to-[#111620]">
              {/* Architecture silhouette overlay */}
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Frosted Glass Banner */}
              <div className="relative z-10 p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-center shadow-lg">
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  Explore global map of wind weather & heat risk
                </h4>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-4">
                <a
                  href="#gis-map-view"
                  className="w-full py-3 px-6 rounded-2xl bg-[#2ba8fe] hover:bg-[#1a9bf0] text-white font-black text-xs sm:text-sm tracking-wider uppercase flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <span>GET STARTED</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Chance of Rain & Other Cities */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. Chance of Rain Card */}
          <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg space-y-4">
            <h4 className="text-sm font-bold text-white tracking-tight">
              Chance of Rain
            </h4>

            {/* Vertical levels & smooth curve */}
            <div className="relative pt-2 pb-1">
              <div className="flex">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between text-[11px] font-mono text-slate-500 pr-3 h-28">
                  <span>Rainy</span>
                  <span>Sunny</span>
                  <span>Heavy</span>
                </div>

                {/* Graph SVG container */}
                <div className="flex-1 relative h-28 border-b border-slate-800">
                  {/* Horizontal grid lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    <div className="w-full border-t border-dashed border-slate-800" />
                    <div className="w-full border-t border-dashed border-slate-800" />
                    <div className="w-full border-t border-dashed border-slate-800" />
                  </div>

                  {/* SVG smooth curve and vertical bars */}
                  <svg viewBox="0 0 240 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="rainCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#38bdf8" />
                        <stop offset="100%" stopColor="#2ba8fe" />
                      </linearGradient>
                    </defs>

                    {/* Smooth curve */}
                    <path
                      d="M 20 60 C 40 25, 60 15, 80 20 C 100 25, 120 75, 140 80 C 160 85, 180 30, 200 35 C 210 40, 220 70, 230 75"
                      fill="none"
                      stroke="url(#rainCurveGrad)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Dots and vertical line stems */}
                    {[
                      { x: 20, y: 60 },
                      { x: 60, y: 18 },
                      { x: 100, y: 25 },
                      { x: 140, y: 80 },
                      { x: 180, y: 32 },
                      { x: 220, y: 72 },
                    ].map((pt, i) => (
                      <g key={i}>
                        <line x1={pt.x} y1={pt.y} x2={pt.x} y2="100" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4" />
                        <circle cx={pt.x} cy={pt.y} r="3" fill="#ffffff" stroke="#2ba8fe" strokeWidth="2" />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Time X-axis labels */}
              <div className="flex justify-between pl-12 pt-2 text-[10px] font-mono text-slate-500">
                {rainHours.map((h, i) => (
                  <span key={i}>{h.label}</span>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Other Cities / Corridors Card */}
          <div className="rounded-3xl bg-[#181920] border border-white/[0.06] p-5 shadow-lg space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-white tracking-tight">
                Other Cities
              </h4>
              <button
                onClick={() => setSelectedStationId('sohna')}
                className="text-xs font-semibold text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
              >
                See All
              </button>
            </div>

            {/* List of 4 sleek city cards matching reference image */}
            <div className="space-y-2.5">
              {CORRIDOR_STATIONS.map((station) => {
                const isSelected = selectedStationId === station.id;
                return (
                  <button
                    key={station.id}
                    onClick={() => setSelectedStationId(station.id)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-[#222530] border-sky-500/50 shadow-md ring-1 ring-sky-500/30'
                        : 'bg-[#13141a] border-white/[0.04] hover:bg-[#1c1d25] hover:border-white/[0.1]'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        {station.country}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white block mt-0.5">
                        {station.city}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {station.condition}
                      </span>
                    </div>

                    <div className="p-1.5 rounded-xl bg-white/[0.04]">
                      {renderWeatherIcon3D(station.icon, 'w-7 h-7')}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveWeatherHero;
