// src/components/StatsCharts.tsx
import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Slider } from "@/components/ui/slider";

interface StatsChartsProps {
  completed: number;
  failed: number;
  successRate: number;
}

// Custom colors
const COLORS = {
  success: "#10b981", // emerald-500
  failure: "#ef4444", // red-500
  primary: "#a855f7", // purple-500
  accent: "#f59e0b", // amber-500
};

// Pie Chart Component
export function SuccessPieChart({ completed, failed }: StatsChartsProps) {
  const data = [
    { name: "Completed", value: completed, color: COLORS.success },
    { name: "Failed", value: failed, color: COLORS.failure },
  ];

  const total = completed + failed;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400">
        No data yet - complete some goals!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={5}
          dataKey="value"
          animationBegin={0}
          animationDuration={800}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "8px",
            color: "#fff",
          }}
        />
        <Legend
          wrapperStyle={{ color: "#9ca3af" }}
          formatter={(value) => <span style={{ color: "#d1d5db" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// Line Chart Component - Shows success rate trend
export function SuccessLineChart({ completed, failed, successRate }: StatsChartsProps) {
  const total = completed + failed;
  
  const generateHistoricalData = () => {
    if (total === 0) return [];
    
    const points = [];
    const variance = 0.15;
    
    for (let i = 0; i <= total; i++) {
      const progress = i / total;
      const baseRate = successRate * 0.5 + successRate * 0.5 * progress;
      const noise = (Math.sin(i * 2.5) * variance * (1 - progress));
      const rate = Math.max(0, Math.min(1, baseRate + noise));
      
      points.push({
        commitment: i === 0 ? "Start" : `#${i}`,
        rate: Math.round(rate * 100),
      });
    }
    
    return points;
  };

  const data = generateHistoricalData();

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-gray-400">
        No data yet - complete some goals!
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(168, 85, 247, 0.2)" />
        <XAxis 
          dataKey="commitment" 
          stroke="#6b7280" 
          tick={{ fill: "#9ca3af", fontSize: 12 }}
        />
        <YAxis 
          domain={[0, 100]} 
          stroke="#6b7280"
          tick={{ fill: "#9ca3af", fontSize: 12 }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#1a1a2e",
            border: "1px solid rgba(168, 85, 247, 0.3)",
            borderRadius: "8px",
            color: "#fff",
          }}
          formatter={(value: number) => [`${value}%`, "Success Rate"]}
        />
        <Line
          type="monotone"
          dataKey="rate"
          stroke={COLORS.primary}
          strokeWidth={3}
          dot={{ fill: COLORS.primary, strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: COLORS.accent }}
          animationDuration={1500}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// Stage configuration for the duck
const DUCK_STAGES = [
  { min: 0, max: 0, name: "Skeleton", emoji: "💀", description: "Withered away..." },
  { min: 1, max: 10, name: "Dead", emoji: "⚰️", description: "R.I.P. Duck" },
  { min: 11, max: 20, name: "Drowning", emoji: "😵", description: "Help! Drowning!" },
  { min: 21, max: 30, name: "Struggling", emoji: "😰", description: "Struggling to breathe!" },
  { min: 31, max: 40, name: "Treading", emoji: "😓", description: "Barely keeping up..." },
  { min: 41, max: 50, name: "Floating", emoji: "😐", description: "Just floating by..." },
  { min: 51, max: 60, name: "Swimming", emoji: "🙂", description: "Swimming along!" },
  { min: 61, max: 70, name: "Paddling", emoji: "😊", description: "Paddling happily!" },
  { min: 71, max: 80, name: "Jumping", emoji: "😄", description: "Jumping for joy!" },
  { min: 81, max: 90, name: "Flying", emoji: "🤩", description: "Soaring high!" },
  { min: 91, max: 100, name: "Sparkling", emoji: "✨", description: "Legendary duck!" },
];

function getStage(rate: number) {
  const percentage = Math.round(rate * 100);
  return DUCK_STAGES.find(s => percentage >= s.min && percentage <= s.max) || DUCK_STAGES[5];
}

// Duck Component with 11 stages
export function DuckMeter({ successRate, showTestSlider = false }: { successRate: number; showTestSlider?: boolean }) {
  const [testRate, setTestRate] = useState(successRate);
  const displayRate = showTestSlider ? testRate : successRate;
  const percentage = Math.round(displayRate * 100);
  const stage = getStage(displayRate);
  
  // Calculate visual positions based on stage
  const stageIndex = DUCK_STAGES.indexOf(stage);
  const waterLevel = Math.max(20, 90 - stageIndex * 7);
  const duckY = stageIndex <= 3 ? 120 - stageIndex * 10 : stageIndex >= 8 ? 20 + (10 - stageIndex) * 15 : 60 - (stageIndex - 4) * 8;

  // Background gradient based on stage
  const getBackground = () => {
    if (stageIndex <= 1) return "from-gray-900 via-gray-800 to-gray-700"; // Dead/Skeleton - dark
    if (stageIndex <= 3) return "from-slate-700 via-slate-600 to-blue-900"; // Drowning/Struggling - stormy
    if (stageIndex <= 5) return "from-sky-400 via-sky-500 to-blue-600"; // Floating/Treading - neutral
    if (stageIndex <= 7) return "from-sky-300 via-sky-400 to-blue-500"; // Swimming/Paddling - nice
    return "from-sky-200 via-blue-300 to-indigo-400"; // Flying/Sparkling - bright
  };

  return (
    <div className="space-y-4">
      <div className={`relative w-full h-[280px] rounded-xl overflow-hidden bg-gradient-to-b ${getBackground()} transition-all duration-700`}>
        
        {/* Stars for high stages */}
        {stageIndex >= 8 && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(stageIndex >= 10 ? 20 : 10)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-twinkle"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 50}%`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              >
                ⭐
              </div>
            ))}
          </div>
        )}

        {/* Rainbow for 100% */}
        {stageIndex >= 10 && (
          <div className="absolute top-0 left-0 right-0 h-20 opacity-60">
            <div className="w-full h-full bg-gradient-to-r from-red-400 via-yellow-400 via-green-400 via-blue-400 to-purple-400 rounded-b-full blur-sm" />
          </div>
        )}
        
        {/* Sun - appears at higher stages */}
        {stageIndex >= 6 && (
          <div 
            className={`absolute top-4 right-4 rounded-full transition-all duration-500 ${stageIndex >= 10 ? 'animate-pulse' : ''}`}
            style={{ 
              width: `${30 + stageIndex * 3}px`,
              height: `${30 + stageIndex * 3}px`,
              background: stageIndex >= 10 ? 'linear-gradient(135deg, #fef08a, #fbbf24, #f59e0b)' : '#fcd34d',
              boxShadow: `0 0 ${20 + stageIndex * 5}px rgba(253, 224, 71, ${0.3 + stageIndex * 0.05})`,
            }}
          />
        )}
        
        {/* Clouds - happy weather */}
        {stageIndex >= 5 && (
          <>
            <div className="absolute top-6 left-8 w-16 h-6 bg-white/80 rounded-full animate-float" />
            <div className="absolute top-4 left-14 w-10 h-5 bg-white/80 rounded-full animate-float" style={{ animationDelay: '0.5s' }} />
            {stageIndex >= 7 && (
              <>
                <div className="absolute top-10 left-32 w-14 h-5 bg-white/90 rounded-full animate-float" style={{ animationDelay: '1s' }} />
              </>
            )}
          </>
        )}

        {/* Storm clouds for low stages */}
        {stageIndex <= 3 && stageIndex > 0 && (
          <>
            <div className="absolute top-4 left-6 w-20 h-8 bg-gray-600/80 rounded-full" />
            <div className="absolute top-2 left-12 w-14 h-6 bg-gray-700/80 rounded-full" />
            <div className="absolute top-6 right-10 w-18 h-7 bg-gray-600/80 rounded-full" />
          </>
        )}

        {/* Rain for struggling stages */}
        {stageIndex >= 1 && stageIndex <= 4 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(15 - stageIndex * 2)].map((_, i) => (
              <div
                key={i}
                className="absolute w-0.5 bg-blue-300/60 animate-rain"
                style={{
                  left: `${Math.random() * 100}%`,
                  height: "20px",
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Lightning for very low stages */}
        {stageIndex <= 2 && stageIndex > 0 && (
          <div className="absolute top-8 left-1/4 text-4xl animate-flash">⚡</div>
        )}

        {/* Skulls/bones atmosphere for skeleton stage */}
        {stageIndex === 0 && (
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute text-2xl opacity-30 animate-float-slow"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 60}%`,
                  animationDelay: `${Math.random() * 3}s`,
                }}
              >
                {i % 2 === 0 ? '💀' : '🦴'}
              </div>
            ))}
          </div>
        )}
        
        {/* Water - only show for non-flying stages */}
        {stageIndex < 8 && (
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000"
            style={{ 
              height: `${waterLevel}%`,
              background: stageIndex <= 1 
                ? "linear-gradient(to bottom, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.95))"
                : stageIndex <= 3
                ? "linear-gradient(to bottom, rgba(30, 64, 175, 0.8), rgba(30, 58, 138, 0.95))"
                : "linear-gradient(to bottom, rgba(59, 130, 246, 0.7), rgba(37, 99, 235, 0.85))",
            }}
          >
            {/* Water waves */}
            <svg className="absolute -top-3 left-0 w-full" viewBox="0 0 400 20" preserveAspectRatio="none">
              <path
                d="M0,10 Q25,0 50,10 T100,10 T150,10 T200,10 T250,10 T300,10 T350,10 T400,10 V20 H0 Z"
                fill={stageIndex <= 1 ? "rgba(30, 41, 59, 0.8)" : stageIndex <= 3 ? "rgba(30, 64, 175, 0.8)" : "rgba(59, 130, 246, 0.7)"}
                className="animate-wave"
              />
            </svg>
          </div>
        )}

        {/* The Duck - changes based on stage */}
        <div 
          className={`absolute left-1/2 -translate-x-1/2 transition-all duration-700 ease-in-out ${
            stageIndex === 0 ? '' : 
            stageIndex <= 2 ? 'animate-shake' : 
            stageIndex <= 4 ? 'animate-bob-slow' :
            stageIndex <= 7 ? 'animate-bob' :
            'animate-fly'
          }`}
          style={{ top: `${duckY}px` }}
        >
          {/* Sparkles for legendary duck */}
          {stageIndex >= 10 && (
            <div className="absolute -inset-8">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-xl animate-sparkle"
                  style={{
                    left: `${Math.cos(i * 30 * Math.PI / 180) * 50 + 40}px`,
                    top: `${Math.sin(i * 30 * Math.PI / 180) * 50 + 40}px`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                >
                  ✨
                </div>
              ))}
            </div>
          )}

          {stageIndex === 0 ? (
            // Skeleton Duck
            <svg width="100" height="80" viewBox="0 0 100 80" className="opacity-80">
              {/* Skeleton body */}
              <ellipse cx="50" cy="50" rx="30" ry="20" fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4,2" />
              {/* Ribs */}
              <path d="M35,45 L65,45 M35,50 L65,50 M35,55 L65,55" stroke="#6b7280" strokeWidth="2" />
              {/* Skull head */}
              <circle cx="75" cy="35" r="15" fill="#d1d5db" />
              {/* Empty eye sockets */}
              <circle cx="70" cy="32" r="4" fill="#1f2937" />
              <circle cx="80" cy="32" r="4" fill="#1f2937" />
              {/* Beak bones */}
              <path d="M88,38 L98,40 L88,42" fill="none" stroke="#9ca3af" strokeWidth="2" />
              {/* Wing bones */}
              <path d="M30,45 L20,35 M25,48 L15,40" stroke="#6b7280" strokeWidth="2" />
            </svg>
          ) : stageIndex === 1 ? (
            // Dead Duck
            <svg width="100" height="60" viewBox="0 0 100 60" className="rotate-180">
              <ellipse cx="50" cy="30" rx="35" ry="20" fill="#6b7280" />
              <circle cx="75" cy="20" r="15" fill="#6b7280" />
              <text x="70" y="18" fontSize="10" fill="#1f2937">✕</text>
              <text x="78" y="18" fontSize="10" fill="#1f2937">✕</text>
              <ellipse cx="90" cy="22" rx="6" ry="4" fill="#9ca3af" />
              <ellipse cx="45" cy="30" rx="12" ry="10" fill="#4b5563" />
            </svg>
          ) : stageIndex >= 8 ? (
            // Flying Duck
            <svg width="100" height="80" viewBox="0 0 100 80" className={stageIndex >= 10 ? 'drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : ''}>
              {/* Body */}
              <ellipse cx="50" cy="45" rx="30" ry="18" fill={stageIndex >= 10 ? "#fef08a" : "#FCD34D"} />
              {/* Head */}
              <circle cx="78" cy="35" r="16" fill={stageIndex >= 10 ? "#fef08a" : "#FCD34D"} />
              {/* Eye */}
              <circle cx="84" cy="32" r="3" fill="#1a1a2e" />
              <circle cx="85" cy="31" r="1" fill="white" />
              {/* Happy beak */}
              <ellipse cx="96" cy="37" rx="7" ry="4" fill="#F97316" />
              {/* Spread wings */}
              <path d="M20,35 Q35,15 55,25 Q40,35 20,35" fill="#FBBF24" />
              <path d="M20,55 Q35,75 55,65 Q40,55 20,55" fill="#FBBF24" />
              {/* Blush */}
              <circle cx="72" cy="40" r="4" fill="#FECACA" opacity="0.6" />
              {/* Crown for legendary */}
              {stageIndex >= 10 && (
                <path d="M68,18 L72,8 L78,15 L84,5 L88,18 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="1" />
              )}
            </svg>
          ) : (
            // Swimming Duck (stages 2-7)
            <svg width="80" height="80" viewBox="0 0 100 100" className={stageIndex >= 6 ? 'drop-shadow-lg' : ''}>
              {/* Duck body */}
              <ellipse cx="50" cy="60" rx="35" ry="25" fill={stageIndex <= 3 ? "#9ca3af" : "#FCD34D"} />
              {/* Duck head */}
              <circle cx="75" cy="40" r="20" fill={stageIndex <= 3 ? "#9ca3af" : "#FCD34D"} />
              {/* Eye */}
              <circle cx="82" cy="36" r="4" fill="#1a1a2e" />
              <circle cx="83" cy="35" r="1.5" fill="white" />
              {/* Beak */}
              <ellipse cx="95" cy="42" rx="8" ry="5" fill={stageIndex <= 3 ? "#6b7280" : "#F97316"} />
              {/* Wing */}
              <ellipse cx="45" cy="55" rx="15" ry="12" fill={stageIndex <= 3 ? "#6b7280" : "#FBBF24"} />
              {/* Expression based on stage */}
              {stageIndex <= 2 && <text x="78" y="40" fontSize="12" fill="#1a1a2e">✕</text>}
              {stageIndex === 3 && <path d="M76,30 Q82,28 88,32" stroke="#1a1a2e" strokeWidth="2" fill="none" />}
              {stageIndex === 4 && <path d="M76,32 L88,32" stroke="#1a1a2e" strokeWidth="2" />}
              {stageIndex >= 6 && <circle cx="70" cy="45" r="4" fill="#FECACA" opacity="0.6" />}
              {stageIndex >= 7 && <path d="M88,45 Q92,48 88,51" stroke="#1a1a2e" strokeWidth="1.5" fill="none" />}
            </svg>
          )}
          
          {/* Bubbles when underwater */}
          {stageIndex >= 1 && stageIndex <= 4 && (
            <div className="absolute -right-2 top-0">
              {[...Array(5 - stageIndex)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white/40 rounded-full animate-bubble"
                  style={{
                    right: `${i * 8}px`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Motion lines for jumping/flying */}
          {stageIndex >= 7 && stageIndex < 10 && (
            <div className="absolute -left-6 top-1/2 -translate-y-1/2">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-0.5 bg-white/60 rounded mb-2 animate-motion-line"
                  style={{ animationDelay: `${i * 0.1}s`, width: `${16 - i * 4}px` }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status badge */}
        <div className="absolute bottom-4 left-0 right-0 text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all duration-500 ${
            stageIndex === 0 ? "bg-gray-800/90 text-gray-300" :
            stageIndex <= 2 ? "bg-red-600/90 text-white" : 
            stageIndex <= 4 ? "bg-amber-500/90 text-white" :
            stageIndex <= 6 ? "bg-blue-500/90 text-white" :
            stageIndex <= 8 ? "bg-emerald-500/90 text-white" :
            "bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-500 text-white shadow-lg"
          }`}>
            <span className="text-lg">{stage.emoji}</span>
            <span>{stage.description}</span>
          </div>
        </div>

        {/* Percentage label */}
        <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white font-bold">{percentage}%</span>
        </div>

        {/* Stage name */}
        <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-sm">{stage.name}</span>
        </div>
      </div>

      {/* Test Slider */}
      {showTestSlider && (
        <div className="space-y-2 px-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>💀 0%</span>
            <span>Test the duck stages</span>
            <span>100% ✨</span>
          </div>
          <Slider
            value={[testRate * 100]}
            onValueChange={([value]) => setTestRate(value / 100)}
            max={100}
            min={0}
            step={1}
            className="w-full"
          />
          <div className="flex justify-center gap-1 flex-wrap">
            {DUCK_STAGES.map((s, i) => (
              <button
                key={i}
                onClick={() => setTestRate(s.min / 100)}
                className={`px-2 py-1 text-xs rounded transition-all ${
                  stage === s 
                    ? 'bg-primary text-white' 
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                }`}
              >
                {s.emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
