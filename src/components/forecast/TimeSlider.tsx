import React from 'react';
import { useHeatwave } from '../../context/HeatwaveContext';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { RiskBadge } from '../common/RiskBadge';

export const TimeSlider: React.FC = () => {
  const {
    selectedHourOffset,
    setSelectedHourOffset,
    isPlayingForecast,
    setIsPlayingForecast,
    forecastSteps,
    currentStep,
  } = useHeatwave();

  const stepOffsets = forecastSteps.map((s) => s.hourOffset);

  const handleStepClick = (offset: number) => {
    setSelectedHourOffset(offset);
    if (isPlayingForecast) setIsPlayingForecast(false);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    // Find closest step offset
    const closest = stepOffsets.reduce((prev, curr) =>
      Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
    );
    setSelectedHourOffset(closest);
    if (isPlayingForecast) setIsPlayingForecast(false);
  };

  const summary = currentStep?.summary;
  const highestRiskLevel = summary
    ? summary.severeCount > 0
      ? 'SEVERE'
      : summary.highCount > 0
      ? 'HIGH'
      : summary.moderateCount > 0
      ? 'MODERATE'
      : 'LOW'
    : 'LOW';

  return (
    <div className="glass-panel rounded-xl p-4 border border-slate-800 shadow-xl space-y-3">
      {/* Top Info Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {/* Play/Pause Button */}
          <button
            onClick={() => setIsPlayingForecast(!isPlayingForecast)}
            className={`p-2.5 rounded-lg flex items-center justify-center font-bold text-white transition-all shadow-md ${
              isPlayingForecast
                ? 'bg-amber-600 hover:bg-amber-500 ring-2 ring-amber-400/50'
                : 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
            }`}
            title={isPlayingForecast ? 'Pause Forecast' : 'Play 7-Day Risk Timeline'}
          >
            {isPlayingForecast ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            onClick={() => {
              setSelectedHourOffset(0);
              setIsPlayingForecast(false);
            }}
            className="p-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Reset to Live (+0h)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-xs font-bold text-white tracking-wide uppercase">
                Forecast Horizon:
              </span>
              <span className="text-xs font-mono font-extrabold text-sky-400">
                {selectedHourOffset === 0 ? 'LIVE (+0h)' : `+${selectedHourOffset} Hours`}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {currentStep ? currentStep.displayDate : 'Loading forecast...'}
            </p>
          </div>
        </div>

        {/* City Peak Risk Badge & Time Counter */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
              City Peak Heat Risk
            </span>
            <RiskBadge level={highestRiskLevel} size="sm" />
          </div>
        </div>
      </div>

      {/* Range Slider Track */}
      <div className="relative pt-2 pb-1">
        <input
          type="range"
          min={0}
          max={168}
          step={6}
          value={selectedHourOffset}
          onChange={handleSliderChange}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
        />

        {/* Custom Stop Pills */}
        <div className="flex justify-between items-center mt-2 px-1">
          {stepOffsets.map((offset) => {
            const isSelected = selectedHourOffset === offset;
            const stepStep = forecastSteps.find((s) => s.hourOffset === offset);
            const severeCount = stepStep?.summary.severeCount || 0;
            const highCount = stepStep?.summary.highCount || 0;

            const isSevere = severeCount > 0;
            const isHigh = !isSevere && highCount > 0;

            return (
              <button
                key={offset}
                onClick={() => handleStepClick(offset)}
                className={`flex flex-col items-center transition-all ${
                  isSelected ? 'scale-110' : 'opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full mb-1 border transition-all ${
                    isSelected
                      ? 'ring-4 ring-rose-500/30 bg-rose-500 border-white'
                      : isSevere
                      ? 'bg-rose-500 border-rose-400'
                      : isHigh
                      ? 'bg-orange-500 border-orange-400'
                      : 'bg-slate-700 border-slate-600'
                  }`}
                />
                <span
                  className={`text-[10px] font-mono font-bold ${
                    isSelected ? 'text-white font-extrabold' : 'text-slate-400'
                  }`}
                >
                  {offset === 0 ? 'Now' : `+${offset}h`}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
