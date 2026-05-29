"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Droplets, 
  Flame, 
  Trash2, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Award, 
  Settings, 
  Activity, 
  RefreshCw,
  AlertCircle,
  Zap
} from "lucide-react";

interface WaterLog {
  _id: string;
  amount: number;
  timestamp: string;
}

export default function Home() {
  const [logs, setLogs] = useState<WaterLog[]>([]);
  const [target, setTarget] = useState<number>(2000);
  const [themeMode, setThemeMode] = useState<"hydro" | "goku">("hydro");
  const [showTargetModal, setShowTargetModal] = useState<boolean>(false);
  const [customTarget, setCustomTarget] = useState<string>("2000");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [bubbles, setBubbles] = useState<Array<{ id: number; left: number; size: number; delay: number; duration: number }>>([]);

  // Preload Goku images on client mount to make transitions lag-free
  useEffect(() => {
    if (typeof window !== "undefined") {
      const imagesToPreload = [
        "/goku/goku_sleeping_small.png",
        "/goku/goku_sleeping_medium.png",
        "/goku/goku_eyes_cracking.png",
        "/goku/goku_eyes_opened.png",
        "/goku/goku_glass_cracks.png",
        "/goku/goku_fully_powered.png"
      ];
      imagesToPreload.forEach((src) => {
        const img = new window.Image();
        img.src = src;
      });
    }
  }, []);

  // Load target & theme preference from localStorage on client mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTarget = localStorage.getItem("h2o_daily_target");
      if (savedTarget) {
        setTarget(parseInt(savedTarget, 10));
        setCustomTarget(savedTarget);
      }
      
      const savedTheme = localStorage.getItem("h2o_theme_mode") as "hydro" | "goku" | null;
      if (savedTheme) {
        setThemeMode(savedTheme);
      }
    }
  }, []);

  // Fetch settings (target) and water logs dynamically from backend MONGODB
  const fetchSettingsAndLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const settingsRes = await fetch("/api/settings");
      const settingsResult = await settingsRes.json();
      if (settingsResult.success && settingsResult.data) {
        setTarget(settingsResult.data.target);
        setCustomTarget(settingsResult.data.target.toString());
      }

      const logsRes = await fetch("/api/water-logs");
      const logsResult = await logsRes.json();
      if (logsResult.success) {
        setLogs(logsResult.data);
        setErrorMessage(null);
      } else {
        setErrorMessage("Failed to fetch logs: " + (logsResult.error || "Unknown error"));
      }
    } catch (err) {
      setErrorMessage("Could not connect to the server. Please check database configuration.");
      console.error("Error fetching data:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAndLogs();
  }, [fetchSettingsAndLogs]);

  // Generate floating bubbles inside the beaker
  useEffect(() => {
    const newBubbles = Array.from({ length: 15 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 100, // percentage position
      size: Math.random() * 8 + 4, // 4px to 12px
      delay: Math.random() * 5, // 0s to 5s delay
      duration: Math.random() * 4 + 3 // 3s to 7s duration
    }));
    setBubbles(newBubbles);
  }, []);

  // Handle theme mode toggle click
  const handleToggleTheme = (mode: "hydro" | "goku") => {
    setThemeMode(mode);
    localStorage.setItem("h2o_theme_mode", mode);
  };

  // Filter logs for today (in local user timezone)
  const getTodayLogs = useCallback(() => {
    const todayStr = new Date().toLocaleDateString("sv"); // sv format is YYYY-MM-DD
    return logs.filter(log => new Date(log.timestamp).toLocaleDateString("sv") === todayStr);
  }, [logs]);

  // Calculate today's total intake
  const todayLogs = getTodayLogs();
  const todayTotal = todayLogs.reduce((sum, log) => sum + log.amount, 0);
  const progressPercent = Math.min((todayTotal / target) * 100, 100);

  // Helper to determine the Goku image based on ml threshold
  const getGokuImage = (amount: number) => {
    if (amount < 500) {
      return "/goku/goku_sleeping_small.png"; // baseline sleeping
    } else if (amount < 1000) {
      return "/goku/goku_sleeping_small.png"; // 500ml
    } else if (amount < 1500) {
      return "/goku/goku_sleeping_medium.png"; // 1L
    } else if (amount < 2000) {
      return "/goku/goku_eyes_cracking.png"; // 1.5L
    } else if (amount < 2500) {
      return "/goku/goku_eyes_opened.png"; // 2L
    } else if (amount < 3000) {
      return "/goku/goku_glass_cracks.png"; // 2.5L
    } else {
      return "/goku/goku_fully_powered.png"; // 3L+
    }
  };

  // Helper to determine the Goku training status label
  const getGokuStatus = (amount: number) => {
    if (amount < 500) {
      return "Goku is small and sleeping... Hydrate to 500ml!";
    } else if (amount < 1000) {
      return "Stage 1: Small Goku sleeping (500ml reached)";
    } else if (amount < 1500) {
      return "Stage 2: Medium Goku sleeping (1L reached)";
    } else if (amount < 2000) {
      return "Stage 3: Goku opening eyes a bit (1.5L reached)";
    } else if (amount < 2500) {
      return "Stage 4: Eyes fully open! (2L reached)";
    } else if (amount < 3000) {
      return "Stage 5: Cracks forming on the glass! (2.5L reached)";
    } else {
      return "Stage 6: SUPER SAIYAN UNLEASHED! (3L goal met)";
    }
  };

  // Group logs by YYYY-MM-DD to find streaks and totals
  const getDailyTotals = useCallback(() => {
    const dailyTotals: Record<string, number> = {};
    logs.forEach(log => {
      const dateStr = new Date(log.timestamp).toLocaleDateString("sv");
      dailyTotals[dateStr] = (dailyTotals[dateStr] || 0) + log.amount;
    });
    return dailyTotals;
  }, [logs]);

  // Calculate streak: consecutive days where target was met
  const calculateStreak = useCallback(() => {
    const dailyTotals = getDailyTotals();
    let streak = 0;
    const checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toLocaleDateString("sv");
      const total = dailyTotals[dateStr] || 0;

      if (total >= target) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        const isTodayVal = dateStr === new Date().toLocaleDateString("sv");
        if (isTodayVal) {
          checkDate.setDate(checkDate.getDate() - 1);
          const yesterdayStr = checkDate.toLocaleDateString("sv");
          const yesterdayTotal = dailyTotals[yesterdayStr] || 0;
          if (yesterdayTotal >= target) {
            continue;
          } else {
            break;
          }
        } else {
          break;
        }
      }
    }
    return streak;
  }, [getDailyTotals, target]);

  // Calculate average daily intake over the active tracked days (past 30 days)
  const calculateAverage = useCallback(() => {
    const dailyTotals = getDailyTotals();
    const totalsArray = Object.values(dailyTotals);
    if (totalsArray.length === 0) return 0;
    const sum = totalsArray.reduce((acc, val) => acc + val, 0);
    return Math.round(sum / Object.keys(dailyTotals).length);
  }, [getDailyTotals]);

  // Retrieve weekly dataset for the chart (last 7 days)
  const getWeeklyData = useCallback(() => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const dailyTotals = getDailyTotals();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("sv");
      const dayName = days[d.getDay()];
      const total = dailyTotals[dateStr] || 0;

      result.push({
        dayName,
        dateStr,
        amount: total,
        isToday: i === 0
      });
    }
    return result;
  }, [getDailyTotals]);

  const weeklyData = getWeeklyData();

  // Add water log via API
  const addWaterLog = async (amount: number) => {
    if (amount <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/water-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount })
      });
      const result = await response.json();
      if (result.success) {
        setLogs(prev => [result.data, ...prev]);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || "Failed to log water.");
      }
    } catch (err) {
      setErrorMessage("Network error: failed to log water intake.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete water log via API
  const deleteWaterLog = async (id: string) => {
    try {
      const response = await fetch(`/api/water-logs/${id}`, {
        method: "DELETE"
      });
      const result = await response.json();
      if (result.success) {
        setLogs(prev => prev.filter(log => log._id !== id));
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || "Failed to delete log.");
      }
    } catch (err) {
      setErrorMessage("Network error: failed to delete log.");
      console.error(err);
    }
  };

  // Handle dynamic target update via settings API
  const handleUpdateTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customTarget, 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 10000) {
      setErrorMessage("Target must be between 500ml and 10000ml");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: parsed })
      });
      const result = await response.json();
      if (result.success && result.data) {
        setTarget(result.data.target);
        setCustomTarget(result.data.target.toString());
        setShowTargetModal(false);
        setErrorMessage(null);
      } else {
        setErrorMessage(result.error || "Failed to update target.");
      }
    } catch (err) {
      setErrorMessage("Network error: failed to save daily target settings.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle custom manual log submission
  const handleCustomLog = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(customAmount, 10);
    if (!isNaN(parsed) && parsed > 0) {
      addWaterLog(parsed);
      setCustomAmount("");
    }
  };

  // Format log timestamp to readable hours/minutes
  const formatTime = (timestampStr: string) => {
    return new Date(timestampStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const streak = calculateStreak();
  const dailyAverage = calculateAverage();

  // Water level SVG path calculations for a loopable sine wave (Hydro Mode)
  const wavePathFront = "M0 50 C150 90, 350 10, 500 50 C650 90, 850 10, 1000 50 L1000 250 L0 250 Z";
  const wavePathBack = "M0 50 C150 10, 350 90, 500 50 C650 10, 850 90, 1000 50 L1000 250 L0 250 Z";

  // Dynamic Theme Styling Tokens based on Active Mode toggle
  const primaryThemeColor = themeMode === "hydro" ? "text-aqua-primary" : "text-amber-500";
  const accentThemeColor = themeMode === "hydro" ? "text-aqua-secondary" : "text-orange-500";
  const bgThemeGradient = themeMode === "hydro" ? "from-aqua-primary to-aqua-secondary" : "from-amber-400 to-orange-500";
  const borderThemeGlow = themeMode === "hydro" ? "rgba(0, 240, 255, 0.3)" : "rgba(245, 158, 11, 0.4)";

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8 md:gap-12 relative z-10">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {themeMode === "hydro" ? (
              <Droplets className="w-6 h-6 animate-pulse text-aqua-primary" />
            ) : (
              <Zap className="w-6 h-6 animate-bounce text-amber-500" />
            )}
            <span className="text-sm font-semibold uppercase tracking-wider text-slate-300">
              {themeMode === "hydro" ? "Hydration Hub" : "Saiyan Power Tank"}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            H2O <span className={`bg-gradient-to-r ${themeMode === "hydro" ? "from-aqua-primary to-aqua-secondary" : "from-amber-400 to-orange-500"} bg-clip-text text-transparent`}>Flow</span>
          </h1>
        </div>

        {/* Right Header Navigation & Theme Toggle */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Segmented Theme Toggle Button */}
          <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 shadow-inner">
            <button 
              onClick={() => handleToggleTheme("hydro")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                themeMode === "hydro" 
                  ? "bg-aqua-primary text-slate-950 shadow-md shadow-aqua-primary/25" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Hydro
            </button>
            <button 
              onClick={() => handleToggleTheme("goku")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
                themeMode === "goku" 
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25" 
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Goku
            </button>
          </div>

          <button 
            onClick={fetchSettingsAndLogs}
            className="p-3 rounded-xl glass-panel hover:bg-white/5 transition duration-200 border border-white/5 text-slate-300"
            title="Refresh database data"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button 
            onClick={() => setShowTargetModal(true)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl glass-panel hover:bg-white/5 transition duration-200 border border-white/5"
          >
            <Settings className={`w-5 h-5 ${themeMode === "hydro" ? "text-aqua-secondary" : "text-amber-500"}`} />
            <span className="text-sm font-medium text-slate-200">Daily Target: {target}ml</span>
          </button>
        </div>
      </header>

      {/* Connection Errors Alert */}
      {errorMessage && (
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-red-500/20 bg-red-950/20 text-red-300 text-sm animate-fade-in">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="flex-1">{errorMessage}</p>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Beaker Visualizer or Goku Capsule and Quick Presets */}
        <section className="lg:col-span-5 flex flex-col items-center gap-6 glass-panel rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-bold self-start flex items-center gap-2">
            {themeMode === "hydro" ? (
              <>
                <Activity className="w-5 h-5 text-aqua-primary" /> Today's Hydro Beaker
              </>
            ) : (
              <>
                <Zap className="w-5 h-5 text-amber-500 animate-pulse" /> Goku Power Chamber
              </>
            )}
          </h2>

          {/* Conditional Visualizer */}
          {themeMode === "hydro" ? (
            /* HYDRO BEAKER DISPLAY */
            <div className="relative w-64 h-80 rounded-b-[40px] rounded-t-[20px] glass-panel border-4 border-slate-600/30 overflow-hidden shadow-2xl flex flex-col justify-end">
              <div className="absolute top-0 right-4 bottom-0 w-8 flex flex-col justify-between py-6 text-[10px] font-bold text-slate-400/50 z-20 pointer-events-none select-none">
                <div>{target}ml -</div>
                <div>{Math.round(target * 0.75)}ml -</div>
                <div>{Math.round(target * 0.5)}ml -</div>
                <div>{Math.round(target * 0.25)}ml -</div>
                <div>0ml -</div>
              </div>

              {progressPercent >= 100 && (
                <>
                  <div className="absolute inset-0 bg-aqua-primary/5 z-20 pointer-events-none animate-pulse" />
                  <div className="absolute top-10 left-0 right-0 z-22 flex justify-center pointer-events-none animate-pulse">
                    <div className="px-3.5 py-1.5 rounded-full bg-ocean-dark/90 border border-aqua-primary text-aqua-primary text-[10px] font-bold tracking-widest flex items-center gap-1 shadow-lg shadow-aqua-primary/25">
                      <Award className="w-3.5 h-3.5" /> DAILY GOAL ACHIEVED!
                    </div>
                  </div>
                </>
              )}

              <div 
                className="absolute left-0 right-0 bottom-0 transition-all duration-1000 ease-out" 
                style={{ height: `${progressPercent}%` }}
              >
                <div className="absolute bottom-0 left-0 w-[200%] h-full">
                  <svg 
                    viewBox="0 0 1000 250" 
                    preserveAspectRatio="none" 
                    className="absolute bottom-[98%] left-0 w-full h-12 fill-aqua-accent/40 animate-wave-slow"
                  >
                    <path d={wavePathBack} />
                  </svg>
                  <div className="w-full h-full bg-gradient-to-t from-aqua-accent/40 to-aqua-accent/60" />
                </div>

                <div className="absolute bottom-0 left-0 w-[200%] h-full z-10">
                  <svg 
                    viewBox="0 0 1000 250" 
                    preserveAspectRatio="none" 
                    className="absolute bottom-[98%] left-0 w-full h-12 fill-aqua-primary/70 animate-wave-fast"
                  >
                    <path d={wavePathFront} />
                  </svg>
                  <div className="w-full h-full bg-gradient-to-t from-aqua-primary/60 to-aqua-secondary/80" />
                </div>

                <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                  {progressPercent > 5 && bubbles.map((bubble) => (
                    <div
                      key={bubble.id}
                      className="bubble"
                      style={{
                        left: `${bubble.left}%`,
                        width: `${bubble.size}px`,
                        height: `${bubble.size}px`,
                        animationDelay: `${bubble.delay}s`,
                        animationDuration: `${bubble.duration}s`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                <span className="text-4xl font-extrabold drop-shadow-[0_2px_8px_rgba(3,10,22,0.8)]">
                  {Math.round(progressPercent)}%
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 drop-shadow-[0_2px_4px_rgba(3,10,22,0.8)] mt-1">
                  {todayTotal} / {target} ml
                </span>
              </div>
            </div>
          ) : (
            /* GOKU CAPSULE DISPLAY */
            <div className="flex flex-col items-center w-full gap-4">
              <div 
                className={`relative w-64 h-80 rounded-[30px] overflow-hidden shadow-2xl transition-all duration-500 border-4 ${
                  todayTotal >= 2500 && todayTotal < 3000
                    ? "animate-heartbeat-fast"
                    : "animate-heartbeat-slow"
                } ${
                  todayTotal >= 3000 
                    ? "border-orange-500 glow-active" 
                    : todayTotal >= 2500 
                      ? "border-amber-500/50 border-dashed animate-pulse" 
                      : "border-slate-700/60"
                }`}
                style={{ 
                  boxShadow: todayTotal >= 3000 ? `0 0 35px ${borderThemeGlow}` : "none"
                }}
              >
                {/* Goku Stage Image */}
                <img 
                  key={getGokuImage(todayTotal)}
                  src={getGokuImage(todayTotal)} 
                  alt={getGokuStatus(todayTotal)}
                  className={`w-full h-full object-cover animate-goku-swap ${
                    todayTotal >= 3000 ? "scale-105" : "scale-100"
                  }`}
                />

                {/* Glass crack overlay using simple CSS styling for additional flavor */}
                {todayTotal >= 2500 && todayTotal < 3000 && (
                  <div className="absolute inset-0 bg-radial-[circle_at_center,_transparent_40%,_rgba(255,255,255,0.05)_100%] pointer-events-none" />
                )}

                {/* Aura Energy Glow Overlay */}
                <div 
                  className={`absolute inset-0 pointer-events-none transition-opacity duration-500 mix-blend-screen ${
                    todayTotal >= 3000 
                      ? "bg-amber-500/10 opacity-100" 
                      : todayTotal >= 2000 
                        ? "bg-amber-400/5 opacity-80" 
                        : "opacity-0"
                  }`} 
                />

                {/* Volume Overlay inside Goku Chamber */}
                <div className="absolute bottom-4 left-4 right-4 bg-slate-950/85 backdrop-blur-md border border-white/5 py-1.5 px-3 rounded-xl flex justify-between items-center z-25">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Saiyan Energy</span>
                  <span className="text-xs font-bold text-amber-400">{todayTotal} ml</span>
                </div>
              </div>

              {/* Status Energy Label */}
              <div className="p-3.5 rounded-2xl glass-panel text-center text-xs font-bold border border-amber-500/10 text-amber-400 w-full tracking-wide">
                {getGokuStatus(todayTotal)}
              </div>
            </div>
          )}

          {/* Quick Preset Buttons */}
          <div className="w-full flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Quick Hydrate Presets</h3>
            <div className="grid grid-cols-2 gap-3 w-full">
              {[
                { amount: 50, label: "50ml", desc: "Sip" },
                { amount: 100, label: "100ml", desc: "Shot" },
                { amount: 250, label: "250ml", desc: "Glass" },
                { amount: 500, label: "500ml", desc: "Bottle" }
              ].map((preset) => (
                <button
                  key={preset.amount}
                  onClick={() => addWaterLog(preset.amount)}
                  disabled={isSubmitting}
                  className={`p-3.5 rounded-2xl glass-panel glass-card-hover border border-white/5 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-50 group cursor-pointer`}
                >
                  <span className={`text-lg font-bold ${primaryThemeColor} group-hover:scale-110 transition duration-200`}>
                    +{preset.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</span>
                </button>
              ))}
            </div>

            {/* Custom Amount Form */}
            <form onSubmit={handleCustomLog} className="flex gap-2 mt-2">
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Custom (e.g. 350)"
                min="1"
                required
                className={`flex-1 px-4 py-3 rounded-xl bg-ocean-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-opacity-50 focus:border-amber-400 text-sm transition`}
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-3 rounded-xl bg-gradient-to-r ${bgThemeGradient} hover:opacity-90 active:scale-95 text-slate-950 text-sm font-bold flex items-center gap-1 transition disabled:opacity-50 shrink-0 cursor-pointer`}
              >
                <Plus className="w-4 h-4 stroke-[3px]" /> Log
              </button>
            </form>
          </div>
        </section>

        {/* RIGHT COLUMN: Statistics Cards, Weekly Chart, and Logs History */}
        <section className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Dashboard Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            {/* Streak Card */}
            <div className="glass-panel rounded-2xl p-4.5 flex flex-col justify-between min-h-28">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Hydra Streak</span>
                <Flame className={`w-5 h-5 ${streak > 0 ? (themeMode === "hydro" ? "text-orange-500 animate-pulse" : "text-amber-500 animate-bounce") : "text-slate-500"}`} />
              </div>
              <div>
                <div className="text-2xl font-black mt-2 text-white">
                  {streak} <span className="text-xs font-semibold text-slate-400">days</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Target met consistently</p>
              </div>
            </div>

            {/* Today Total Card */}
            <div className="glass-panel rounded-2xl p-4.5 flex flex-col justify-between min-h-28">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Today logged</span>
                {themeMode === "hydro" ? (
                  <Droplets className="w-5 h-5 text-aqua-secondary" />
                ) : (
                  <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                )}
              </div>
              <div>
                <div className="text-2xl font-black mt-2 text-white">
                  {todayTotal} <span className="text-xs font-semibold text-slate-400">ml</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Of daily {target}ml goal</p>
              </div>
            </div>

            {/* Daily Average Card */}
            <div className="glass-panel rounded-2xl p-4.5 flex flex-col justify-between min-h-28">
              <div className="flex justify-between items-start">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Daily Average</span>
                <TrendingUp className={`w-5 h-5 ${themeMode === "hydro" ? "text-purple-400" : "text-orange-400"}`} />
              </div>
              <div>
                <div className="text-2xl font-black mt-2 text-white">
                  {dailyAverage} <span className="text-xs font-semibold text-slate-400">ml</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Average logged in last 30d</p>
              </div>
            </div>
          </div>

          {/* Weekly Progress Bar Chart */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col gap-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Calendar className={`w-5 h-5 ${themeMode === "hydro" ? "text-aqua-secondary" : "text-amber-500"}`} /> Weekly Analytics
            </h3>
            <div className="flex items-end justify-between h-40 pt-4 px-2 bg-ocean-dark/20 rounded-2xl border border-white/5">
              {weeklyData.map((day) => {
                const heightPercent = Math.min((day.amount / target) * 100, 100);
                const metTarget = day.amount >= target;
                
                return (
                  <div key={day.dateStr} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <div className="relative w-full flex justify-center group">
                      {/* Tooltip on Hover */}
                      <span className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition duration-150 bg-slate-900 border border-white/10 text-white text-[10px] px-2 py-1 rounded shadow-lg pointer-events-none z-10 shrink-0 select-none">
                        {day.amount} ml
                      </span>
                      {/* Interactive Bar */}
                      <div 
                        className={`w-7 sm:w-10 rounded-t-lg transition-all duration-500 ${
                          day.isToday 
                            ? `bg-gradient-to-t ${bgThemeGradient} shadow-lg` 
                            : metTarget 
                              ? (themeMode === "hydro" ? "bg-aqua-accent/60" : "bg-amber-500/60") 
                              : "bg-slate-700/40"
                        }`}
                        style={{ 
                          height: `${Math.max(heightPercent, 4)}%`,
                          boxShadow: day.isToday ? `0 0 15px ${borderThemeGlow}` : "none"
                        }}
                      />
                    </div>
                    <span className={`text-xs font-medium pb-2 ${day.isToday ? (themeMode === "hydro" ? "text-aqua-primary font-bold" : "text-amber-500 font-bold") : "text-slate-400"}`}>
                      {day.dayName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Intake History Log List */}
          <div className="glass-panel rounded-3xl p-6 flex flex-col gap-4 flex-1">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Activity className={`w-5 h-5 ${themeMode === "hydro" ? "text-aqua-secondary" : "text-amber-500"}`} /> Intake History
              </h3>
              <span className="text-xs font-semibold bg-white/5 text-slate-400 px-3 py-1 rounded-full border border-white/5">
                {todayLogs.length} logs today
              </span>
            </div>

            <div className="overflow-y-auto max-h-56 pr-1 flex flex-col gap-3">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-14 rounded-2xl bg-white/5 animate-pulse border border-white/5" />
                ))
              ) : todayLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-slate-500">
                  <Droplets className="w-10 h-10 stroke-[1.5] mb-2 text-slate-600" />
                  <p className="text-sm font-medium">No water logged yet today.</p>
                  <p className="text-xs mt-0.5">Choose a preset above to log your first sip!</p>
                </div>
              ) : (
                todayLogs.map((log) => (
                  <div 
                    key={log._id}
                    className="flex justify-between items-center px-4 py-3 rounded-2xl bg-ocean-dark/30 border border-white/5 hover:border-white/10 hover:bg-ocean-dark/50 transition duration-200 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${themeMode === "hydro" ? "bg-aqua-primary/10 text-aqua-primary" : "bg-amber-500/10 text-amber-500"}`}>
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white">{log.amount} ml</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Logged at {formatTime(log.timestamp)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteWaterLog(log._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition duration-150 cursor-pointer"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>

      </div>

      {/* Target Configuration Settings Modal */}
      {showTargetModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel border border-white/10 rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-5">
            <div>
              <h3 className="text-lg font-bold">Adjust Target Intake</h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize your daily target depending on your weight, activity levels, and environment factors.
              </p>
            </div>
            
            <form onSubmit={handleUpdateTarget} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-300">Daily Goal Amount (ml)</label>
                <input
                  type="number"
                  value={customTarget}
                  onChange={(e) => setCustomTarget(e.target.value)}
                  placeholder="e.g. 2000"
                  min="500"
                  max="10000"
                  required
                  className="px-4 py-3 rounded-xl bg-ocean-dark border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-aqua-primary text-sm transition"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCustomTarget(target.toString());
                    setShowTargetModal(false);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${bgThemeGradient} hover:opacity-90 text-slate-950 text-sm font-bold transition cursor-pointer disabled:opacity-50`}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
