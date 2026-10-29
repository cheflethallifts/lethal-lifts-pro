import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Settings, ChevronRight, ChevronDown, ChevronUp, Activity,
  CalendarDays, BarChart2, Plus, Trash2, Save, CheckCircle,
  Edit3, Calendar, MessageSquare, ArrowDown, History as HistoryIcon,
  ArrowLeft, RefreshCw, TrendingUp, Scale, Clipboard, Copy, Check,
  Clock, Info, Mail, LogOut, Link as LinkIcon, Unlink, Play, Pause,
  RotateCcw, Timer as TimerIcon, BookOpen, X as XIcon,
  Calculator as CalculatorIcon, Dumbbell, Search, Camera, AlertTriangle,
  Lock, Star, WifiOff
} from 'lucide-react';

// ==========================================
// 🔴 SUPABASE CONFIGURATION (VITE ENV) 🔴
// ==========================================
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient = null;
let configError = false;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
} else {
  configError = true;
}

const safeStorageGet = (key, defaultVal = null) => {
  try { return localStorage.getItem(key) || defaultVal; } catch (e) { return defaultVal; }
};
const safeStorageSet = (key, val) => {
  try { localStorage.setItem(key, val); } catch (e) {}
};
const safeStorageRemove = (key) => {
  try { localStorage.removeItem(key); } catch (e) {}
};

const LethalLogo = ({ size = 72, className = "" }) => (
  <img 
    src="/App.Logo.png" 
    alt="Lethal Lifts Logo" 
    style={{ width: size, height: size }} 
    className={`object-cover rounded-full shadow-[0_0_15px_rgba(34,211,238,0.3)] border border-neutral-700 ${className}`} 
  />
);

const formatSafeDate = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return "Unknown Date";
  const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(safeStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date(dateStr);
    if (isNaN(fallback.getTime())) return "Unknown Date";
    return fallback.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getSafeTime = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return 0;
  const safeStr = dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`;
  const d = new Date(safeStr);
  if (isNaN(d.getTime())) {
    const fallback = new Date(dateStr);
    return isNaN(fallback.getTime()) ? 0 : fallback.getTime();
  }
  return d.getTime();
};

const compressAndUploadImage = async (file, userId, supabase) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
            scaleSize = MAX_WIDTH / img.width;
        }
        
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(async (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          const fileName = `${userId}/${Date.now()}.webp`;
          
          const { data, error } = await supabase
            .storage
            .from('progress_pics')
            .upload(fileName, blob, {
              contentType: 'image/webp',
              upsert: false
            });
            
          if (error) reject(error);
          else resolve(data.path);
        }, 'image/webp', 0.8); 
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const FeedbackModal = ({ config, onClose }) => {
    if (!config) return null;
    const { type, title, message, onConfirm } = config;

    return (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-sm z-[100] flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-slide-up">
                <div className="p-6 text-center">
                    <div className={`mx-auto w-12 h-12 flex items-center justify-center rounded-full mb-4 ${type === 'confirm' ? 'bg-amber-500/10 text-amber-500' : 'bg-cyan-500/10 text-cyan-400'}`}>
                        {type === 'confirm' ? <AlertTriangle size={24} /> : <Info size={24} />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title || "Notice"}</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">{message}</p>
                </div>
                <div className="p-4 border-t border-neutral-800 bg-neutral-950/50 flex gap-3">
                    {type === 'confirm' && (
                        <button onClick={onClose} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">
                            Cancel
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }} 
                        className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white ${type === 'confirm' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'}`}
                    >
                        {type === 'confirm' ? 'Confirm' : 'Got it'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const InlineConfirmDelete = ({ onConfirm, iconSize = 18, containerClass = "p-2 text-neutral-600 hover:text-red-400 transition-colors rounded-lg shrink-0" }) => {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!isConfirming) {
    return (
      <button type="button" onClick={() => setIsConfirming(true)} className={containerClass} title="Delete">
        <Trash2 size={iconSize} />
      </button>
    );
  }

  return (
    <div className="flex items-stretch bg-red-500/10 border border-red-500/30 rounded-lg overflow-hidden shadow-inner h-10 animate-[pulse_0.2s_ease-in-out] shrink-0">
      <div className="flex items-center px-3">
         <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest whitespace-nowrap">Delete?</span>
      </div>
      <button type="button" onClick={onConfirm} className="px-4 bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors font-bold text-xs border-l border-red-500/30">
        YES
      </button>
      <button type="button" onClick={() => setIsConfirming(false)} className="px-4 bg-neutral-800 text-neutral-400 hover:text-white transition-colors font-bold text-xs border-l border-red-500/30">
        NO
      </button>
    </div>
  );
};

const ExerciseSelectorModal = ({ masterExercises, onClose, onSelect, onCustomCreated, user, supabaseClient, showAlert }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState('All');
    const [isCreatingCustom, setIsCreatingCustom] = useState(false);
    const [customMuscle, setCustomMuscle] = useState('Chest');
    const [isSavingCustom, setIsSavingCustom] = useState(false);

    const muscleGroups = ['All', 'Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'];

    const filteredExercises = masterExercises.filter(ex => {
        const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesMuscle = selectedMuscle === 'All' || ex.muscle_group === selectedMuscle;
        return matchesSearch && matchesMuscle;
    }).sort((a, b) => a.name.localeCompare(b.name));

    const handleCreateCustom = async () => {
        if (!searchTerm.trim()) return;
        setIsSavingCustom(true);
        try {
            const newEx = {
                name: searchTerm.trim(),
                muscle_group: customMuscle,
                is_custom: true,
                user_id: user.id
            };
            const { data, error } = await supabaseClient.from('exercises').insert([newEx]).select().single();
            
            if (error) throw error;
            
            onCustomCreated(data);
            onSelect(data.name);
        } catch (e) {
            console.error("Error creating custom exercise", e);
            showAlert("Failed to create custom exercise.", "Creation Error");
            setIsSavingCustom(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 flex flex-col p-4 animate-fade-in">
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-md mx-auto flex flex-col overflow-hidden shadow-2xl h-[85vh] mt-4 animate-slide-up">
                
                <div className="flex justify-between items-center p-4 border-b border-neutral-800 shrink-0">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Dumbbell className="text-cyan-500" size={20}/> Select Exercise
                    </h2>
                    <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><XIcon size={24}/></button>
                </div>

                {!isCreatingCustom ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        <div className="p-4 shrink-0 border-b border-neutral-800">
                            <div className="relative mb-4">
                                <input 
                                    type="text" 
                                    placeholder="Search e.g., 'barb'..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-700 text-white pl-10 pr-10 py-3 rounded-xl focus:border-cyan-500 outline-none transition-colors"
                                    autoFocus
                                />
                                <Search className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm('')} className="absolute right-3 top-3.5 text-neutral-500 hover:text-white transition-colors">
                                        <XIcon size={18} />
                                    </button>
                                )}
                            </div>
                            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {muscleGroups.map(muscle => (
                                    <button
                                        key={muscle}
                                        onClick={() => setSelectedMuscle(muscle)}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                            selectedMuscle === muscle 
                                            ? 'bg-cyan-600 text-white' 
                                            : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200 border border-neutral-700'
                                        }`}
                                    >
                                        {muscle}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="overflow-y-auto p-4 space-y-2 flex-grow">
                            {filteredExercises.map((exercise, index) => (
                                <button 
                                    key={index}
                                    onClick={() => onSelect(exercise.name)}
                                    className="w-full flex justify-between items-center p-3 rounded-lg bg-neutral-800/30 hover:bg-neutral-800 text-neutral-200 transition-colors border border-transparent hover:border-neutral-700 group text-left"
                                >
                                    <span className="font-medium group-hover:text-cyan-400 transition-colors">{exercise.name}</span>
                                    <span className="text-[10px] uppercase tracking-wider text-neutral-500 bg-neutral-950 px-2 py-1 rounded-md">
                                        {exercise.muscle_group}
                                    </span>
                                </button>
                            ))}
                            
                            {filteredExercises.length === 0 && (
                                <div className="text-neutral-500 text-center py-8 flex flex-col items-center">
                                    <span className="mb-2">No exercises found.</span>
                                </div>
                            )}
                        </div>

                        <div className="p-4 shrink-0 border-t border-neutral-800 bg-neutral-950/50">
                            <button 
                                onClick={() => setIsCreatingCustom(true)}
                                className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-cyan-700/50 text-cyan-400 rounded-xl hover:border-cyan-500 hover:bg-cyan-500/10 transition-all font-bold"
                            >
                                <Plus size={18} />
                                Create "{searchTerm || 'Custom Exercise'}"
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 flex flex-col h-full">
                        <h3 className="text-white font-bold text-lg mb-6">Create Custom Exercise</h3>
                        
                        <div className="space-y-6 flex-grow">
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Exercise Name</label>
                                <input 
                                    type="text" 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none"
                                    placeholder="E.g. Deficit KB Squat"
                                    autoFocus
                                />
                            </div>
                            
                            <div>
                                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Primary Muscle Group</label>
                                <div className="relative">
                                    <select 
                                        value={customMuscle} 
                                        onChange={(e) => setCustomMuscle(e.target.value)} 
                                        className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none appearance-none font-bold"
                                    >
                                        {muscleGroups.filter(m => m !== 'All').map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-3.5 text-neutral-500 pointer-events-none" size={18} />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 shrink-0 pt-4 border-t border-neutral-800">
                            <button 
                                onClick={() => setIsCreatingCustom(false)} 
                                className="px-4 py-3 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl transition-colors"
                            >
                                Back
                            </button>
                            <button 
                                onClick={handleCreateCustom} 
                                disabled={!searchTerm.trim() || isSavingCustom}
                                className="flex-grow bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
                            >
                                {isSavingCustom ? <RefreshCw size={18} className="animate-spin"/> : <Save size={18}/>}
                                Save to Library
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

function SupabaseAuth() {
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    const { error } = await supabaseClient.auth.signInWithOtp({ email });

    if (error) {
      setErrorMsg(error.message);
    } else {
      setStep(2);
    }
    setLoading(false);
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const { error } = await supabaseClient.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });

    if (error) {
      setErrorMsg(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="text-center space-y-4 mb-8 relative z-10">
            <LethalLogo size={80} className="mx-auto mb-4" />
            <h1 className="text-3xl font-extrabold tracking-tight text-white">Lethal Lifts</h1>
            <p className="text-neutral-400 text-sm leading-relaxed">
                {step === 1 ? "Enter your email to receive a secure login code." : `We sent a login code to ${email}`}
            </p>
        </div>
        
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleRequestCode} className="space-y-4 relative z-10">
              <div>
                  <div className="relative">
                    <input 
                        type="email" 
                        required
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        placeholder="lifter@example.com" 
                        className="w-full bg-neutral-950 border border-neutral-700 text-white pl-12 pr-4 py-4 rounded-xl focus:border-cyan-500 outline-none transition-colors" 
                    />
                    <Mail className="absolute left-4 top-4 text-neutral-500 pointer-events-none" size={20} />
                  </div>
              </div>
              <button 
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-cyan-500/20"
              >
                  {loading ? <RefreshCw size={20} className="animate-spin" /> : "Send Login Code"}
              </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="space-y-4 relative z-10">
              <div>
                  <div className="relative">
                    <input 
                        type="text" 
                        required
                        maxLength={8}
                        value={token} 
                        onChange={e => setToken(e.target.value.replace(/\D/g, ''))} 
                        placeholder="123456" 
                        autoComplete="one-time-code"
                        className="w-full bg-neutral-950 border border-neutral-700 text-white pl-12 pr-4 py-4 rounded-xl focus:border-cyan-500 outline-none transition-colors text-center font-mono tracking-[0.5em] text-2xl" 
                    />
                    <CheckCircle className="absolute left-4 top-5 text-neutral-500 pointer-events-none" size={20} />
                  </div>
              </div>
              <button 
                  type="submit"
                  disabled={loading || token.length < 6}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-colors shadow-lg shadow-emerald-500/20"
              >
                  {loading ? <RefreshCw size={20} className="animate-spin" /> : "Verify Code"}
              </button>
              <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-neutral-500 hover:text-white text-sm py-2 transition-colors"
              >
                  Change Email
              </button>
          </form>
        )}
      </div>
    </div>
  );
}

function LandingPage({ program, cachedSession, onClearCache, onLaunchSession, onLaunchSetup, onLaunchProgress, onLaunchWeightTracker, onLaunchExport, onLaunchEditHub, onLaunchEquipment, onLaunchGuide, onLaunchAbout, onSignOut, showConfirm, isPro, user, isOnline }) {
  const [showPaywall, setShowPaywall] = useState(false);
  
  const stripeMonthlyLink = "YOUR_LIVE_MONTHLY_LINK_HERE"; 
  const stripeAnnualLink = "YOUR_LIVE_ANNUAL_LINK_HERE"; 
  
  const handleStartNew = (dayId) => {
    if (cachedSession && cachedSession.dayId !== dayId) {
      showConfirm("Warning: You have an unsaved session in progress. Starting a new workout will permanently discard it. Continue?", "Unsaved Session", () => {
        onClearCache();
        onLaunchSession(dayId);
      });
    } else {
      onLaunchSession(dayId);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-12">
      <div className="max-w-3xl mx-auto space-y-8">
        
        {!isOnline && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg shadow-amber-500/5">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-500/20 p-2 rounded-full text-amber-500 shrink-0">
                        <WifiOff size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-amber-500 text-sm">Offline Mode Active</h3>
                        <p className="text-xs text-amber-500/80">You can safely log workouts. They will save to your device and sync when you reconnect.</p>
                    </div>
                </div>
            </div>
        )}

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex justify-between items-start gap-4">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-neutral-900/50 border border-neutral-800 text-[10px] font-bold tracking-widest text-cyan-500 mb-3 shadow-sm">
                 <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-cyan-500 animate-[pulse_2s_ease-in-out_infinite]' : 'bg-amber-500'}`}></div>
                 v0.4.3 beta
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                Lethal Lifts
              </h1>
              <p className="text-neutral-400 font-medium flex items-center gap-2 mt-2">
                {isOnline ? (
                    <><Activity size={16} className="text-cyan-500" /> Cloud Connected</>
                ) : (
                    <><WifiOff size={16} className="text-amber-500" /> Local Storage Only</>
                )}
              </p>
            </div>
            <div className="bg-cyan-950/40 p-2 rounded-full border border-cyan-500/30 shadow-[0_0_20px_rgba(34,211,238,0.15)] flex items-center justify-center backdrop-blur-sm shrink-0 mt-1">
              <LethalLogo size={72} />
            </div>
          </div>
        </div>

        {(!program || program.length === 0) ? (
            <div className="bg-neutral-900 border border-cyan-500/30 rounded-3xl p-6 md:p-8 shadow-2xl text-center relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">Welcome to Lethal Lifts</h2>
              <p className="text-neutral-400 text-sm leading-relaxed mb-8">Your cloud database is connected, but your training blueprint is empty. Build your mesocycle to unlock the dashboard.</p>
              
              <button onClick={onLaunchSetup} className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-cyan-600/25 active:scale-95 mb-4">
                <Plus size={20} /> Build Your First Mesocycle
              </button>

              <button onClick={() => handleStartNew('freestyle')} className="w-full flex items-center justify-center gap-2 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 hover:border-cyan-500/50 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 mb-4">
                <Activity size={20} className="text-cyan-500" /> Start a Freestyle Workout
              </button>

              <button onClick={onLaunchGuide} className="w-full flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">
                <BookOpen size={20} className="text-cyan-500" /> Read the Quick Start Guide
              </button>
            </div>
        ) : (
            <div>
              <div className="flex items-center gap-2 mb-4 px-2">
                <CalendarDays size={20} className="text-neutral-500" />
                <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase">Start Session</h2>
              </div>

              {cachedSession && (
                <div className="mb-6 bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-amber-500 font-bold text-sm tracking-widest uppercase flex items-center gap-2">
                      <TimerIcon size={16} /> Session in Progress
                    </h3>
                    <span className="text-xs font-bold text-neutral-400 bg-neutral-900 px-2 py-1 rounded-md border border-neutral-800">
                      {formatSafeDate(cachedSession.date)}
                    </span>
                  </div>
                  <p className="text-white font-bold text-xl mb-4">{cachedSession.dayTitle}</p>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => onLaunchSession(cachedSession.dayId)} 
                      className="flex-grow bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Play fill="currentColor" size={18}/> Resume
                    </button>
                    <InlineConfirmDelete 
                      onConfirm={onClearCache} 
                      iconSize={20}
                      containerClass="px-4 bg-neutral-900 border border-neutral-700 hover:border-red-500/50 hover:text-red-400 text-neutral-400 font-bold rounded-xl transition-colors shadow-sm h-full flex items-center justify-center"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {program.map((day, index) => (
                  <button key={day.id} onClick={() => handleStartNew(day.id)} className="group relative bg-neutral-900 border border-neutral-800 hover:border-cyan-500 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.15)] block overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                    <div className="flex justify-between items-center w-full mb-4">
                      <span className="text-xs font-bold text-cyan-500 uppercase tracking-widest bg-cyan-500/10 px-2 py-1 rounded">Day {index + 1}</span>
                      <ChevronRight size={20} className="text-neutral-600 group-hover:text-cyan-400 transition-colors transform group-hover:translate-x-1" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{day.title.split(': ')[1] || day.title}</h3>
                      <p className="text-sm text-neutral-500 font-medium">{day.exercises.length} Scheduled Exercises</p>
                    </div>
                  </button>
                ))}
              </div>
              <button onClick={() => handleStartNew('freestyle')} className="w-full flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 hover:bg-neutral-800 text-neutral-300 hover:text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95">
                <Activity size={20} className="text-cyan-500" /> Start a Freestyle Workout
              </button>
            </div>
        )}

        <div className="pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Activity size={20} className="text-neutral-500" />
            <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase">Metrics & Hubs</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button onClick={() => isPro ? onLaunchProgress() : setShowPaywall(true)} className="bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-purple-500"><BarChart2 size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Progress Hub</h3>
                  <p className="text-xs text-neutral-500">Volume visualization</p>
                </div>
              </div>
              {!isPro ? <span className="bg-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-1 rounded border border-purple-500/30 uppercase tracking-widest flex items-center gap-1"><Lock size={12}/> Pro</span> : <ChevronRight size={18} className="text-neutral-600 group-hover:text-purple-500" />}
            </button>

            <button onClick={() => isPro ? onLaunchWeightTracker() : setShowPaywall(true)} className="bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-cyan-500"><Scale size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Weight Tracker</h3>
                  <p className="text-xs text-neutral-500">Bodyweight trends</p>
                </div>
              </div>
              {!isPro ? <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded border border-cyan-500/30 uppercase tracking-widest flex items-center gap-1"><Lock size={12}/> Pro</span> : <ChevronRight size={18} className="text-neutral-600 group-hover:text-cyan-500" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Settings size={20} className="text-neutral-500" />
            <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase">Management</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <button onClick={onLaunchSetup} className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-emerald-500"><Settings size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Program Manager</h3>
                </div>
              </div>
            </button>

            <button onClick={onLaunchEquipment} className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-emerald-500"><Dumbbell size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Equipment Manager</h3>
                </div>
              </div>
            </button>

            <button onClick={onLaunchEditHub} className="bg-neutral-900 border border-neutral-800 hover:border-amber-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-amber-500"><Edit3 size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Edit Logs</h3>
                </div>
              </div>
            </button>

            <button onClick={onLaunchExport} className="bg-neutral-900 border border-neutral-800 hover:border-indigo-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-indigo-500"><Clipboard size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Export to Coach</h3>
                </div>
              </div>
            </button>

            <button onClick={onLaunchGuide} className="bg-neutral-900 border border-neutral-800 hover:border-cyan-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-cyan-500"><BookOpen size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Guide</h3>
                </div>
              </div>
            </button>

            <button onClick={onLaunchAbout} className="bg-neutral-900 border border-neutral-800 hover:border-neutral-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-neutral-400"><Info size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">About</h3>
                </div>
              </div>
            </button>

            <button onClick={onSignOut} className="bg-neutral-900 border border-neutral-800 hover:border-red-500/50 rounded-2xl p-4 flex items-center justify-between transition-colors group sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-3">
                <div className="bg-neutral-950 p-2 rounded-lg text-red-500"><LogOut size={20} /></div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-200">Sign Out</h3>
                </div>
              </div>
            </button>

          </div>
        </div>

        {showPaywall && (
          <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-slide-up">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 flex items-center justify-center rounded-full bg-neutral-950 border border-neutral-800 mb-4 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                        <Star size={32} className="text-purple-500" fill="currentColor"/>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2 tracking-tight">Upgrade to Pro</h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6">Unlock the Progress Hub analytics, Weight Tracker trends, and support independent development.</p>
                    
                    <div className="space-y-3">
                        <a 
                           href={`${stripeAnnualLink}?client_reference_id=${user.id}`} 
                           className="w-full flex flex-col justify-center items-center bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg active:scale-95"
                        >
                           <span>Annual Pro</span>
                           <span className="text-xs font-medium opacity-90">$39.99/year (Save 33%)</span>
                        </a>
                        <a 
                           href={`${stripeMonthlyLink}?client_reference_id=${user.id}`} 
                           className="w-full flex flex-col justify-center items-center bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold py-3 rounded-xl transition-all active:scale-95"
                        >
                           <span>Monthly Pro</span>
                           <span className="text-xs font-medium text-neutral-400">$4.99/month</span>
                        </a>
                    </div>

                    <button onClick={() => setShowPaywall(false)} className="w-full mt-4 py-3 text-neutral-500 hover:text-white font-semibold transition-colors">
                       Maybe Later
                    </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}

function EquipmentProfile({ onBack, unitPref, showConfirm }) {
  const defaultBars = unitPref === 'kg' 
    ? [{ id: "1", name: "Standard Barbell", weight: 20 }] 
    : [{ id: "1", name: "Standard Barbell", weight: 45 }];

  const defaultPlates = unitPref === 'kg'
    ? [{weight:25, count:2}, {weight:20, count:6}, {weight:15, count:2}, {weight:10, count:4}, {weight:5, count:4}, {weight:2.5, count:2}, {weight:1.25, count:2}]
    : [{weight:45, count:6}, {weight:35, count:2}, {weight:25, count:2}, {weight:10, count:4}, {weight:5, count:4}, {weight:2.5, count:2}];

  const [bars, setBars] = useState(() => {
      const saved = safeStorageGet('lethal_bars');
      return saved ? JSON.parse(saved) : defaultBars;
  });
  
  const [plates, setPlates] = useState(() => {
      const saved = safeStorageGet('lethal_plates');
      return saved ? JSON.parse(saved) : defaultPlates;
  });
  
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    safeStorageSet('lethal_bars', JSON.stringify(bars));
    safeStorageSet('lethal_plates', JSON.stringify(plates));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addBar = () => {
    setBars([...bars, { id: Date.now().toString(), name: 'New Bar', weight: 0, isSinglePeg: false }]);
  };
  
  const updateBar = (id, field, value) => {
    setBars(bars.map(b => b.id === id ? { ...b, [field]: value } : b));
  };
  
  const removeBar = (id) => {
    setBars(bars.filter(b => b.id !== id));
  };

  const updatePlateCount = (idx, delta) => {
    const newPlates = [...plates];
    const currentCount = parseInt(newPlates[idx].count) || 0;
    newPlates[idx].count = Math.max(0, currentCount + delta);
    setPlates(newPlates);
  };

  const handlePlateCountChange = (idx, valStr) => {
    const newPlates = [...plates];
    if (valStr === '') {
      newPlates[idx].count = ''; 
    } else {
      newPlates[idx].count = Math.max(0, parseInt(valStr, 10) || 0);
    }
    setPlates(newPlates);
  };

  const handlePlateCountBlur = (idx) => {
    const newPlates = [...plates];
    if (newPlates[idx].count === '') {
      newPlates[idx].count = 0;
      setPlates(newPlates);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
      <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
      
      <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-emerald-500 font-semibold text-sm tracking-widest uppercase mb-1">Gym Inventory</p>
            <h1 className="text-2xl font-bold text-white">Equipment Profile</h1>
          </div>
          <button onClick={handleSave} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${saved ? 'bg-emerald-600' : 'bg-emerald-600/20 text-emerald-500 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white'}`}>
             {saved ? <CheckCircle size={20} /> : <Save size={20} />} {saved ? 'Saved!' : 'Save Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Dumbbell size={20} className="text-emerald-500"/> Custom Bars</h2>
              <p className="text-sm text-neutral-400 mb-6">Inventory your barbells, trap bars, and EZ bars so the calculator knows exactly what base weight to start with.</p>
              
              <div className="space-y-4 mb-6">
                 {bars.map((bar) => (
                    <div key={bar.id} className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-3">
                       <div className="flex gap-2 sm:gap-3 items-center">
                           <input type="text" value={bar.name} onChange={(e) => updateBar(bar.id, 'name', e.target.value)} placeholder="Bar Name" className="flex-grow min-w-0 bg-transparent border-none outline-none text-white font-medium focus:text-emerald-400" />
                           <div className="flex items-center gap-1 sm:gap-2 bg-neutral-900 px-2 sm:px-3 py-2 rounded-lg border border-neutral-800 shrink-0">
                              <input type="number" value={bar.weight} onChange={(e) => updateBar(bar.id, 'weight', parseFloat(e.target.value) || 0)} className="w-10 sm:w-12 bg-transparent border-none outline-none text-white text-right font-mono" />
                              <span className="text-neutral-500 text-sm font-semibold">{unitPref}</span>
                           </div>
                           <button onClick={() => removeBar(bar.id)} className="text-neutral-600 hover:text-red-400 transition-colors p-2 shrink-0"><Trash2 size={18}/></button>
                       </div>
                       <div className="flex items-center justify-between border-t border-neutral-800 pt-3 mt-1">
                           <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Loading Style</span>
                           <div className="flex bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                               <button onClick={() => updateBar(bar.id, 'isSinglePeg', false)} className={"px-3 py-1.5 text-xs font-bold rounded-md transition-all " + (!bar.isSinglePeg ? 'bg-neutral-700 text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-300')}>Standard (Sides)</button>
                               <button onClick={() => updateBar(bar.id, 'isSinglePeg', true)} className={"px-3 py-1.5 text-xs font-bold rounded-md transition-all " + (bar.isSinglePeg ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-neutral-500 hover:text-neutral-300 border border-transparent')}>Machine (1 Peg)</button>
                           </div>
                       </div>
                    </div>
                 ))}
              </div>
              
              <button onClick={addBar} className="w-full flex justify-center items-center gap-2 border border-dashed border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500 py-3 rounded-xl transition-colors font-semibold text-sm">
                 <Plus size={16} /> Add New Bar
              </button>
           </div>

           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Settings size={20} className="text-emerald-500"/> Plate Inventory</h2>
              <p className="text-sm text-neutral-400 mb-6">Tell the app exactly how many of each plate you own so it doesn't suggest plates you don't have.</p>
              
              <div className="space-y-3">
                 {plates.map((plate, idx) => (
                    <div key={idx} className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 flex justify-between items-center shadow-sm">
                       <span className="font-bold text-white text-lg">{plate.weight} <span className="text-sm text-neutral-500 font-normal">{unitPref}</span></span>
                       <div className="flex items-center gap-4 bg-neutral-900 rounded-lg p-1 border border-neutral-800">
                          <button onClick={() => updatePlateCount(idx, -2)} className="bg-neutral-800 text-neutral-400 hover:text-white w-10 h-10 rounded-md flex items-center justify-center font-bold text-xl active:scale-95 transition-all">-</button>
                          <input 
                             type="number" 
                             min="0"
                             value={plate.count}
                             onChange={(e) => handlePlateCountChange(idx, e.target.value)}
                             onBlur={() => handlePlateCountBlur(idx)}
                             className="text-white font-mono w-10 text-center text-lg bg-transparent border-none outline-none focus:ring-0 m-0 p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                          />
                          <button onClick={() => updatePlateCount(idx, 2)} className="bg-neutral-800 text-neutral-400 hover:text-white w-10 h-10 rounded-md flex items-center justify-center font-bold text-xl active:scale-95 transition-all">+</button>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        <button onClick={() => {
            showConfirm(`Reset inventory to standard ${unitPref.toUpperCase()} defaults? This will erase custom bars and plates.`, "Reset Defaults", () => {
                setBars(defaultBars);
                setPlates(defaultPlates);
                safeStorageSet('lethal_bars', JSON.stringify(defaultBars));
                safeStorageSet('lethal_plates', JSON.stringify(defaultPlates));
            });
        }} className="w-full py-4 text-neutral-500 hover:text-red-400 font-semibold text-sm transition-colors flex items-center justify-center gap-2 mt-4">
           <RotateCcw size={16} /> Reset to {unitPref.toUpperCase()} Defaults
        </button>

      </div>
    </div>
  );
}

function ProgramSetup({ user, program, setProgram, blueprints, setBlueprints, onBack, unitPref, setUnitPref, masterExercises, setMasterExercises, supabaseClient, showAlert, showConfirm }) {
  const [view, setView] = useState('hub');
  const [localProgram, setLocalProgram] = useState([]);
  const [blueprintName, setBlueprintName] = useState("New Mesocycle");
  const [editBpId, setEditBpId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [selectingFor, setSelectingFor] = useState(null);

  const openEditor = (bp) => {
      if (bp) {
          setEditBpId(bp.id);
          setBlueprintName(bp.name || "My Mesocycle");
          setLocalProgram(bp.program_data || []);
      } else {
          setEditBpId(null);
          setBlueprintName("Phase " + (blueprints.length + 1));
          setLocalProgram([]);
      }
      setView('editor');
  };

  const handleTitleChange = (id, newTitle) => setLocalProgram(localProgram.map(d => d.id === id ? Object.assign({}, d, { title: newTitle }) : d));
  const handleExerciseUpdate = (dayId, exIdx, field, val) => setLocalProgram(localProgram.map(d => d.id === dayId ? Object.assign({}, d, { exercises: d.exercises.map((ex, i) => i === exIdx ? Object.assign({}, ex, { [field]: val }) : ex) }) : d));
  
  const addExercise = (dayId) => setLocalProgram(localProgram.map(d => d.id === dayId ? Object.assign({}, d, { exercises: [...d.exercises, { name: '', targetSets: 3, targetReps: '', isSuperset: false }] }) : d));
  const removeExercise = (dayId, exIdx) => setLocalProgram(localProgram.map(d => d.id === dayId ? Object.assign({}, d, { exercises: d.exercises.filter((_, i) => i !== exIdx) }) : d));

  const toggleDayTimer = (dayId) => setLocalProgram(localProgram.map(d => d.id === dayId ? Object.assign({}, d, { timerEnabled: d.timerEnabled === false ? true : false }) : d));
  const toggleDayTargetReps = (dayId) => setLocalProgram(localProgram.map(d => d.id === dayId ? Object.assign({}, d, { targetRepsEnabled: !d.targetRepsEnabled }) : d));

  const addDay = () => {
    const newId = `day_${Date.now()}`;
    const newDay = {
      id: newId,
      title: `Day ${localProgram.length + 1}: New Workout`,
      timerEnabled: true,
      targetRepsEnabled: false,
      exercises: [{ name: '', targetSets: 3, targetReps: '', isSuperset: false }]
    };
    setLocalProgram([...localProgram, newDay]);
  };

  const removeDay = (dayId) => {
    setLocalProgram(localProgram.filter(d => d.id !== dayId));
  };

  const moveDay = (index, direction) => {
    const newProgram = [...localProgram];
    if (direction === 'up' && index > 0) {
        [newProgram[index - 1], newProgram[index]] = [newProgram[index], newProgram[index - 1]];
    } else if (direction === 'down' && index < newProgram.length - 1) {
        [newProgram[index + 1], newProgram[index]] = [newProgram[index], newProgram[index + 1]];
    }
    setLocalProgram(newProgram);
  };

  const handleSaveToCloud = async () => {
     setIsSaving(true);
     try {
         const isEditingActive = editBpId && blueprints.find(b => b.id === editBpId && !b.is_archived);
         
         const makeActive = !!isEditingActive;

         if (makeActive) {
             await supabaseClient.from('blueprints').update({ is_archived: true }).eq('user_id', user.id);
         }

         const payload = {
             user_id: user.id,
             name: blueprintName,
             program_data: localProgram,
             is_archived: !makeActive
         };

         let savedBp;
         if (editBpId) {
             const { data, error } = await supabaseClient.from('blueprints').update(payload).eq('id', editBpId).select().single();
             if (error) throw error;
             savedBp = data;
         } else {
             const { data, error } = await supabaseClient.from('blueprints').insert([payload]).select().single();
             if (error) throw error;
             savedBp = data;
         }

         let updated = [...blueprints];
         if (makeActive) {
             updated = updated.map(b => Object.assign({}, b, { is_archived: true }));
         }
         if (editBpId) {
             updated = updated.map(b => b.id === editBpId ? savedBp : b);
         } else {
             updated.push(savedBp);
         }
         setBlueprints(updated);

         if (makeActive) {
             setProgram(localProgram);
             safeStorageRemove('lethal_workout_cache');
         }
         setView('hub');
     } catch (e) {
         console.error("Program Save Error:", e);
         showAlert(`Network Error: Could not reach the cloud. Details: ${e.message || 'Connection Failed'}`, "Sync Error");
     } finally {
         setIsSaving(false);
     }
  };

  if (view === 'hub') {
      const activeBp = blueprints.find(b => !b.is_archived);
      const archivedBps = blueprints.filter(b => b.is_archived);

      return (
          <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
              <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
              <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
                  <div className="flex justify-between items-center border-b border-neutral-800 pb-6">
                      <div>
                          <p className="text-emerald-500 font-semibold text-sm tracking-widest uppercase mb-1">Drafts & Archives</p>
                          <h1 className="text-3xl font-bold text-white">Program Manager</h1>
                      </div>
                  </div>
                  
                  <div>
                      <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase mb-4 flex items-center gap-2"><Activity size={20} className="text-emerald-500" /> Active Phase</h2>
                      {activeBp ? (
                          <div className="bg-neutral-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className="text-xl font-bold text-white mb-1">{activeBp.name}</h3>
                                      <p className="text-sm text-neutral-500 font-medium">{(activeBp.program_data && activeBp.program_data.length) ? activeBp.program_data.length : 0} Workout Days</p>
                                  </div>
                                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Active</span>
                              </div>
                              <div className="flex gap-3">
                                  <button onClick={() => openEditor(activeBp)} className="flex-grow bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                                      <Edit3 size={18}/> Edit Blueprint
                                  </button>
                              </div>
                          </div>
                      ) : (
                          <button onClick={() => openEditor(null)} className="w-full bg-neutral-900 border-2 border-dashed border-neutral-700 hover:border-emerald-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-neutral-500 hover:text-emerald-400 transition-all group shadow-lg">
                              <Plus size={40} className="mb-2 group-hover:scale-110 transition-transform" />
                              <span className="font-bold tracking-wide uppercase text-sm">Build New Program</span>
                          </button>
                      )}
                  </div>

                  {archivedBps.length > 0 && (
                      <div>
                          <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase mb-4 flex items-center gap-2"><BookOpen size={20} className="text-neutral-500" /> Library</h2>
                          <div className="space-y-4">
                              {archivedBps.map(bp => (
                                  <div key={bp.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                                      <div className="flex justify-between items-start mb-4">
                                          <div>
                                              <h3 className="text-lg font-bold text-white mb-1">{bp.name}</h3>
                                              <p className="text-xs text-neutral-500 font-medium">{(bp.program_data && bp.program_data.length) ? bp.program_data.length : 0} Workout Days</p>
                                          </div>
                                      </div>
                                      <div className="flex gap-3">
                                          <button onClick={() => openEditor(bp)} className="px-4 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700 text-sm">
                                              <Edit3 size={16}/> Edit
                                          </button>
                                          <button onClick={async () => {
                                              try {
                                                  await supabaseClient.from('blueprints').update({ is_archived: true }).eq('user_id', user.id);
                                                  await supabaseClient.from('blueprints').update({ is_archived: false }).eq('id', bp.id);
                                                  const updated = blueprints.map(b => Object.assign({}, b, { is_archived: b.id !== bp.id }));
                                                  setBlueprints(updated);
                                                  setProgram(bp.program_data);
                                                  safeStorageRemove('lethal_workout_cache');
                                              } catch(e) { showAlert("Error setting active: " + e.message, "Update Failed"); }
                                          }} className="flex-grow bg-neutral-800 text-neutral-300 hover:bg-emerald-600/20 hover:text-emerald-400 hover:border-emerald-500/30 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700 text-sm">
                                              <RefreshCw size={16}/> Set as Active
                                          </button>
                                          <InlineConfirmDelete onConfirm={async () => {
                                              try {
                                                  await supabaseClient.from('blueprints').delete().eq('id', bp.id);
                                                  setBlueprints(blueprints.filter(b => b.id !== bp.id));
                                              } catch(e) { showAlert("Network Error: Could not delete blueprint.", "Delete Error"); }
                                          }} iconSize={20} containerClass="px-4 bg-neutral-800 border border-neutral-700 hover:border-red-500/50 hover:text-red-400 text-neutral-400 font-bold rounded-lg transition-colors flex items-center justify-center" />
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}
                  {activeBp && (
                      <button onClick={() => openEditor(null)} className="w-full flex items-center justify-center gap-2 py-4 text-neutral-400 hover:text-white border border-dashed border-neutral-700 hover:border-neutral-500 rounded-xl transition-colors font-bold mt-4">
                          <Plus size={20} /> Create Draft Program
                      </button>
                  )}
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-12 relative">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => setView('hub')} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Library</button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-neutral-800 pb-6 gap-4 mt-12 md:mt-0">
          <div className="w-full md:w-1/2">
             <p className="text-emerald-500 font-semibold text-sm tracking-widest uppercase mb-1">Phase Editor</p>
             <div className="flex items-center gap-3">
                 <input type="text" value={blueprintName} onChange={(e) => setBlueprintName(e.target.value)} className="bg-transparent border-none outline-none text-3xl font-bold text-white w-full focus:ring-0 placeholder-neutral-700" placeholder="Phase Name" />
             </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
            <div className="flex bg-neutral-900 border border-neutral-700 rounded-lg p-1">
              <button onClick={() => setUnitPref('lbs')} className={"px-4 py-2 rounded-md text-sm font-bold transition-colors " + (unitPref === 'lbs' ? 'bg-cyan-600 text-white shadow-md' : 'text-neutral-400 hover:text-white')}>LBS</button>
              <button onClick={() => setUnitPref('kg')} className={"px-4 py-2 rounded-md text-sm font-bold transition-colors " + (unitPref === 'kg' ? 'bg-cyan-600 text-white shadow-md' : 'text-neutral-400 hover:text-white')}>KG</button>
            </div>
            {(() => {
              const isEditingActive = editBpId && blueprints.find(b => b.id === editBpId && !b.is_archived);
              const saveButtonText = isEditingActive ? 'Save Changes' : 'Save as Draft';
              
              return (
                <button onClick={handleSaveToCloud} disabled={isSaving} className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all bg-cyan-600 hover:bg-cyan-500 text-white">
                  {isSaving ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} 
                  {isSaving ? 'Saving...' : saveButtonText}
                </button>
              );
            })()}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {localProgram.map((day, dayIndex) => (
            <div key={day.id} className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-6 bg-neutral-950 p-2 rounded-lg border border-neutral-800 flex-wrap sm:flex-nowrap">
                <Edit3 size={18} className="text-neutral-500 ml-2 shrink-0" />
                <input type="text" value={day.title} onChange={(e) => handleTitleChange(day.id, e.target.value)} className="bg-transparent border-none outline-none text-lg font-bold text-white w-full min-w-[100px]" />
                
                <div className="flex items-center gap-2 ml-auto shrink-0">
                    <button onClick={() => toggleDayTargetReps(day.id)} className={"px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors border " + (day.targetRepsEnabled ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-neutral-900 text-neutral-600 border-neutral-800 hover:text-neutral-400')} title="Toggle Rep Targets">
                       <Activity size={14} />
                       <span className="hidden lg:inline">{day.targetRepsEnabled ? 'Reps: On' : 'Reps: Off'}</span>
                    </button>

                    <button onClick={() => toggleDayTimer(day.id)} className={"px-3 py-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-colors border " + (day.timerEnabled !== false ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : 'bg-neutral-900 text-neutral-600 border-neutral-800 hover:text-neutral-400')} title="Toggle Default Timer">
                       <TimerIcon size={14} />
                       <span className="hidden lg:inline">{day.timerEnabled !== false ? 'Timer: On' : 'Timer: Off'}</span>
                    </button>
                    
                    <div className="flex items-center gap-0.5 bg-neutral-900 rounded-md border border-neutral-800">
                       <button onClick={() => moveDay(dayIndex, 'up')} disabled={dayIndex === 0} className={`p-1.5 transition-colors ${dayIndex === 0 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-400 hover:text-white'}`} title="Move Day Up"><ChevronUp size={16}/></button>
                       <div className="w-px h-4 bg-neutral-800"></div>
                       <button onClick={() => moveDay(dayIndex, 'down')} disabled={dayIndex === localProgram.length - 1} className={`p-1.5 transition-colors ${dayIndex === localProgram.length - 1 ? 'text-neutral-800 cursor-not-allowed' : 'text-neutral-400 hover:text-white'}`} title="Move Day Down"><ChevronDown size={16}/></button>
                    </div>

                    <InlineConfirmDelete onConfirm={() => removeDay(day.id)} />
                </div>
              </div>
              <div className="flex flex-col gap-3">
                {day.exercises.map((ex, idx) => {
                   const isSuperset = ex.isSuperset && idx > 0;
                   return (
                      <div key={idx} className={"flex items-center gap-2 relative transition-all " + (isSuperset ? '-mt-1' : '')}>
                        {isSuperset && <div className="absolute -top-4 left-6 w-0.5 h-6 bg-cyan-500 z-0"></div>}
                        <div className={"flex-grow flex flex-col md:flex-row border border-neutral-700 rounded-md overflow-hidden relative z-10 transition-colors " + (isSuperset ? 'bg-neutral-800 border-cyan-500/50 shadow-[0_0_15px_rgba(34,211,238,0.1)]' : 'bg-neutral-800/50')}>
                           
                           <div className="flex flex-grow items-stretch border-b md:border-b-0 md:border-r border-neutral-700 w-full md:w-auto">
                               <div className="bg-neutral-800 px-3 flex items-center justify-center text-neutral-400 text-sm font-mono border-r border-neutral-700 shrink-0 min-w-[40px]">
                                   {idx + 1}
                               </div>
                               <button type="button" onClick={() => setSelectingFor({ dayId: day.id, exIdx: idx })} className="w-full bg-transparent border-none outline-none px-3 py-3 text-sm text-left transition-colors whitespace-normal break-words leading-snug">
                                   <span className={ex.name ? "text-white" : "text-neutral-500"}>{ex.name || "Select Exercise..."}</span>
                               </button>
                           </div>

                           <div className="flex items-center divide-x divide-neutral-700 bg-neutral-800/50 md:bg-transparent shrink-0 w-full md:w-auto">
                               <div className="flex items-center px-4 py-2.5 flex-1 justify-between md:justify-center">
                                  <span className="text-xs text-neutral-400 mr-3 font-semibold">SETS</span>
                                  <input 
                                     type="text" 
                                     inputMode="numeric" 
                                     pattern="[0-9]*"
                                     value={ex.targetSets} 
                                     onChange={(e) => {
                                         let val = e.target.value.replace(/\D/g, ''); 
                                         if (val) val = parseInt(val, 10).toString(); 
                                         handleExerciseUpdate(day.id, idx, 'targetSets', val);
                                     }}
                                     onBlur={(e) => {
                                         if (!e.target.value || parseInt(e.target.value, 10) < 1) {
                                            handleExerciseUpdate(day.id, idx, 'targetSets', '1');
                                         }
                                     }}
                                     className="w-12 bg-neutral-950 border border-neutral-700 rounded px-1 py-1 text-center text-sm text-white outline-none" 
                                  />
                               </div>
                               {day.targetRepsEnabled && (
                                  <div className="flex items-center px-4 py-2.5 flex-1 justify-between md:justify-center">
                                     <span className="text-xs text-neutral-400 mr-3 font-semibold">REPS</span>
                                     <input type="text" value={ex.targetReps || ''} onChange={(e) => handleExerciseUpdate(day.id, idx, 'targetReps', e.target.value)} placeholder="e.g. 8-12" className="w-20 bg-neutral-950 border border-neutral-700 rounded px-2 py-1 text-center text-sm text-white outline-none placeholder-neutral-600" />
                                  </div>
                               )}
                           </div>

                        </div>
                        {idx > 0 && (
                           <button onClick={() => handleExerciseUpdate(day.id, idx, 'isSuperset', !ex.isSuperset)} className={"p-2 transition-colors shrink-0 " + (ex.isSuperset ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-neutral-600 hover:text-cyan-400')} title="Link as Superset">
                              {ex.isSuperset ? <LinkIcon size={18}/> : <Unlink size={18}/>}
                           </button>
                        )}
                        <button onClick={() => removeExercise(day.id, idx)} className="p-2 text-neutral-600 hover:text-red-400 transition-colors shrink-0"><Trash2 size={18}/></button>
                      </div>
                   );
                })}
              </div>
              <button onClick={() => addExercise(day.id)} className="mt-4 flex items-center justify-center gap-2 text-sm text-neutral-400 hover:text-white py-2 w-full border border-dashed border-neutral-700 rounded-md hover:border-neutral-500 transition-colors"><Plus size={16} /> Add Exercise</button>
            </div>
          ))}
          
          <button onClick={addDay} className="bg-neutral-900/50 border-2 border-dashed border-neutral-700 hover:border-cyan-500 rounded-xl p-5 shadow-lg flex flex-col items-center justify-center text-neutral-500 hover:text-cyan-400 transition-all min-h-[200px] group">
              <Plus size={40} className="mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold tracking-wide uppercase text-sm">Add Workout Day</span>
          </button>
        </div>
      </div>

      {selectingFor !== null && (
          <ExerciseSelectorModal
              masterExercises={masterExercises}
              user={user}
              supabaseClient={supabaseClient}
              showAlert={showAlert}
              onClose={() => setSelectingFor(null)}
              onCustomCreated={(newEx) => setMasterExercises([...masterExercises, newEx])}
              onSelect={(exName) => {
                  handleExerciseUpdate(selectingFor.dayId, selectingFor.exIdx, 'name', exName);
                  setSelectingFor(null);
              }}
          />
      )}

    </div>
  );
}

function PlateMathModal({ onClose, unitPref }) {
  const defaultBars = unitPref === 'kg' ? [{ id: "1", name: "Standard Barbell", weight: 20 }] : [{ id: "1", name: "Standard Barbell", weight: 45 }];
  const defaultPlates = unitPref === 'kg' ? [{weight:25, count:2}, {weight:20, count:6}, {weight:15, count:2}, {weight:10, count:4}, {weight:5, count:4}, {weight:2.5, count:2}, {weight:1.25, count:2}] : [{weight:45, count:6}, {weight:35, count:2}, {weight:25, count:2}, {weight:10, count:4}, {weight:5, count:4}, {weight:2.5, count:2}];

  const bars = React.useMemo(() => { const s = safeStorageGet('lethal_bars'); return s ? JSON.parse(s) : defaultBars; }, [unitPref]);
  const plates = React.useMemo(() => { const s = safeStorageGet('lethal_plates'); return s ? JSON.parse(s) : defaultPlates; }, [unitPref]);

  const [targetWeight, setTargetWeight] = useState(unitPref === 'kg' ? 60 : 135);
  const [selectedBarId, setSelectedBarId] = useState(bars.length > 0 ? bars[0].id : "");

  const bar = bars.find(b => b.id === selectedBarId) || bars[0];
  const barWeight = bar ? (parseFloat(bar.weight) || 0) : 0;
  const isSinglePeg = bar ? !!bar.isSinglePeg : false;

  let targetToLoad = targetWeight - barWeight;
  if (!isSinglePeg) {
      targetToLoad = targetToLoad / 2;
  }
  targetToLoad = Math.round(targetToLoad * 100) / 100;
  
  const loadedPlates = [];
  let isExact = true;
  let calculatedWeight = barWeight;

  if (targetToLoad > 0) {
      const sortedPlates = [...plates].sort((a, b) => b.weight - a.weight);
      let remaining = targetToLoad;
      for (const p of sortedPlates) {
          let maxAvailable = isSinglePeg ? p.count : Math.floor(p.count / 2);
          let used = 0;
          while (remaining >= p.weight && maxAvailable > 0) {
              remaining = Math.round((remaining - p.weight) * 100) / 100;
              maxAvailable--;
              used++;
              calculatedWeight += (isSinglePeg ? p.weight : p.weight * 2);
          }
          if (used > 0) {
              for(let i=0; i<used; i++) loadedPlates.push(p.weight);
          }
      }
      if (remaining > 0) isExact = false;
  } else if (targetToLoad < 0) {
      isExact = false;
  }

  const getPlateStyle = (w) => {
      if (w >= 45 || w >= 20) return "h-20 w-4 bg-gradient-to-r from-cyan-400 to-cyan-600";
      if (w >= 35 || w >= 15) return "h-16 w-4 bg-gradient-to-r from-indigo-400 to-indigo-600";
      if (w >= 25 || w >= 10) return "h-12 w-3 bg-gradient-to-r from-purple-400 to-purple-600";
      if (w >= 10 || w >= 5) return "h-8 w-3 bg-gradient-to-r from-emerald-400 to-emerald-600";
      return "h-6 w-2 bg-gradient-to-r from-neutral-300 to-neutral-500";
  };

  return (
    <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-slide-up">
        <div className="flex justify-between items-center p-5 border-b border-neutral-800">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><CalculatorIcon className="text-cyan-500" size={20}/> Plate Math</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white p-1"><XIcon size={20}/></button>
        </div>
        
        <div className="p-6 space-y-6">
          
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block text-center">Target Weight</label>
            <div className="flex items-center justify-center gap-4">
              <button onClick={()=>setTargetWeight(w => Math.max(0, w-5))} className="w-12 h-12 bg-neutral-800 text-neutral-300 hover:text-white rounded-full font-bold active:scale-95 transition-transform">-5</button>
              <div className="flex flex-col items-center bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-xl shadow-inner">
                <input 
                   type="text" 
                   inputMode="decimal"
                   value={targetWeight === 0 ? '' : targetWeight} 
                   onChange={(e)=>{
                       const v = e.target.value.replace(/[^0-9.]/g, ''); 
                       setTargetWeight(v ? parseFloat(v) : 0);
                   }} 
                   className="bg-transparent text-4xl font-bold text-white w-24 text-center outline-none m-0" 
                />
                <span className="text-neutral-500 font-bold text-xs uppercase">{unitPref}</span>
              </div>
              <button onClick={()=>setTargetWeight(w => w+5)} className="w-12 h-12 bg-neutral-800 text-neutral-300 hover:text-white rounded-full font-bold active:scale-95 transition-transform">+5</button>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Select Bar</label>
            <div className="relative">
                <select value={selectedBarId} onChange={(e) => setSelectedBarId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none font-bold appearance-none">
                  {bars.map(b => <option key={b.id} value={b.id}>{b.name} ({b.weight} {unitPref}){b.isSinglePeg ? ' [Machine]' : ''}</option>)}
                </select>
                <ChevronDown className="absolute right-4 top-3.5 text-neutral-500 pointer-events-none" size={18} />
            </div>
          </div>

          <div className="relative h-32 bg-neutral-950 rounded-xl border border-neutral-800 flex flex-col items-center justify-center p-4 overflow-hidden shadow-inner">
              <div className="flex items-center w-full justify-center">
                  <div className="w-10 h-3 bg-gradient-to-r from-neutral-800 to-neutral-500 rounded-l-sm border-y border-l border-neutral-700"></div>
                  <div className="w-2 h-8 bg-neutral-400 rounded-sm border border-neutral-600 z-10 shadow-md"></div>
                  <div className="flex items-center gap-0.5 z-20">
                      {loadedPlates.length === 0 && <div className="w-24 h-2 bg-gradient-to-r from-neutral-500 to-neutral-600 rounded-r-full border-y border-r border-neutral-700 -ml-1"></div>}
                      {loadedPlates.length > 0 && loadedPlates.map((pw, i) => (
                          <div key={i} className={`${getPlateStyle(pw)} border border-black/80 rounded-sm shadow-xl`}></div>
                      ))}
                      {loadedPlates.length > 0 && <div className="w-8 h-2 bg-gradient-to-r from-neutral-500 to-neutral-600 rounded-r-full border-y border-r border-neutral-700 -ml-1 -z-10"></div>}
                  </div>
              </div>
              <div className="flex gap-2 mt-4 text-xs font-mono text-neutral-400">
                  {loadedPlates.length > 0 ? `${isSinglePeg ? 'Loaded' : 'Per Side'}: ${loadedPlates.join(' + ')}` : (isSinglePeg ? 'Empty Peg' : 'Empty Bar')}
              </div>
          </div>

          {!isExact && targetWeight > 0 && (
             <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs text-center p-3 rounded-xl font-medium">
               Limited inventory! Closest achievable weight is <strong>{calculatedWeight} {unitPref}</strong>.
             </div>
          )}
          
        </div>
        
        <div className="p-4 border-t border-neutral-800 bg-neutral-950/50">
           <button onClick={onClose} className="w-full bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}

function TrackingApp({ user, blueprintDay, globalHistory, editSessionId, onBack, unitPref, onWorkoutLogged, masterExercises, setMasterExercises, supabaseClient, showAlert, showConfirm, isOnline }) {
  const [mode, setMode] = useState('setup');
  const [showPlateMath, setShowPlateMath] = useState(false);
  const [showTimer, setShowTimer] = useState(() => blueprintDay && blueprintDay.timerEnabled !== false);
  const [selectingFor, setSelectingFor] = useState(null); 
  const [setupMinutes, setSetupMinutes] = useState(0);
  const [setupSeconds, setSetupSeconds] = useState(5);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const [date, setDate] = useState(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [workoutData, setWorkoutData] = useState([]);
  const [dayTitle, setDayTitle] = useState(blueprintDay ? blueprintDay.title : '');
  
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [quickSaveState, setQuickSaveState] = useState("Quick Save");
  const [historyCache, setHistoryCache] = useState({});
  const [prevDuration, setPrevDuration] = useState('');

  const isLogged = useRef(false);

  useEffect(() => {
    let animationFrameId;
    let lastTime;

    const tick = () => {
      const now = Date.now();
      if (!lastTime) lastTime = now;
      const delta = now - lastTime;
      lastTime = now;

      if (mode === 'countdown') {
        setTimeLeft((prev) => {
          const newTime = prev - delta;
          if (newTime <= 0) {
            setMode('countup');
            return 0;
          }
          return newTime;
        });
        animationFrameId = requestAnimationFrame(tick);
      } else if (mode === 'countup') {
        setTimeElapsed((prev) => prev + delta);
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isActive) {
      lastTime = Date.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [isActive, mode]);

  const formatCountdownTime = (totalMs) => {
    const totalSeconds = Math.ceil(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatCountupTime = (totalMs) => {
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((totalMs % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  };

  const handleMinuteChange = (e) => {
    let valStr = e.target.value.replace(/\D/g, ''); 
    if (valStr === '') { setSetupMinutes(''); return; }
    setSetupMinutes(Math.min(99, parseInt(valStr, 10)));
  };

  const handleSecondChange = (e) => {
    let valStr = e.target.value.replace(/\D/g, ''); 
    if (valStr === '') { setSetupSeconds(''); return; }
    setSetupSeconds(Math.min(59, parseInt(valStr, 10)));
  };

  const handleTimerStart = () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    
    if (mode === 'setup') {
      const totalSetupTimeMs = (((parseInt(setupMinutes) || 0) * 60) + (parseInt(setupSeconds) || 0)) * 1000;
      if (totalSetupTimeMs > 0) {
        setTimeLeft(totalSetupTimeMs);
        setMode('countdown');
      } else {
        setMode('countup');
      }
    }
    setIsActive(true);
  };

  const handleTimerPause = () => {
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      setIsActive(false);
  };

  const handleTimerReset = () => {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    setIsActive(false);
    setMode('setup');
    setTimeLeft(0);
    setTimeElapsed(0);
  };

  const exerciseNamesStr = workoutData.map(e => e.name).join('|||');
  useEffect(() => {
    if (!blueprintDay) return;
    
    const dayHistory = globalHistory.filter(row => row['Day Title'] === blueprintDay.title);
    if (dayHistory.length > 0) {
      dayHistory.sort((a,b) => getSafeTime(b.Date) - getSafeTime(a.Date));
      setPrevDuration(dayHistory[0]['Duration (mins)'] || '');
    } else {
      setPrevDuration('');
    }

    const newCache = {};
    const exercisesToMap = workoutData.length > 0 ? workoutData.map(e => e.name) : blueprintDay.exercises.map(e => e.name);
    
    exercisesToMap.forEach(exName => {
      if (!exName) return;
      let exHistory = globalHistory.filter(row => row['Exercise Name'] === exName && row['Day Title'] === blueprintDay.title);
      if (exHistory.length === 0) {
        exHistory = globalHistory.filter(row => row['Exercise Name'] === exName);
      }
      if (exHistory.length > 0) {
        exHistory.sort((a,b) => getSafeTime(b.Date) - getSafeTime(a.Date));
        const lastDate = exHistory[0].Date;
        const lastSessionSets = exHistory.filter(row => row.Date === lastDate);
        lastSessionSets.sort((a,b) => a['Set Num'] - b['Set Num']);
        newCache[exName] = lastSessionSets.map(s => ({ weight: s['Weight (lbs)'], reps: s['Reps'], isDropSet: s['Is Drop Set'] }));
      } else {
        newCache[exName] = [];
      }
    });
    setHistoryCache(newCache);
  }, [blueprintDay, globalHistory, editSessionId, exerciseNamesStr, workoutData.length]);

  const dayIdentifier = blueprintDay ? blueprintDay.id : null;
  useEffect(() => {
    if (!blueprintDay) return;

    if (editSessionId) {
      const rows = globalHistory.filter(r => r.Timestamp === editSessionId);
      if (rows.length > 0) {
         setDate(rows[0].Date);
         setNotes(rows[0].Notes || '');
         setDuration(rows[0]['Duration (mins)'] || '');
         
         const exMap = {};
         const exOrder = [];
         rows.forEach(r => {
            if (!exMap[r['Exercise Name']]) {
                exMap[r['Exercise Name']] = { isSuperset: r['Is Superset'] === true, sets: [] };
                exOrder.push(r['Exercise Name']);
            }
            exMap[r['Exercise Name']].sets.push({
               id: parseInt(r['Set Num']),
               weight: r['Weight (lbs)'],
               reps: r['Reps'],
               isDropSet: r['Is Drop Set'] === true
            });
         });
         
         const loadedData = exOrder.map(exName => ({
            name: exName,
            targetSets: exMap[exName].sets.length,
            isSuperset: exMap[exName].isSuperset,
            sets: exMap[exName].sets.sort((a,b) => a.id - b.id)
         }));
         
         setWorkoutData(loadedData);
         return;
      }
    }
    
    const cachedStr = safeStorageGet('lethal_workout_cache');
    if (cachedStr) {
      try {
        const cached = JSON.parse(cachedStr);
        if (cached.dayId === blueprintDay.id) {
          setDate(cached.date);
          setNotes(cached.notes || '');
          setDuration(cached.duration || '');
          setDayTitle(cached.dayTitle || blueprintDay.title);
          setWorkoutData(cached.workoutData);
          return; 
        }
      } catch(e) {}
    }

    const initializedData = blueprintDay.exercises.map(ex => {
      const sets = Array.from({ length: ex.targetSets }).map((_, idx) => ({ id: idx + 1, weight: '', reps: '', isDropSet: false }));
      return Object.assign({}, ex, { sets });
    });
    setWorkoutData(initializedData);
    setDate(new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0]);
    setDayTitle(blueprintDay.title);
    setNotes('');
    setDuration('');
  }, [dayIdentifier, editSessionId]);

  useEffect(() => {
    if (isLogged.current) return;
    if (workoutData.length > 0 && blueprintDay && !editSessionId) {
      safeStorageSet('lethal_workout_cache', JSON.stringify({
        dayId: blueprintDay.id,
        dayTitle: dayTitle,
        date,
        duration,
        notes,
        workoutData
      }));
    }
  }, [workoutData, date, duration, notes, dayTitle, blueprintDay, editSessionId]);

  const forceQuickSave = () => {
    if (editSessionId || isLogged.current) return; 
    safeStorageSet('lethal_workout_cache', JSON.stringify({
        dayId: blueprintDay ? blueprintDay.id : '',
        dayTitle: dayTitle,
        date,
        duration,
        notes,
        workoutData
    }));
    setQuickSaveState("Saved!");
    setTimeout(() => setQuickSaveState("Quick Save"), 2000);
  };

  const handleExerciseNameChange = (exIdx, newName) => {
    const newData = [...workoutData];
    newData[exIdx].name = newName;
    setWorkoutData(newData);
  };

  const handleSetChange = (exIdx, setId, field, val) => {
    const newData = [...workoutData];
    const sIdx = newData[exIdx].sets.findIndex(s => s.id === setId);
    if (sIdx > -1) newData[exIdx].sets[sIdx][field] = val;
    setWorkoutData(newData);
  };
  
  const toggleDropSet = (exIdx, setId) => {
    const newData = [...workoutData];
    const sIdx = newData[exIdx].sets.findIndex(s => s.id === setId);
    if (sIdx > -1) newData[exIdx].sets[sIdx].isDropSet = !newData[exIdx].sets[sIdx].isDropSet;
    setWorkoutData(newData);
  };

  const toggleTrackerSuperset = (exIdx) => {
    if (exIdx === 0) return;
    const newData = [...workoutData];
    newData[exIdx].isSuperset = !newData[exIdx].isSuperset;
    setWorkoutData(newData);
  };
  
  const addExtraSet = (exIdx) => {
    const newData = [...workoutData];
    const nextId = newData[exIdx].sets.length > 0 ? Math.max(...newData[exIdx].sets.map(s => s.id)) + 1 : 1;
    newData[exIdx].sets.push({ id: nextId, weight: '', reps: '', isDropSet: false });
    setWorkoutData(newData);
  };
  
  const removeSet = (exIdx, setId) => {
    const newData = [...workoutData];
    newData[exIdx].sets = newData[exIdx].sets.filter(s => s.id !== setId);
    setWorkoutData(newData);
  };

  const addAdHocExercise = () => {
    setWorkoutData([...workoutData, { name: '', targetSets: 1, targetReps: '', isSuperset: false, sets: [{ id: 1, weight: '', reps: '', isDropSet: false }] }]);
  };

  const removeExerciseBlock = (exIdx) => {
    const newData = [...workoutData];
    newData.splice(exIdx, 1);
    setWorkoutData(newData);
  };

  const clearSessionData = () => {
    showConfirm("Are you sure you want to clear all data for this session?", "Reset Session", () => {
      safeStorageRemove('lethal_workout_cache');
      if (blueprintDay && !editSessionId) {
        const freshData = blueprintDay.exercises.map(ex => {
          const sets = Array.from({ length: ex.targetSets }).map((_, idx) => ({ id: idx + 1, weight: '', reps: '', isDropSet: false }));
          return Object.assign({}, ex, { sets });
        });
        setWorkoutData(freshData);
      }
      setNotes('');
      setDuration('');
    });
  };

  const saveSessionToCloud = async () => {
    if (isSaving || saved || isLogged.current) return;
    setIsSaving(true);
    
    const sessionTs = editSessionId || new Date().toISOString();
    
    const recordsToInsert = [];
    workoutData.forEach((ex, exIndex) => {
       ex.sets.forEach(set => {
          recordsToInsert.push({
             user_id: user.id,
             session_timestamp: sessionTs,
             date: date,
             day_title: dayTitle,
             duration_mins: duration || null,
             notes: notes || null,
             exercise_name: ex.name,
             exercise_order: exIndex,
             set_num: set.id,
             weight_lbs: set.weight || null,
             reps: set.reps || null,
             is_drop_set: set.isDropSet,
             is_superset: ex.isSuperset
          });
       });
    });

    try {
      if (!isOnline) {
          throw new Error("Offline Mode Active");
      }

      if (editSessionId) {
        await supabaseClient.from('workout_logs').delete().eq('session_timestamp', editSessionId);
      }

      if (recordsToInsert.length > 0) {
         const { error: insertError } = await supabaseClient.from('workout_logs').insert(recordsToInsert);
         if (insertError) throw insertError;
      }

      completeSaveProcess();
    } catch (e) {
      console.warn("Falling back to local queue:", e.message);
      
      const offlineQueueStr = safeStorageGet('lethal_offline_queue', '[]');
      const offlineQueue = JSON.parse(offlineQueueStr);
      
      offlineQueue.push({
          id: sessionTs,
          isEdit: !!editSessionId,
          records: recordsToInsert
      });
      
      safeStorageSet('lethal_offline_queue', JSON.stringify(offlineQueue));
      
      showAlert("You are currently offline. Your workout has been saved locally and will automatically sync when you reconnect.", "Saved Offline");
      completeSaveProcess();
    }
  };

  const completeSaveProcess = () => {
      setSaved(true);
      isLogged.current = true;
      if (!editSessionId) safeStorageRemove('lethal_workout_cache');
      if (onWorkoutLogged) onWorkoutLogged();
      setTimeout(() => { setSaved(false); setIsSaving(false); onBack(); }, 1500); 
  };

  if (!blueprintDay) return null;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-3 md:p-6 font-sans pb-32">

      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md pt-4 pb-3 -mt-4 px-1 rounded-b-xl border-b border-neutral-800/80 shadow-sm flex justify-between items-center transition-all">
          <button onClick={onBack} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit font-semibold">
            <ArrowLeft size={20} /> <span className="hidden sm:inline">{editSessionId ? 'Cancel Edit' : 'Cancel Session'}</span><span className="sm:hidden">Back</span>
          </button>
          <div className="flex items-center gap-2">
              {!editSessionId && (
                  <button onClick={() => setShowTimer(!showTimer)} className={"text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border flex items-center gap-1.5 shadow-sm " + (showTimer ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white')}>
                    <TimerIcon size={14} /> Timer
                  </button>
              )}
              <button onClick={() => setShowPlateMath(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border bg-cyan-900/30 border-cyan-800/50 text-cyan-400 hover:bg-cyan-800/50 hover:text-white flex items-center gap-1.5 shadow-sm">
                <CalculatorIcon size={14} /> <span className="hidden sm:inline">Plate Math</span>
              </button>
              {!editSessionId && (
                  <button onClick={forceQuickSave} className={"text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border " + (quickSaveState === "Saved!" ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300 hover:text-white')}>
                    {quickSaveState === "Saved!" ? "✓ Saved" : "Save"}
                  </button>
              )}
              <button onClick={clearSessionData} className="text-xs text-red-500 hover:text-red-400 font-semibold px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 transition-colors" title="Reset Session Data">
                <RotateCcw size={14} />
              </button>
          </div>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="w-full md:w-auto flex-grow pr-4">
            <p className={`${editSessionId ? 'text-amber-500' : 'text-cyan-500'} font-semibold text-sm tracking-widest uppercase mb-1`}>{editSessionId ? 'Editing Past Session' : 'Session Tracker'}</p>
            <input 
                type="text" 
                value={dayTitle} 
                onChange={(e) => setDayTitle(e.target.value)} 
                className="bg-transparent border-none outline-none text-2xl font-bold text-white w-full focus:ring-0 p-0 m-0 truncate hover:text-cyan-400 transition-colors" 
            />
          </div>
          <div className="relative w-full md:w-auto shrink-0"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full md:w-auto bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl font-medium focus:border-cyan-500 outline-none" /><Calendar className="absolute right-4 top-3.5 text-neutral-400 pointer-events-none" size={20} /></div>
        </div>

        {!editSessionId && showTimer && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-5 shadow-2xl w-full flex flex-col items-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 flex">
              <div className={"h-full transition-all duration-500 ease-in-out " + (mode === 'setup' ? 'w-full bg-cyan-500' : mode === 'countdown' ? 'w-full bg-yellow-500' : 'w-full bg-green-500')}></div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-neutral-400 mt-1">
              {mode === 'setup' && <React.Fragment><Settings size={18} /> <span className="uppercase tracking-widest text-xs font-semibold">Isometric Setup</span></React.Fragment>}
              {mode === 'countdown' && <React.Fragment><TimerIcon size={18} className="text-yellow-500" /> <span className="uppercase tracking-widest text-xs font-semibold text-yellow-500">Wait for it...</span></React.Fragment>}
              {mode === 'countup' && <React.Fragment><Play size={18} className="text-green-500" fill="currentColor" /> <span className="uppercase tracking-widest text-xs font-semibold text-green-500">It's Go Time!</span></React.Fragment>}
            </div>

            <div className="w-full flex justify-center items-center my-2 h-20 md:h-24">
              {mode === 'setup' && (
                <div className="flex items-center gap-3 text-4xl md:text-5xl font-bold text-neutral-200 tabular-nums">
                  <div className="flex flex-col items-center">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={setupMinutes} onChange={handleMinuteChange} className="w-16 md:w-20 bg-neutral-800 text-center rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/50 appearance-none m-0" />
                    <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Min</span>
                  </div>
                  <span className="mb-6 opacity-50">:</span>
                  <div className="flex flex-col items-center">
                    <input type="text" inputMode="numeric" pattern="[0-9]*" value={setupSeconds} onChange={handleSecondChange} className="w-16 md:w-20 bg-neutral-800 text-center rounded-xl focus:outline-none focus:ring-4 focus:ring-cyan-500/50 appearance-none m-0" />
                    <span className="text-xs text-neutral-500 mt-1 uppercase tracking-wide">Sec</span>
                  </div>
                </div>
              )}
              {mode === 'countdown' && (
                <div className="text-5xl md:text-6xl font-bold text-yellow-400 tabular-nums drop-shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  {formatCountdownTime(timeLeft)}
                </div>
              )}
              {mode === 'countup' && (
                <div className="text-4xl md:text-5xl font-bold text-green-400 tabular-nums drop-shadow-[0_0_15px_rgba(74,222,128,0.2)] flex items-baseline">
                  <span>{formatCountupTime(timeElapsed).slice(0, -3)}</span>
                  <span className="text-2xl md:text-3xl text-green-500/80">.{formatCountupTime(timeElapsed).slice(-2)}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 mt-4">
              {!isActive && mode !== 'countup' && (
                <button onClick={handleTimerStart} className="flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full px-5 py-2.5 text-base font-bold transition-transform active:scale-95 shadow-lg shadow-cyan-500/25">
                  <Play fill="currentColor" size={18} /> {mode === 'setup' ? 'Start' : 'Resume'}
                </button>
              )}
              {!isActive && mode === 'countup' && (
                <button onClick={() => {
                    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                    setIsActive(true);
                }} className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white rounded-full px-5 py-2.5 text-base font-bold transition-transform active:scale-95 shadow-lg shadow-green-500/25">
                  <Play fill="currentColor" size={18} /> Resume
                </button>
              )}
              {isActive && (
                <button onClick={handleTimerPause} className="flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-full px-5 py-2.5 text-base font-bold transition-transform active:scale-95">
                  <Pause fill="currentColor" size={18} /> Pause
                </button>
              )}
              {mode !== 'setup' && (
                <button onClick={handleTimerReset} className="flex items-center justify-center p-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-full transition-transform active:scale-95 group" title="Reset Timer">
                  <RotateCcw size={18} className="group-hover:-rotate-90 transition-transform duration-300" />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg"><div className="flex items-center gap-2 mb-3 text-neutral-400"><MessageSquare size={18} /> <span className="font-semibold text-sm">Session Notes</span></div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did today feel?" className="w-full bg-transparent border-none outline-none text-sm text-neutral-200 placeholder-neutral-600 resize-none min-h-[60px]" /></div>
        
        <div className="flex flex-col">
          {workoutData.map((exercise, exIndex) => {
            const history = historyCache[exercise.name] || [];
            const isSuperset = exercise.isSuperset && exIndex > 0;
            const nextIsSuperset = workoutData[exIndex + 1] && workoutData[exIndex + 1].isSuperset;
            
            let containerClasses = "bg-neutral-900 border border-neutral-800 overflow-hidden relative transition-all ";
            if (isSuperset && nextIsSuperset) containerClasses += "rounded-none border-y-0 mt-0";
            else if (isSuperset && !nextIsSuperset) containerClasses += "rounded-b-2xl rounded-t-none border-t-0 mt-0 shadow-lg pb-2";
            else if (!isSuperset && nextIsSuperset) containerClasses += "rounded-t-2xl rounded-b-none border-b-0 mt-6 pt-2";
            else containerClasses += "rounded-2xl mt-6 shadow-lg";

            return (
              <div key={exIndex} className={containerClasses}>
                {(!isSuperset && nextIsSuperset) && (
                  <div className="absolute top-0 right-0 bg-cyan-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl z-30 uppercase tracking-widest shadow-md">
                    Superset Block
                  </div>
                )}
                {(isSuperset || nextIsSuperset) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-500 z-10"></div>}
                <div className={`bg-neutral-800/40 px-5 py-4 border-b border-neutral-800 flex justify-between items-center gap-4 relative z-20 ${isSuperset ? 'border-t border-t-neutral-800/50 bg-neutral-950/20' : ''}`}>
                    <div className="flex flex-col w-full min-w-0">
                      <button type="button" onClick={() => setSelectingFor(exIndex)} className="font-bold text-lg text-left bg-transparent border-none outline-none w-full transition-colors whitespace-normal break-words leading-snug">
                          <span className={exercise.name ? "text-white" : "text-neutral-500"}>{exercise.name || "Select Exercise..."}</span>
                      </button>
                      {exercise.targetReps && (
                          <span className="text-xs font-mono text-cyan-500 mt-0.5 sm:hidden">Target: {exercise.targetSets || exercise.sets.length} × {exercise.targetReps}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                        {exIndex > 0 && (
                           <button onClick={() => toggleTrackerSuperset(exIndex)} className={`transition-colors ${exercise.isSuperset ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'text-neutral-600 hover:text-cyan-400'}`} title="Link as Superset">
                              {exercise.isSuperset ? <LinkIcon size={18}/> : <Unlink size={18}/>}
                           </button>
                        )}
                        <span className="text-xs font-mono text-neutral-500 bg-neutral-950 px-2 py-1 rounded-md whitespace-nowrap hidden sm:block">
                            Target: {exercise.targetSets || exercise.sets.length} {exercise.targetReps ? `× ${exercise.targetReps}` : 'Sets'}
                        </span>
                        <InlineConfirmDelete key={`del-block-${exIndex}-${exercise.name}`} onConfirm={() => removeExerciseBlock(exIndex)} containerClass="text-neutral-500 hover:text-red-400 transition-colors shrink-0" />
                    </div>
                </div>
                
                <div className="grid grid-cols-[3rem_1fr_1fr_3.5rem_2.5rem] md:grid-cols-[3rem_120px_1fr_1fr_4rem_2.5rem] gap-2 px-5 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider bg-neutral-950/50 items-center"><div className="text-center">Set</div><div className="hidden md:flex items-center gap-1 text-neutral-400"><HistoryIcon size={12}/> Last Log</div><div>{unitPref === 'kg' ? 'Kg' : 'Lbs'}</div><div>Reps</div><div className="text-center">Drop</div><div></div></div>
                <div className="px-5 py-3 space-y-3 relative z-20">
                  {exercise.sets.map((set, setIndex) => {
                    const prevSet = history[setIndex];
                    return (
                      <div key={set.id} className={`grid grid-cols-[3rem_1fr_1fr_3.5rem_2.5rem] md:grid-cols-[3rem_120px_1fr_1fr_4rem_2.5rem] gap-2 md:gap-3 items-center p-2 rounded-lg transition-colors ${set.isDropSet ? 'bg-cyan-900/20 border border-cyan-800/50' : 'bg-transparent'}`}>
                        <div className="text-center font-mono text-neutral-400 font-medium">{setIndex + 1}</div>
                        <div className="hidden md:block text-sm text-neutral-500 font-mono bg-neutral-950 px-2 py-2 rounded-lg border border-neutral-800 text-center">{prevSet && (prevSet.weight || prevSet.weight===0) ? `${prevSet.weight}x${prevSet.reps}${prevSet.isDropSet ? '↓' : ''}` : '--'}</div>
                        <div className="relative"><input type="number" step="0.1" value={set.weight} onChange={(e) => handleSetChange(exIndex, set.id, 'weight', e.target.value)} placeholder={prevSet && (prevSet.weight || prevSet.weight===0) ? prevSet.weight : "--"} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-1 md:px-2 py-2.5 text-white font-semibold text-center focus:border-cyan-500 outline-none placeholder-neutral-700" /></div>
                        <div className="relative"><input type="number" value={set.reps} onChange={(e) => handleSetChange(exIndex, set.id, 'reps', e.target.value)} placeholder={prevSet && (prevSet.reps || prevSet.reps===0) ? prevSet.reps : "--"} className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-1 md:px-2 py-2.5 text-white font-semibold text-center focus:border-cyan-500 outline-none placeholder-neutral-700" /></div>
                        <button onClick={() => toggleDropSet(exIndex, set.id)} className={`h-full flex items-center justify-center rounded-lg transition-colors border ${set.isDropSet ? 'bg-cyan-600/20 text-cyan-400 border-cyan-500/50' : 'bg-neutral-950 text-neutral-600 border-neutral-700'}`}><ArrowDown size={16} strokeWidth={set.isDropSet ? 3 : 2} /></button>
                        <button onClick={() => removeSet(exIndex, set.id)} className="h-full flex items-center justify-center rounded-lg text-neutral-600 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    );
                  })}
                  <button onClick={() => addExtraSet(exIndex)} className="w-full mt-2 py-2 flex items-center justify-center gap-2 text-sm text-neutral-500 hover:text-white rounded-lg border border-dashed border-neutral-700 hover:border-neutral-500"><Plus size={16} /> Add Set</button>
                </div>
              </div>
            );
          })}
          
          <button onClick={addAdHocExercise} className="w-full mt-6 py-4 flex items-center justify-center gap-2 font-bold text-neutral-400 hover:text-white bg-neutral-900 rounded-2xl border border-dashed border-neutral-700 hover:border-cyan-500 hover:bg-neutral-800 transition-all shadow-lg">
              <Plus size={20} /> Add Ad-Hoc Exercise
          </button>

        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-neutral-800 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40 flex justify-center pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-4xl flex gap-3">
          <div className="relative w-24 flex-shrink-0">
             <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder={prevDuration ? `${prevDuration}m` : "Mins"} className="w-full bg-neutral-950 border border-neutral-700 text-white pl-10 pr-3 py-4 rounded-xl font-bold focus:border-cyan-500 outline-none" />
             <Clock className="absolute left-3 top-4 text-neutral-500 pointer-events-none" size={20} />
          </div>
          <button onClick={saveSessionToCloud} disabled={isSaving || saved || isLogged.current} className={`flex-grow flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${saved ? 'bg-emerald-600' : editSessionId ? 'bg-amber-600 hover:bg-amber-500' : 'bg-cyan-600 hover:bg-cyan-500'} text-white`}>
            {isSaving ? <RefreshCw size={24} className="animate-spin" /> : saved ? <CheckCircle size={24} /> : editSessionId ? <Edit3 size={24} /> : <Save size={24} />} 
            {isSaving ? 'Saving...' : saved ? 'Cloud Updated' : editSessionId ? 'Update Session' : isOnline ? 'Log Workout' : 'Save Offline'}
          </button>
        </div>
      </div>

      {selectingFor !== null && (
          <ExerciseSelectorModal
              masterExercises={masterExercises}
              user={user}
              supabaseClient={supabaseClient}
              showAlert={showAlert}
              onClose={() => setSelectingFor(null)}
              onCustomCreated={(newEx) => setMasterExercises([...masterExercises, newEx])}
              onSelect={(exName) => {
                  handleExerciseNameChange(selectingFor, exName);
                  setSelectingFor(null);
              }}
          />
      )}

      {showPlateMath && <PlateMathModal onClose={() => setShowPlateMath(false)} unitPref={unitPref} />}
    </div>
  );
}

function EditLogHub({ globalHistory, onLaunchEdit, onBack, supabaseClient, showAlert }) {
  const uniqueSessions = [];
  const sessionMap = {}; 
  
  globalHistory.forEach(row => {
    const key = row.Timestamp;
    if (!sessionMap[key]) {
      sessionMap[key] = row;
      const timeStr = new Date(key).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      uniqueSessions.push({ date: row.Date, day: row['Day Title'], timestamp: key, timeStr });
    }
  });

  uniqueSessions.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date) || new Date(b.timestamp) - new Date(a.timestamp));
  
  const [filterDay, setFilterDay] = useState('All');
  const uniqueDayNames = ['All', ...new Set(uniqueSessions.map(s => s.day))].filter(Boolean);
  const filteredSessions = filterDay === 'All' ? uniqueSessions : uniqueSessions.filter(s => s.day === filterDay);

  if (uniqueSessions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans relative">
        <div className="max-w-4xl mx-auto py-6">
          <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
          <div className="text-center py-32">
            <Edit3 size={48} className="text-neutral-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No History Yet</h2>
            <p className="text-neutral-500">Log a session first before you can edit it.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
      <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
      <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-amber-500 font-semibold text-sm tracking-widest uppercase mb-1">Database Access</p>
            <h1 className="text-2xl font-bold text-white">Edit Past Sessions</h1>
          </div>
        </div>

        {uniqueDayNames.length > 2 && (
          <div className="relative z-20">
             <div className="relative">
                <select 
                   value={filterDay} 
                   onChange={(e) => setFilterDay(e.target.value)} 
                   className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 rounded-xl focus:border-amber-500 outline-none appearance-none font-bold shadow-lg transition-colors"
                >
                   {uniqueDayNames.map(day => (
                      <option key={day} value={day}>{day === 'All' ? 'All Workouts' : day}</option>
                   ))}
                </select>
                <ChevronDown className="absolute right-4 top-4 text-neutral-500 pointer-events-none" size={20} />
             </div>
          </div>
        )}

        <div className="space-y-3">
           {filteredSessions.map(session => (
              <div key={session.timestamp} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center shadow-lg">
                 <div>
                    <h3 className="font-bold text-white">{session.day}</h3>
                    <p className="text-sm text-neutral-500">{formatSafeDate(session.date)} at {session.timeStr}</p>
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={() => onLaunchEdit(session.timestamp)} className="bg-amber-600/20 text-amber-500 hover:bg-amber-600/40 px-4 py-2 rounded-lg font-bold text-sm transition-colors border border-amber-500/30">
                       Edit
                    </button>
                    <InlineConfirmDelete 
                      onConfirm={async () => {
                        try {
                          const { error } = await supabaseClient.from('workout_logs').delete().eq('session_timestamp', session.timestamp);
                          if (error) throw error;
                          window.location.reload();
                        } catch(e) { showAlert("Network Error: Could not connect to Supabase to delete session.", "Delete Error"); }
                      }}
                      containerClass="bg-red-500/10 text-red-500 hover:bg-red-500/20 p-2 rounded-lg transition-colors border border-red-500/20"
                    />
                 </div>
              </div>
           ))}
        </div>
      </div>
    </div>
  );
}

function ProgressHub({ globalHistory, blueprints, onBack, unitPref }) {
  const [activeTab, setActiveTab] = useState('blueprint'); 
  const [timeframe, setTimeframe] = useState('all'); 

  const [selectedBpId, setSelectedBpId] = useState(() => {
    const active = blueprints?.find(b => !b.is_archived);
    return active ? active.id : (blueprints?.[0]?.id || "");
  });
  const selectedBp = blueprints?.find(b => b.id === selectedBpId);
  
  const bpDays = selectedBp?.program_data?.map(d => d.title) || [];
  const [selectedBpDay, setSelectedBpDay] = useState(bpDays[0] || "");
  
  const bpExercises = selectedBp?.program_data?.find(d => d.title === selectedBpDay)?.exercises?.map(e => e.name) || [];
  const [selectedBpEx, setSelectedBpEx] = useState(bpExercises[0] || "");

  useEffect(() => {
    if (selectedBp) {
       const days = selectedBp.program_data?.map(d => d.title) || [];
       if (days.length > 0 && !days.includes(selectedBpDay)) setSelectedBpDay(days[0]);
    }
  }, [selectedBpId]);

  useEffect(() => {
    if (selectedBp && selectedBpDay) {
       const exList = selectedBp.program_data?.find(d => d.title === selectedBpDay)?.exercises?.map(e => e.name) || [];
       if (exList.length > 0 && !exList.includes(selectedBpEx)) setSelectedBpEx(exList[0]);
    }
  }, [selectedBpDay, selectedBpId]);

  const allExercises = [...new Set(globalHistory.map(item => item['Exercise Name']))].filter(Boolean).sort();
  const [globalSearch, setGlobalSearch] = useState("");
  const [selectedGlobalEx, setSelectedGlobalEx] = useState(allExercises[0] || "");
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);

  const filteredGlobalEx = allExercises.filter(ex => ex.toLowerCase().includes(globalSearch.toLowerCase()));

  if (globalHistory.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans relative">
        <div className="max-w-4xl mx-auto py-6">
          <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
          <div className="text-center py-32">
            <BarChart2 size={48} className="text-neutral-700 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No Data Yet</h2>
            <p className="text-neutral-500">Log some workouts to see your progress charted here.</p>
          </div>
        </div>
      </div>
    );
  }

  let exData = [];
  if (activeTab === 'blueprint') {
     exData = globalHistory.filter(item => item['Day Title'] === selectedBpDay && item['Exercise Name'] === selectedBpEx);
  } else {
     exData = globalHistory.filter(item => item['Exercise Name'] === selectedGlobalEx);
  }

  const groupedByDate = exData.reduce((acc, curr) => {
    const d = curr.Date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {});

  let chartData = Object.keys(groupedByDate).sort((a,b) => getSafeTime(a) - getSafeTime(b)).map(date => {
    const sets = groupedByDate[date];
    let totalVolume = 0;
    let duration = sets[0]['Duration (mins)'] || '';
    
    sets.forEach(s => {
        const w = parseFloat(s['Weight (lbs)']) || 0;
        const r = parseFloat(s['Reps']) || 0;
        totalVolume += (w * r); 
    });
    
    return { 
      date, 
      displayDate: formatSafeDate(date),
      duration,
      totalVolume, 
      sets 
    };
  });

  if (timeframe !== 'all' && chartData.length > 0) {
    const now = Date.now();
    const daysLimit = timeframe === '4w' ? 28 : 90;
    const cutoff = now - (daysLimit * 24 * 60 * 60 * 1000);
    chartData = chartData.filter(d => getSafeTime(d.date) >= cutoff);
  }

  const hasEnoughData = chartData.length >= 2;
  let points = "";
  let minVal = 0;
  let maxVal = 0;
  let range = 1;

  if (hasEnoughData) {
    maxVal = Math.max(...chartData.map(d => d.totalVolume));
    minVal = Math.min(...chartData.map(d => d.totalVolume));
    range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    
    points = chartData.map((d, i) => {
      const x = (i / (chartData.length - 1)) * 100;
      const y = 100 - (((d.totalVolume - minVal) / range) * 80 + 10);
      return `${x},${y}`;
    }).join(' ');
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
      <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
      <div className="max-w-4xl mx-auto space-y-6 mt-12 md:mt-0">
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-purple-500 font-semibold text-sm tracking-widest uppercase mb-1">Progress Hub</p>
            <h1 className="text-2xl font-bold text-white">Analytics</h1>
          </div>
        </div>

        <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-1.5 shadow-lg relative z-40">
           <button onClick={() => setActiveTab('blueprint')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'blueprint' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}>By Blueprint</button>
           <button onClick={() => setActiveTab('global')} className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'global' ? 'bg-purple-600 text-white shadow-md' : 'text-neutral-400 hover:text-white'}`}>Global Search</button>
        </div>

        {activeTab === 'blueprint' ? (
          <div className="space-y-4 mb-4 relative z-30">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Mesocycle</label>
                    <div className="relative">
                        <select value={selectedBpId} onChange={e => setSelectedBpId(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3.5 rounded-xl outline-none appearance-none font-bold shadow-sm focus:border-purple-500 transition-colors">
                            {blueprints?.map(bp => (
                                <option key={bp.id} value={bp.id}>{bp.name} {bp.is_archived ? '(Archived)' : '(Active)'}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-4 text-neutral-500 pointer-events-none" size={18} />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Workout Day</label>
                    <div className="relative">
                        <select value={selectedBpDay} onChange={e => setSelectedBpDay(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3.5 rounded-xl outline-none appearance-none font-bold shadow-sm focus:border-purple-500 transition-colors">
                            {selectedBp?.program_data?.map(day => (
                                <option key={day.title} value={day.title}>{day.title}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-4 text-neutral-500 pointer-events-none" size={18} />
                    </div>
                 </div>
             </div>
             <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Exercise</label>
                <div className="relative">
                    <select value={selectedBpEx} onChange={e => setSelectedBpEx(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-3.5 rounded-xl outline-none appearance-none font-bold shadow-sm focus:border-purple-500 transition-colors">
                        {selectedBp?.program_data?.find(d => d.title === selectedBpDay)?.exercises?.map(ex => (
                            <option key={ex.name} value={ex.name}>{ex.name}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-4 text-neutral-500 pointer-events-none" size={18} />
                </div>
             </div>
          </div>
        ) : (
          <div className="relative z-30 mb-4">
              <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Search Any Exercise</label>
              <button onClick={() => setIsGlobalSearchOpen(!isGlobalSearchOpen)} className="w-full bg-neutral-900 border border-neutral-800 text-white px-4 py-4 rounded-xl text-left font-bold shadow-lg flex justify-between items-center focus:border-purple-500 transition-colors">
                  {selectedGlobalEx || "Select an exercise..."}
                  <ChevronDown size={20} className="text-neutral-500" />
              </button>
              {isGlobalSearchOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-80 border-purple-500/50">
                      <div className="p-3 border-b border-neutral-800 shrink-0">
                         <div className="relative">
                            <input 
                               type="text" 
                               placeholder="Type to search..." 
                               value={globalSearch}
                               onChange={(e) => setGlobalSearch(e.target.value)}
                               className="w-full bg-neutral-950 border border-neutral-800 text-white pl-10 pr-4 py-3 rounded-lg focus:border-purple-500 outline-none"
                               autoFocus
                            />
                            <Search className="absolute left-3 top-3.5 text-neutral-500" size={18} />
                         </div>
                      </div>
                      <div className="overflow-y-auto p-2 space-y-1 bg-neutral-900/90 backdrop-blur-md">
                         {filteredGlobalEx.length === 0 && <div className="p-4 text-center text-neutral-500 text-sm">No exercises found.</div>}
                         {filteredGlobalEx.map(ex => (
                            <button 
                               key={ex} 
                               onClick={() => { setSelectedGlobalEx(ex); setIsGlobalSearchOpen(false); setGlobalSearch(""); }} 
                               className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm font-medium ${selectedGlobalEx === ex ? 'bg-purple-600/20 text-purple-400' : 'text-neutral-300 hover:bg-neutral-800'}`}
                            >
                               {ex}
                            </button>
                         ))}
                      </div>
                  </div>
              )}
          </div>
        )}

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-lg relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp size={20} className="text-purple-500" /> 
              Total Volume
            </h2>
            
            <div className="flex bg-neutral-950 border border-neutral-800 rounded-xl p-1 w-full sm:w-auto">
               <button onClick={() => setTimeframe('4w')} className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === '4w' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}>4W</button>
               <button onClick={() => setTimeframe('3m')} className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === '3m' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}>3M</button>
               <button onClick={() => setTimeframe('all')} className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${timeframe === 'all' ? 'bg-purple-600 text-white shadow' : 'text-neutral-400 hover:text-white'}`}>All</button>
            </div>
          </div>

          {!hasEnoughData ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl text-center p-4">
              Need at least 2 logged sessions within this timeframe to chart progress.
            </div>
          ) : (
            <div className="w-full h-56 relative pt-4 pb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="100" y2="10" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                
                <polyline fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
                
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 100;
                  const y = 100 - (((d.totalVolume - minVal) / range) * 80 + 10);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="2.5" fill="#a855f7" stroke="#0a0a0a" strokeWidth="1" />
                      <text x={x} y={y - 5} fontSize="3.5" fill="#e5e7eb" textAnchor={i === 0 ? "start" : i === chartData.length - 1 ? "end" : "middle"} fontWeight="bold">
                        {Math.round(d.totalVolume).toLocaleString()}
                      </text>
                      <text x={x} y={105} fontSize="3" fill="#6b7280" textAnchor={i === 0 ? "start" : i === chartData.length - 1 ? "end" : "middle"}>
                        {d.displayDate}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-neutral-500 uppercase tracking-widest pl-2">Session History</h3>
          {chartData.length === 0 && <div className="text-neutral-500 text-sm pl-2">No logs found.</div>}
          {[...chartData].reverse().map((session, idx) => (
            <div key={idx} className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-lg">
              <div className="bg-neutral-800/40 px-5 py-3 border-b border-neutral-800 flex justify-between items-center">
                <span className="font-bold text-white flex items-center gap-2">
                   {session.displayDate}
                   {session.duration && <span className="text-xs text-neutral-500 font-normal flex items-center gap-1 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800"><Clock size={12}/>{session.duration}m</span>}
                </span>
                <span className="text-xs font-mono text-purple-400 bg-purple-400/10 px-2 py-1 rounded border border-purple-500/20">
                  Vol: {Math.round(session.totalVolume).toLocaleString()}
                </span>
              </div>
              <div className="p-4 space-y-2">
                {session.sets.map((set, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center text-sm border-b border-neutral-800/50 last:border-0 pb-2 last:pb-0">
                    <span className="text-neutral-500 font-mono">Set {set['Set Num']}</span>
                    <div className="flex gap-4">
                      <span className="text-white font-semibold w-20 text-right">{(set['Weight (lbs)'] || set['Weight (lbs)']===0) ? set['Weight (lbs)'] + ` ${unitPref}` : 'BW'}</span>
                      <span className="text-neutral-400 w-16 text-right">x {set['Reps']}</span>
                      <span className="w-8 text-right text-blue-400 font-bold">{set['Is Drop Set'] === true || set['Is DropSet'] === 'TRUE' ? '↓' : ''}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WeightTracker({ user, weightHistory, setWeightHistory, weightGoals, setWeightGoals, onBack, unitPref, supabaseClient, showAlert, showConfirm }) {
  const [view, setView] = useState('tracker');
  const [newWeight, setNewWeight] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedPics, setExpandedPics] = useState({});

  const ProgressImage = ({ path }) => {
     const [imgUrl, setImgUrl] = useState(null);
     useEffect(() => {
        if (!path) return;
        supabaseClient.storage.from('progress_pics').createSignedUrl(path, 60 * 60 * 24).then(({ data }) => {
           if (data) setImgUrl(data.signedUrl);
        });
     }, [path]);
     if (!imgUrl) return <div className="h-32 w-full bg-neutral-950 flex items-center justify-center text-neutral-600 text-xs border border-neutral-800 rounded-xl animate-[pulse_2s_ease-in-out_infinite]">Loading Secure Image...</div>;
     return <img src={imgUrl} alt="Progress Check-in" className="w-full max-h-[500px] object-cover rounded-xl border border-neutral-800 shadow-md mt-4" />;
  };
  
  const getLocalDate = () => {
     const d = new Date();
     return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [date, setDate] = useState(getLocalDate());
  
  const [editGoalId, setEditGoalId] = useState(null);
  const [goalName, setGoalName] = useState("");
  const [goalStartWeight, setGoalStartWeight] = useState("");
  const [goalTargetWeight, setGoalTargetWeight] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalStartDate, setGoalStartDate] = useState("");
  const [isSavingGoal, setIsSavingGoal] = useState(false);

  const activeGoalRaw = weightGoals && weightGoals.length > 0 ? weightGoals.filter(function(g) { return g.is_active; })[0] : null;
  
  const weightGoal = activeGoalRaw ? {
    id: activeGoalRaw.id,
    name: activeGoalRaw.name,
    startWeight: parseFloat(activeGoalRaw.start_weight),
    targetWeight: parseFloat(activeGoalRaw.target_weight),
    startDate: activeGoalRaw.start_date,
    targetDate: activeGoalRaw.target_date
  } : null;

  const archivedGoals = weightGoals ? weightGoals.filter(function(g) { return !g.is_active; }).sort(function(a,b) { return getSafeTime(b.created_at) - getSafeTime(a.created_at); }) : [];

  const openGoalEditor = (goal) => {
     if (goal) {
        setEditGoalId(goal.id);
        setGoalName(goal.name || "");
        setGoalStartWeight(goal.start_weight || "");
        setGoalTargetWeight(goal.target_weight || "");
        setGoalStartDate(goal.start_date || "");
        setGoalTargetDate(goal.target_date || "");
     } else {
        setEditGoalId(null);
        setGoalName("Phase " + ((weightGoals ? weightGoals.length : 0) + 1));
        setGoalStartWeight(weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : "");
        setGoalTargetWeight("");
        setGoalStartDate(getLocalDate());
        setGoalTargetDate("");
     }
     setView('edit');
  };

  const handleSaveGoal = async () => {
     if (!goalName || !goalStartWeight || !goalTargetWeight || !goalStartDate || !goalTargetDate) {
        showAlert("Please fill out all fields.", "Missing Information");
        return;
     }
     
     setIsSavingGoal(true);
     try {
        const payload = {
           user_id: user.id,
           name: goalName,
           start_weight: parseFloat(goalStartWeight),
           target_weight: parseFloat(goalTargetWeight),
           start_date: goalStartDate,
           target_date: goalTargetDate,
           is_active: true
        };

        await supabaseClient.from('weight_goals').update({ is_active: false }).eq('user_id', user.id);
        let updatedGoals = weightGoals.map(function(g) { return Object.assign({}, g, { is_active: false }); });

        if (editGoalId) {
           const { data, error } = await supabaseClient.from('weight_goals').update(payload).eq('id', editGoalId).select().single();
           if (error) throw error;
           updatedGoals = updatedGoals.map(function(g) { return g.id === editGoalId ? data : g; });
        } else {
           const { data, error } = await supabaseClient.from('weight_goals').insert([payload]).select().single();
           if (error) throw error;
           updatedGoals.push(data);
        }

        setWeightGoals(updatedGoals);
        setView('tracker');
     } catch(e) { 
        console.error(e);
        showAlert("Network Error: Could not save goal.", "Sync Error"); 
     } finally {
        setIsSavingGoal(false);
     }
  };

  const handleArchiveGoal = async (goalId, makeActive) => {
     try {
        if (makeActive) {
           await supabaseClient.from('weight_goals').update({ is_active: false }).eq('user_id', user.id);
        }
        const { error } = await supabaseClient.from('weight_goals').update({ is_active: makeActive }).eq('id', goalId);
        if (error) throw error;
        
        setWeightGoals(weightGoals.map(function(g) {
           if (makeActive) {
              return g.id === goalId ? Object.assign({}, g, { is_active: true }) : Object.assign({}, g, { is_active: false });
           } else {
              return g.id === goalId ? Object.assign({}, g, { is_active: false }) : g;
           }
        }));
     } catch(e) {
        showAlert("Network Error: Could not update goal status.", "Update Error");
     }
  };

  const handleDeleteGoal = async (goalId) => {
     showConfirm("Permanently delete this goal?", "Delete Goal", async () => {
         try {
            const { error } = await supabaseClient.from('weight_goals').delete().eq('id', goalId);
            if (error) throw error;
            setWeightGoals(weightGoals.filter(function(g) { return g.id !== goalId; }));
         } catch(e) {
            showAlert("Network Error: Could not delete goal.", "Delete Error");
         }
     });
  };

  const handleSaveWeight = async () => {
    if (!newWeight) return;
    setIsUploading(true);
    const weightNum = parseFloat(newWeight);
    let uploadedUrl = null;

    try {
      if (selectedFile) {
         uploadedUrl = await compressAndUploadImage(selectedFile, user.id, supabaseClient);
      }

      const newEntry = { date, weight: weightNum, photo_url: uploadedUrl };
      setWeightHistory([...weightHistory, newEntry]);
      setNewWeight("");
      setSelectedFile(null);

      const { error } = await supabaseClient.from('body_metrics').insert({
         user_id: user.id,
         date: date,
         weight: weightNum,
         photo_url: uploadedUrl
      });
      if (error) throw error;
    } catch(e) { 
      console.error("Upload error:", e);
      showAlert("Network Error: Could not sync weight or photo to cloud. Check your connection.", "Upload Error"); 
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveWeight = async (dateToRemove, weightToRemove) => {
    setWeightHistory(weightHistory.filter(w => !(w.date === dateToRemove && w.weight === weightToRemove)));
    
    const cleanDate = typeof dateToRemove === 'string' && dateToRemove.includes('T') 
        ? dateToRemove.split('T')[0] 
        : dateToRemove;

    try {
      const { error } = await supabaseClient.from('body_metrics').delete()
          .eq('user_id', user.id)
          .eq('date', cleanDate)
          .eq('weight', parseFloat(weightToRemove));
      if (error) throw error;
    } catch(e) { 
      console.error("Cloud delete failed"); 
      showAlert("Network Error: Could not delete weight from cloud.", "Delete Error");
    }
  };

  const combinedData = [...weightHistory].sort((a, b) => getSafeTime(a.date) - getSafeTime(b.date));

  const hasEnoughData = combinedData.length >= 2;
  let points = "";
  let minVal = 0;
  let maxVal = 0;
  let range = 1;
  
  let trendStatus = null;
  let expectedWeightDisplay = null;
  
  const weightBuffer = unitPref === 'kg' ? 0.7 : 1.5;

  if (hasEnoughData) {
    maxVal = Math.max(...combinedData.map(d => d.weight));
    minVal = Math.min(...combinedData.map(d => d.weight));
    
    if (weightGoal) {
      if (weightGoal.startWeight > maxVal) maxVal = weightGoal.startWeight;
      if (weightGoal.targetWeight < minVal) minVal = weightGoal.targetWeight;
      if (weightGoal.targetWeight > weightGoal.startWeight) {
         if (weightGoal.targetWeight > maxVal) maxVal = weightGoal.targetWeight;
         if (weightGoal.startWeight < minVal) minVal = weightGoal.startWeight;
      }
    }
    
    range = maxVal - minVal === 0 ? 1 : maxVal - minVal;
    
    points = combinedData.map((d, i) => {
      const x = (i / (combinedData.length - 1)) * 100;
      const y = 100 - (((d.weight - minVal) / range) * 80 + 10);
      return `${x},${y}`;
    }).join(' ');

    if (weightGoal) {
      const isBulking = weightGoal.targetWeight > weightGoal.startWeight;
      
      const current = combinedData[combinedData.length - 1];
      const startDate = new Date(typeof weightGoal.startDate === 'string' && weightGoal.startDate.includes('T') ? weightGoal.startDate : `${weightGoal.startDate}T00:00:00`);
      const lastLogDate = new Date(typeof current.date === 'string' && current.date.includes('T') ? current.date : `${current.date}T00:00:00`);
      const targetDateObj = new Date(typeof weightGoal.targetDate === 'string' && weightGoal.targetDate.includes('T') ? weightGoal.targetDate : `${weightGoal.targetDate}T00:00:00`);

      const now = new Date();
      const todayDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const totalDays = (targetDateObj - startDate) / (1000 * 60 * 60 * 24);

      if (totalDays > 0) {
        let daysElapsedToday = (todayDateObj - startDate) / (1000 * 60 * 60 * 24);
        daysElapsedToday = Math.min(Math.max(daysElapsedToday, 0), totalDays);

        const expectedWeightToday = weightGoal.startWeight - ((weightGoal.startWeight - weightGoal.targetWeight) * (daysElapsedToday / totalDays));
        expectedWeightDisplay = expectedWeightToday.toFixed(1);
        
        let daysElapsedAtLog = (lastLogDate - startDate) / (1000 * 60 * 60 * 24);
        daysElapsedAtLog = Math.min(Math.max(daysElapsedAtLog, 0), totalDays);
        const expectedAtLog = weightGoal.startWeight - ((weightGoal.startWeight - weightGoal.targetWeight) * (daysElapsedAtLog / totalDays));
        
        const diff = current.weight - expectedAtLog;

        if (lastLogDate >= targetDateObj) {
           const reachedGoal = isBulking 
             ? current.weight >= weightGoal.targetWeight - weightBuffer 
             : current.weight <= weightGoal.targetWeight + weightBuffer;

           trendStatus = reachedGoal ? 
              { text: "Goal Reached! 🏆", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" } : 
              { text: "Goal Missed", color: "text-red-400 bg-red-400/10 border-red-500/20" };
        } else {
           if (isBulking) {
             if (diff >= -0.5 - weightBuffer) {
                trendStatus = { text: "On Target 🎯", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" };
             } else if (diff >= -2.5 - weightBuffer) {
                trendStatus = { text: "Slightly Behind ⚠️", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20" };
             } else {
                trendStatus = { text: "In Danger 🚨", color: "text-red-400 bg-red-400/10 border-red-500/20" };
             }
           } else {
             if (diff <= 0.5 + weightBuffer) {
               trendStatus = { text: "On Target 🎯", color: "text-emerald-400 bg-emerald-400/10 border-emerald-500/20" };
             } else if (diff <= 2.5 + weightBuffer) {
               trendStatus = { text: "Slightly Behind ⚠️", color: "text-yellow-400 bg-yellow-400/10 border-yellow-500/20" };
             } else {
               trendStatus = { text: "In Danger 🚨", color: "text-red-400 bg-red-400/10 border-red-500/20" };
             }
           }
        }
      }
    }
  }

  if (view === 'hub') {
     return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
           <button onClick={() => setView('tracker')} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Tracker</button>
           <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-neutral-800 pb-6 gap-4">
                 <div>
                    <p className="text-cyan-500 font-semibold text-sm tracking-widest uppercase mb-1">Goal Engine</p>
                    <h1 className="text-3xl font-bold text-white">Goal Manager</h1>
                 </div>
              </div>

              <div className="mb-8">
                 <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase mb-4 flex items-center gap-2"><TrendingUp size={20} className="text-cyan-500" /> Active Phase</h2>
                 {weightGoal ? (
                    <div className="bg-neutral-900 border border-cyan-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h3 className="text-xl font-bold text-white mb-1">{weightGoal.name}</h3>
                             <p className="text-sm text-neutral-500 font-medium">{weightGoal.startWeight} {unitPref} ➔ {weightGoal.targetWeight} {unitPref}</p>
                          </div>
                          <span className="bg-cyan-500/10 text-cyan-400 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded">Active</span>
                       </div>
                       <div className="flex gap-3">
                          <button onClick={() => openGoalEditor(activeGoalRaw)} className="flex-grow bg-cyan-600/20 text-cyan-500 hover:bg-cyan-600 hover:text-white border border-cyan-500/30 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2">
                             <Edit3 size={18}/> Edit
                          </button>
                          <button onClick={() => handleArchiveGoal(weightGoal.id, false)} className="px-6 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-neutral-700">
                             Archive
                          </button>
                       </div>
                    </div>
                 ) : (
                    <button onClick={() => openGoalEditor(null)} className="w-full bg-neutral-900 border-2 border-dashed border-neutral-700 hover:border-cyan-500/50 rounded-2xl p-8 flex flex-col items-center justify-center text-neutral-500 hover:text-cyan-400 transition-all group shadow-lg">
                       <Plus size={40} className="mb-2 group-hover:scale-110 transition-transform" />
                       <span className="font-bold tracking-wide uppercase text-sm">Create New Goal Phase</span>
                    </button>
                 )}
              </div>

              {archivedGoals.length > 0 && (
                 <div>
                    <h2 className="text-lg font-bold text-neutral-300 tracking-wide uppercase mb-4 flex items-center gap-2"><BookOpen size={20} className="text-neutral-500" /> Past Phases</h2>
                    <div className="space-y-4">
                       {archivedGoals.map(goal => (
                          <div key={goal.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                   <h3 className="text-lg font-bold text-white mb-1">{goal.name}</h3>
                                   <p className="text-xs text-neutral-500 font-medium">{goal.start_weight} {unitPref} ➔ {goal.target_weight} {unitPref}</p>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button onClick={() => openGoalEditor(goal)} className="px-4 bg-neutral-800 text-neutral-300 hover:bg-neutral-700 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700 text-sm">
                                   <Edit3 size={16}/> Edit
                                </button>
                                <button onClick={() => handleArchiveGoal(goal.id, true)} className="flex-grow bg-neutral-800 text-neutral-300 hover:bg-cyan-600/20 hover:text-cyan-400 hover:border-cyan-500/30 font-bold py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 border border-neutral-700 text-sm">
                                   <RefreshCw size={16}/> Set as Active
                                </button>
                                <InlineConfirmDelete onConfirm={() => handleDeleteGoal(goal.id)} iconSize={20} containerClass="px-4 bg-neutral-800 border border-neutral-700 hover:border-red-500/50 hover:text-red-400 text-neutral-400 font-bold rounded-lg transition-colors flex items-center justify-center" />
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>
              )}
           </div>
        </div>
     );
  }

  if (view === 'edit') {
     return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
           <button onClick={() => setView('tracker')} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Tracker</button>
           <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
              <div className="bg-neutral-900 border border-cyan-500/50 rounded-2xl p-6 shadow-lg space-y-6">
                 <h3 className="font-bold text-xl text-white flex items-center gap-2"><Settings size={20} className="text-cyan-500"/> Phase Parameters</h3>
                 
                 <div>
                    <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-2 block">Phase Name</label>
                    <input type="text" value={goalName} onChange={e => setGoalName(e.target.value)} placeholder="e.g. Fall Bulk 2026" className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none text-lg font-bold" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1 block">Start Date</label>
                       <input type="date" value={goalStartDate} onChange={e => setGoalStartDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1 block">Start Weight ({unitPref})</label>
                       <input type="number" step="0.1" value={goalStartWeight} onChange={e => setGoalStartWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1 block">Target Weight ({unitPref})</label>
                       <input type="number" step="0.1" value={goalTargetWeight} onChange={e => setGoalTargetWeight(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none" />
                    </div>
                    <div>
                       <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide mb-1 block">Target Date</label>
                       <input type="date" value={goalTargetDate} onChange={e => setGoalTargetDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 text-white px-4 py-3 rounded-xl focus:border-cyan-500 outline-none" />
                    </div>
                 </div>
                 <div className="flex gap-3 pt-4 border-t border-neutral-800">
                    <button onClick={() => setView('tracker')} className="px-6 bg-neutral-800 hover:bg-neutral-700 text-white font-bold py-3 rounded-xl transition-colors border border-neutral-700">Cancel</button>
                    <button onClick={handleSaveGoal} disabled={isSavingGoal} className="flex-grow bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
                       {isSavingGoal ? <RefreshCw size={20} className="animate-spin" /> : <Save size={20} />} 
                       {isSavingGoal ? 'Saving...' : 'Save Phase to Cloud'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
      <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
      <div className="max-w-4xl mx-auto space-y-6 mt-12 md:mt-0">
        
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-cyan-500 font-semibold text-sm tracking-widest uppercase mb-1">BODYWEIGHT TRENDS</p>
            <h1 className="text-2xl font-bold text-white">Weight Tracker</h1>
          </div>
          {!weightGoal && (
             <button onClick={() => setView('edit')} className="flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600 hover:text-white rounded-lg transition-colors border border-cyan-500/30">
                <Plus size={16} /> Set Goal
             </button>
          )}
          {weightGoal && (
             <button onClick={() => setView('hub')} className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors border border-neutral-700">
                <Settings size={16} /> Goal Manager
             </button>
          )}
        </div>

        <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale size={20} className="text-cyan-500" /> 
              Weight Trend
            </h2>
            {hasEnoughData && (
              <span className={`text-sm font-medium px-2 py-1 rounded-md ${combinedData[combinedData.length-1].weight > combinedData[0].weight ? 'text-emerald-500 bg-emerald-500/10' : 'text-red-500 bg-red-500/10'}`}>
                {combinedData[combinedData.length-1].weight - combinedData[0].weight > 0 ? '+' : ''}{(combinedData[combinedData.length-1].weight - combinedData[0].weight).toFixed(1)} {unitPref}
              </span>
            )}
          </div>

          {!hasEnoughData ? (
            <div className="h-48 flex items-center justify-center text-neutral-500 border border-dashed border-neutral-800 rounded-xl">
              Need at least 2 logs to chart progress.
            </div>
          ) : (
            <div className="w-full h-56 relative pt-4 pb-6">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="100" y2="10" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="50" x2="100" y2="50" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                <line x1="0" y1="90" x2="100" y2="90" stroke="#262626" strokeWidth="0.5" strokeDasharray="2,2" />
                
                <polyline fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
                
                {combinedData.map((d, i) => {
                  const x = (i / (combinedData.length - 1)) * 100;
                  const y = 100 - (((d.weight - minVal) / range) * 80 + 10);
                  return (
                    <g key={i}>
                      <circle cx={x} cy={y} r="2.5" fill="#22d3ee" stroke="#0a0a0a" strokeWidth="1" />
                      <text x={x} y={y - 5} fontSize="3.5" fill="#e5e7eb" textAnchor={i === 0 ? "start" : i === combinedData.length - 1 ? "end" : "middle"} fontWeight="bold">
                        {d.weight}
                      </text>
                      <text x={x} y={105} fontSize="3" fill="#6b7280" textAnchor={i === 0 ? "start" : i === combinedData.length - 1 ? "end" : "middle"}>
                        {formatSafeDate(d.date)}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {trendStatus && weightGoal && (
            <div>
              <div className={`mt-6 px-4 py-3 rounded-xl border flex justify-between items-center ${trendStatus.color}`}>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Phase: {weightGoal.name} ({weightGoal.targetWeight} {unitPref} by {formatSafeDate(weightGoal.targetDate)})</span>
                    <span className="text-sm font-medium">Status: <strong>{trendStatus.text}</strong></span>
                 </div>
                 <div className="text-right flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Expected Today</span>
                    <span className="text-sm font-bold">{expectedWeightDisplay} {unitPref}</span>
                 </div>
              </div>
              <span className="text-[10px] text-neutral-500 mt-2 ml-1 block">* Trend status incorporates a {weightBuffer} {unitPref} buffer to account for water retention & inflammation.</span>
            </div>
          )}
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-3 rounded-xl font-medium focus:border-cyan-500 outline-none" />
            <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder={unitPref === 'kg' ? 'Kg' : 'Lbs'} className="w-full bg-neutral-950 border border-neutral-700 text-white px-3 py-3 rounded-xl font-medium focus:border-cyan-500 outline-none" />
          </div>
          <div className="flex items-center justify-between gap-3">
            <input type="file" accept="image/*" id="progress-pic-upload" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
            <label htmlFor="progress-pic-upload" className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border transition-all cursor-pointer flex-grow shadow-sm ${selectedFile ? 'bg-cyan-900/20 border-cyan-500/50 text-cyan-400' : 'bg-neutral-950 border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'}`}>
                <Camera size={18} />
                <span className="text-sm font-bold truncate">{selectedFile ? 'Photo Attached' : 'Attach Check-in Photo'}</span>
            </label>
            {selectedFile && (
                <button onClick={() => setSelectedFile(null)} className="p-3 bg-neutral-950 border border-neutral-700 text-neutral-500 hover:text-red-400 rounded-xl transition-colors shrink-0">
                    <XIcon size={18} />
                </button>
            )}
            <button onClick={handleSaveWeight} disabled={isUploading || !newWeight} className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2 shrink-0 min-w-[100px]">
              {isUploading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
              {isUploading ? 'Saving...' : 'Log'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {[...combinedData].reverse().map((entry, idx) => (
            <div key={`${entry.date}-${entry.weight}-${idx}`} className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 shadow-md flex flex-col">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{formatSafeDate(entry.date)}</span>
                <div className="flex items-center gap-4">
                  <span className="text-cyan-400 font-mono font-bold text-lg">{entry.weight} {unitPref}</span>
                  <InlineConfirmDelete 
                    key={`del-${entry.date}-${entry.weight}`}
                    onConfirm={() => handleRemoveWeight(entry.date, entry.weight)} 
                    iconSize={16} 
                    containerClass="text-neutral-600 hover:text-red-400 transition-colors"
                  />
                </div>
              </div>
              {entry.photo_url && (
                 <div className="mt-4 pt-3 border-t border-neutral-800/50">
                   <button onClick={() => setExpandedPics(prev => ({...prev, [idx]: !prev[idx]}))} className="w-full py-2 flex items-center justify-center gap-2 text-sm font-semibold text-neutral-400 hover:text-cyan-400 transition-colors rounded-lg bg-neutral-950/50 border border-neutral-800/50">
                     <Camera size={16} /> {expandedPics[idx] ? 'Hide Progress Photo' : 'View Progress Photo'}
                   </button>
                   {expandedPics[idx] && <ProgressImage path={entry.photo_url} />}
                 </div>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

function ExportHub({ globalHistory, onBack, unitPref, showAlert }) {
      const [copied, setCopied] = useState(false);
      
      const uniqueSessions = [];
      const sessionMap = {}; 
      
      globalHistory.forEach(row => {
        const key = `${row.Date}|${row['Day Title']}`;
        if (!sessionMap[key]) {
          sessionMap[key] = [];
          uniqueSessions.push({ date: row.Date, day: row['Day Title'], key });
        }
        sessionMap[key].push(row);
      });

      uniqueSessions.sort((a, b) => getSafeTime(b.date) - getSafeTime(a.date));
      
      const [selectedKey, setSelectedKey] = useState(uniqueSessions.length > 0 ? uniqueSessions[0].key : "");
      const [isOpen, setIsOpen] = useState(false);
      
      const exportTextAreaRef = React.useRef(null);

      if (uniqueSessions.length === 0) {
        return (
          <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans relative">
            <div className="max-w-4xl mx-auto py-6">
              <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
              <div className="text-center py-32">
                <Clipboard size={48} className="text-neutral-700 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">No Workouts Logged</h2>
                <p className="text-neutral-500">Log a session to export it for your coach.</p>
              </div>
            </div>
          </div>
        );
      }

      const generateText = (key) => {
        if (!key || !sessionMap[key]) return "";
        const rows = sessionMap[key];
        const dayTitle = rows[0]['Day Title'];
        const dateDisplay = formatSafeDate(rows[0].Date);
        const durationDisplay = rows[0]['Duration (mins)'] ? `Duration: ${rows[0]['Duration (mins)']} mins\n` : '';
        
        let text = `Workout: ${dayTitle}\nDate: ${dateDisplay}\n${durationDisplay}\n`;
        const exOrder = [];
        const exMap = {};
        
        rows.forEach(r => {
           if (!exMap[r['Exercise Name']]) {
               exMap[r['Exercise Name']] = [];
               exOrder.push(r['Exercise Name']);
           }
           exMap[r['Exercise Name']].push(r);
        });

        exOrder.forEach(exName => {
           text += `${exName}:\n`;
           exMap[exName].sort((a,b) => a['Set Num'] - b['Set Num']).forEach(s => {
              const weightVal = s['Weight (lbs)'];
              const weightStr = (weightVal !== '' && weightVal !== null && weightVal !== undefined) ? `${weightVal} ${unitPref}` : `BW`;
              const isDrop = s['Is Drop Set'] === true || s['Is Drop Set'] === 'TRUE' || s['Is Drop Set'] === 'true';
              const isSuperset = s['Is Superset'] === true || s['Is Superset'] === 'TRUE' || s['Is Superset'] === 'true';
              
              text += `- Set ${s['Set Num']}: ${weightStr} x ${s['Reps'] || 0}${isDrop ? ' (Drop Set)' : ''}${isSuperset ? ' (Superset)' : ''}\n`;
           });
           text += '\n';
        });
        
        const notes = rows.find(r => r['Notes'] && String(r['Notes']).trim() !== '');
        if (notes) {
          text += `Notes:\n${notes['Notes']}`;
        }

        return text.trim();
      };

      const handleCopy = () => {
        if (exportTextAreaRef.current) {
          exportTextAreaRef.current.select();
          try {
            document.execCommand('copy');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch (err) {
            showAlert('Your browser blocked the auto-copy. The text is highlighted—just tap "Copy" on your screen!', "Copy Blocked");
          }
        }
      };

      const selectedSession = uniqueSessions.find(s => s.key === selectedKey);
      const displayLabel = selectedSession ? `${formatSafeDate(selectedSession.date)} - ${selectedSession.day}` : "Select Session";

      return (
        <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 font-sans pb-24 relative">
          <button onClick={onBack} className="absolute top-4 md:top-8 left-4 md:left-8 flex items-center gap-2 text-neutral-400 hover:text-white transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
          <div className="max-w-3xl mx-auto space-y-6 mt-12 md:mt-0">
            
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-indigo-500 font-semibold text-sm tracking-widest uppercase mb-1">Coach Sharing</p>
                <h1 className="text-2xl font-bold text-white">Export Session</h1>
              </div>
            </div>

            <div className="relative z-20">
              <button onClick={() => setIsOpen(!isOpen)} className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center text-sm font-bold text-white shadow-lg hover:border-indigo-500 transition-colors">
                {displayLabel}
                <ChevronDown size={20} className="text-neutral-500" />
              </button>
              {isOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl max-h-80 overflow-y-auto no-scrollbar">
                  {uniqueSessions.map(session => (
                    <div key={session.key} onClick={() => { setSelectedKey(session.key); setIsOpen(false); }} className={`p-4 hover:bg-neutral-800 cursor-pointer border-b border-neutral-800/50 last:border-0 ${selectedKey === session.key ? 'text-indigo-400 font-bold' : 'text-neutral-300'}`}>
                      {formatSafeDate(session.date)} - {session.day}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Copy size={20} className="text-indigo-500" /> 
                  Text Preview
                </h2>
              </div>
              <textarea 
                ref={exportTextAreaRef}
                readOnly 
                value={generateText(selectedKey)} 
                className="w-full h-80 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-300 font-mono resize-none focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            
            <button onClick={handleCopy} className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-lg transition-all ${copied ? 'bg-emerald-600 border border-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white shadow-lg`}>
              {copied ? <Check size={24} /> : <Clipboard size={24} />} 
              {copied ? 'Copied to Clipboard!' : 'Copy for Coach'}
            </button>

          </div>
        </div>
      );
    }

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const [currentView, setCurrentView] = useState('landing'); 
  const [activeDayId, setActiveDayId] = useState(null);
  const [editSessionId, setEditSessionId] = useState(null); 
  const [showAppGuide, setShowAppGuide] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [cachedSession, setCachedSession] = useState(null);
  
  const [isSyncing, setIsSyncing] = useState(true);
  const [hasInitialSyncCompleted, setHasInitialSyncCompleted] = useState(false);
  const [isPro, setIsPro] = useState(false);
  
  const [globalHistory, setGlobalHistory] = useState([]);
  const [weightHistory, setWeightHistory] = useState([]);
  const [weightGoals, setWeightGoals] = useState([]);
  const [masterExercises, setMasterExercises] = useState([]);
  const [unitPref, setUnitPref] = useState(() => safeStorageGet('lethal_unitPref', 'lbs'));
  
  const [blueprints, setBlueprints] = useState([]);
  const [program, setProgram] = useState([]);

  const [modalConfig, setModalConfig] = useState(null);
  const showAlert = (message, title="Notice") => setModalConfig({ type: 'alert', message, title });
  const showConfirm = (message, title="Confirm", onConfirm) => setModalConfig({ type: 'confirm', message, title, onConfirm });

  // -------------------------
  // OFFLINE SYNC LOGIC
  // -------------------------
  const syncOfflineQueue = async () => {
    const queueStr = safeStorageGet('lethal_offline_queue', '[]');
    const queue = JSON.parse(queueStr);
    
    if (queue.length === 0 || !supabaseClient) return;
    
    let allSucceeded = true;
    for (const session of queue) {
        try {
            if (session.isEdit) {
                await supabaseClient.from('workout_logs').delete().eq('session_timestamp', session.id);
            }
            if (session.records && session.records.length > 0) {
                const { error } = await supabaseClient.from('workout_logs').insert(session.records);
                if (error) throw error;
            }
        } catch (e) {
            console.error("Failed to sync offline session:", e);
            allSucceeded = false;
        }
    }

    if (allSucceeded) {
        safeStorageRemove('lethal_offline_queue');
        showAlert("All offline workouts have been successfully synced to the cloud!", "Sync Complete");
        // Trigger a re-sync of global history to reflect the newly uploaded data
        setHasInitialSyncCompleted(false);
        setIsSyncing(true);
    }
  };

  useEffect(() => {
    const handleOnline = () => {
        setIsOnline(true);
        syncOfflineQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // If we load the app and we are online, check if there's anything to sync
    if (navigator.onLine) {
        syncOfflineQueue();
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // -------------------------

  if (configError) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 text-center font-sans space-y-6">
        <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
          <Settings size={48} className="text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white">Startup Diagnostic</h1>
        <p className="text-neutral-400 max-w-md leading-relaxed">
          The application halted because the database pipeline threw a critical error during initialization.
        </p>
        <div className="bg-neutral-900 border border-red-500/20 p-4 rounded-xl text-left font-mono text-sm text-red-400 w-full max-w-md overflow-auto">
            <p className="font-bold text-white mb-2">Raw Error Log:</p>
            {typeof configError === 'string' ? configError : 'Invalid URL or missing keys.'}
        </div>
      </div>
    );
  }

  const checkCache = () => {
    const cacheStr = safeStorageGet('lethal_workout_cache');
    if (cacheStr) {
      try {
        setCachedSession(JSON.parse(cacheStr));
      } catch(e) {
        setCachedSession(null);
      }
    } else {
      setCachedSession(null);
    }
  };

  useEffect(() => {
    if (currentView === 'landing') {
      checkCache();
    }
  }, [currentView]);

  const handleClearCache = () => {
    safeStorageRemove('lethal_workout_cache');
    setCachedSession(null);
  };

  useEffect(() => {
    if (!supabaseClient) return;
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? session.user : null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentView !== 'landing') {
      window.history.pushState({ page: currentView }, '');
    }
    setTimeout(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, 10);
  }, [currentView]);

  useEffect(() => {
    const handleHardwareBack = () => {
      setCurrentView('landing');
      setActiveDayId(null);
      setEditSessionId(null);
      setShowAppGuide(false);
      setShowAbout(false);
      setTimeout(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); }, 10);
    };
    window.addEventListener('popstate', handleHardwareBack);
    return () => window.removeEventListener('popstate', handleHardwareBack);
  }, []);

  useEffect(() => {
    if (!user || hasInitialSyncCompleted || !supabaseClient) return;
    if (!isOnline) {
        setIsSyncing(false);
        setHasInitialSyncCompleted(true);
        return; // Don't try to fetch if we know we are offline
    }

    const fetchCloudData = async () => {
      try {
        const { data: bpData } = await supabaseClient.from('blueprints').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (bpData && bpData.length > 0) {
           setBlueprints(bpData);
           const active = bpData.find(bp => !bp.is_archived);
           if (active && active.program_data) {
              setProgram(active.program_data);
           }
        }

        const { data: logData } = await supabaseClient.from('workout_logs')
           .select('*')
           .eq('user_id', user.id)
           .order('session_timestamp', { ascending: true })
           .order('exercise_order', { ascending: true })
           .order('set_num', { ascending: true });
           
        if (logData) {
           const mappedLogs = logData.map(r => ({
              'Timestamp': r.session_timestamp,
              'Date': r.date,
              'Day Title': r.day_title,
              'Duration (mins)': r.duration_mins,
              'Notes': r.notes,
              'Exercise Name': r.exercise_name,
              'Set Num': r.set_num,
              'Weight (lbs)': r.weight_lbs,
              'Reps': r.reps,
              'Is Drop Set': r.is_drop_set,
              'Is Superset': r.is_superset
           }));
           setGlobalHistory(mappedLogs);
        }

        const { data: weightData } = await supabaseClient.from('body_metrics').select('*').eq('user_id', user.id);
        if (weightData) {
           setWeightHistory(weightData.map(w => ({ date: w.date, weight: parseFloat(w.weight), photo_url: w.photo_url })));
        }

        const { data: goalData, error: goalError } = await supabaseClient.from('weight_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
        if (goalError) console.error("Error fetching goals:", goalError);
        if (goalData) {
           setWeightGoals(goalData);
        }

        const { data: exData, error: exError } = await supabaseClient.from('exercises').select('*');
        if (exError) console.error("Error fetching exercises:", exError);
        if (exData) {
            setMasterExercises(exData);
        }

        const { data: subData } = await supabaseClient.from('user_subscriptions').select('is_pro').eq('user_id', user.id).maybeSingle();
        if (subData && subData.is_pro) {
            setIsPro(true);
        } else {
            setIsPro(false);
        }

      } catch (error) {
        console.error("Failed to sync with Supabase:", error);
      } finally {
        setIsSyncing(false);
        setHasInitialSyncCompleted(true);
      }
    };
    fetchCloudData();
  }, [user, hasInitialSyncCompleted, isOnline]); 

  useEffect(() => {
    safeStorageSet('lethal_unitPref', unitPref);
  }, [unitPref]);

  const goToSetup = () => setCurrentView('setup');
  const goToProgress = () => setCurrentView('progress');
  const goToWeightTracker = () => setCurrentView('weightTracker');
  const goToExport = () => setCurrentView('export');
  const goToEditHub = () => setCurrentView('editHub');
  const goToEquipment = () => setCurrentView('equipment');
  
  const goToHome = () => { 
      setCurrentView('landing'); 
      setActiveDayId(null); 
      setEditSessionId(null);
  };
  
  const launchSession = (dayId) => { 
      setActiveDayId(dayId); 
      setEditSessionId(null); 
      setCurrentView('tracker'); 
  };

  const launchEditSession = (timestamp) => {
      setEditSessionId(timestamp);
      setCurrentView('tracker');
  };

  if (authLoading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center"><RefreshCw size={40} className="text-cyan-500 animate-spin" /></div>;
  }

  if (!user) {
    return <SupabaseAuth />;
  }

  if (isSyncing && currentView === 'landing' && globalHistory.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center font-sans">
        <RefreshCw size={40} className="text-cyan-500 animate-spin mb-4" />
        <h2 className="text-xl font-bold tracking-widest uppercase text-neutral-300">Syncing to Cloud</h2>
        <p className="text-neutral-500 text-sm mt-2">Pulling latest mesocycle data...</p>
      </div>
    );
  }

  let activeView;
  if (currentView === 'setup') activeView = <ProgramSetup user={user} program={program} setProgram={setProgram} blueprints={blueprints} setBlueprints={setBlueprints} onBack={goToHome} unitPref={unitPref} setUnitPref={setUnitPref} masterExercises={masterExercises} setMasterExercises={setMasterExercises} supabaseClient={supabaseClient} showAlert={showAlert} showConfirm={showConfirm} />;
  else if (currentView === 'progress') activeView = <ProgressHub globalHistory={globalHistory} blueprints={blueprints} onBack={goToHome} unitPref={unitPref} />;
  else if (currentView === 'weightTracker') activeView = <WeightTracker user={user} weightHistory={weightHistory} setWeightHistory={setWeightHistory} weightGoals={weightGoals} setWeightGoals={setWeightGoals} onBack={goToHome} unitPref={unitPref} supabaseClient={supabaseClient} showAlert={showAlert} showConfirm={showConfirm} />;
  else if (currentView === 'export') activeView = <ExportHub globalHistory={globalHistory} onBack={goToHome} unitPref={unitPref} showAlert={showAlert} />;
  else if (currentView === 'editHub') activeView = <EditLogHub globalHistory={globalHistory} onLaunchEdit={launchEditSession} onBack={goToHome} supabaseClient={supabaseClient} showAlert={showAlert} />;
  else if (currentView === 'equipment') activeView = <EquipmentProfile onBack={goToHome} unitPref={unitPref} showConfirm={showConfirm} />;
  else if (currentView === 'tracker') {
    let activeDayData = program.find(d => d.id === activeDayId);
    
    if (editSessionId) {
       const rows = globalHistory.filter(r => r.Timestamp === editSessionId);
       if (rows.length > 0) {
          activeDayData = {
             id: 'edit_mode',
             title: rows[0]['Day Title'],
             exercises: [] 
          };
       }
    } else if (activeDayId === 'freestyle') {
       activeDayData = {
           id: 'freestyle',
           title: 'Freestyle Workout',
           exercises: []
       };
    }

    if (!activeDayData) {
      setTimeout(goToHome, 0);
      activeView = null; 
    } else {
        activeView = (
          <TrackingApp 
            user={user}
            blueprintDay={activeDayData} 
            globalHistory={globalHistory} 
            editSessionId={editSessionId} 
            onBack={() => {
              if (editSessionId) setCurrentView('editHub');
              else goToHome();
            }} 
            unitPref={unitPref} 
            onWorkoutLogged={() => {
              // Only trigger a re-sync if we are actually online
              if (isOnline) {
                  setHasInitialSyncCompleted(false);
                  setIsSyncing(true);
              }
            }} 
            masterExercises={masterExercises}
            setMasterExercises={setMasterExercises}
            supabaseClient={supabaseClient}
            showAlert={showAlert}
            showConfirm={showConfirm}
            isOnline={isOnline}
          />
        );
    }
  }

  return (
    <React.Fragment>
      {!activeView && (
          <LandingPage 
            program={program} 
            cachedSession={cachedSession}
            onClearCache={handleClearCache}
            onLaunchSession={launchSession} 
            onLaunchSetup={goToSetup} 
            onLaunchProgress={goToProgress} 
            onLaunchWeightTracker={goToWeightTracker} 
            onLaunchExport={goToExport} 
            onLaunchEditHub={goToEditHub} 
            onLaunchEquipment={goToEquipment}
            onLaunchGuide={() => { setShowAppGuide(true); setTimeout(() => window.scrollTo(0,0), 10); }}
            onLaunchAbout={() => { setShowAbout(true); setTimeout(() => window.scrollTo(0,0), 10); }}
            showConfirm={showConfirm}
            isPro={isPro}
            user={user}
            isOnline={isOnline}
            onSignOut={() => {
                showConfirm("Are you sure you want to sign out?", "Sign Out", async () => {
                    safeStorageRemove('lethal_workout_cache');
                    setGlobalHistory([]);
                    setProgram([]);
                    setWeightHistory([]);
                    await supabaseClient.auth.signOut();
                });
            }}
          />
      )}
      {activeView}

      {showAppGuide && (
        <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 overflow-y-auto pb-24">
          <div className="p-4 md:p-8 max-w-md mx-auto mt-4">
            <button onClick={() => setShowAppGuide(false)} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
            <h2 className="text-2xl font-black text-white leading-tight mb-8">How to Use Lethal Lifts</h2>
            
            <div className="space-y-4">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2"><Settings size={20} /> 1. Program Management</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Before you can track a workout, you need to build your routine! Go to <strong>Program Management</strong> on the main menu to name your days and list out your specific exercises. The app will use this template to automatically generate your daily tracker.</p>
                <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                   <p className="text-cyan-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><LinkIcon size={16}/> Grouping Supersets</p>
                   <p className="text-neutral-400 text-sm leading-relaxed">Click the link icon next to any exercise to attach it to the one directly above it. In your active workout tracker, they will automatically merge into a single cohesive block so you can seamlessly log them back-to-back without scrolling.</p>
                </div>
                <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
                   <p className="text-purple-400 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Activity size={16}/> Target Rep Ranges</p>
                   <p className="text-neutral-400 text-sm leading-relaxed">Doing 5 reps on Tuesday and 15 reps on Friday? Tap the <strong>Reps: On</strong> toggle in your day header to add a target rep range to each exercise. It shows up as a "sticky note" in your active workout so you always know what phase you're in without cluttering your history.</p>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-emerald-400 font-bold text-lg mb-2 flex items-center gap-2"><Dumbbell size={20} /> Optional: Gym Inventory</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Head to the <strong>Equipment Manager</strong> from the main hub to inventory your custom barbells (EZ curl, trap bar, etc.) and your specific plate counts. The Plate Math calculator will then intelligently suggest plates based exactly on what you actually own!</p>
                <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                   <p className="text-emerald-500 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><CalculatorIcon size={16}/> Plate Math Calculator</p>
                   <p className="text-neutral-400 text-sm leading-relaxed"><em>Hate doing math? Me too. That's why I've added the Plate calculator at the top of your active session to do the math so you don't have to.</em></p>
                </div>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-cyan-400 font-bold text-lg mb-2 flex items-center gap-2"><TimerIcon size={20} /> 2. The Isometric Timer</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">The timer at the top of your active session isn't meant for standard sets. Its primary purpose is to provide a hands-free countdown for <strong>isometric exercises</strong> (so you don't need a separate stopwatch). Once the hold finishes, it rolls over to count total workout duration.</p>
                <div className="mt-4 p-4 bg-neutral-950 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.05)]">
                   <p className="text-yellow-500 text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2"><Settings size={16}/> Program Manager Toggle</p>
                   <p className="text-neutral-400 text-sm leading-relaxed">While building your routine in the Program Manager, you'll see a <strong>Timer</strong> button next to your day titles. If a workout day doesn't involve any timed isometric holds, you can toggle this off so the timer doesn't automatically show up and clutter your screen!</p>
                </div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2"><Save size={20} /> 3. Saving & Fixing Mistakes</h3>
                <p className="text-neutral-400 text-sm leading-relaxed">Use <strong>Quick Save</strong> to temporarily cache your sets if you need to close the app mid-workout. When you finish, press <strong>Log Workout</strong> to permanently upload it to the cloud. If you make a typo, use <strong>Edit Logs</strong> from the main menu to reopen a past session and safely fix it.</p>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-purple-400 font-bold text-lg mb-2 flex items-center gap-2"><TrendingUp size={20} /> 4. Tracking Progress</h3>
                <ul className="text-neutral-400 text-sm leading-relaxed space-y-3 mt-4">
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0"></div><span><strong>Progress Hub:</strong> Automatically calculates and charts your Total Volume (Weight × Reps) so you can visualize progressive overload.</span></li>
                  <li className="flex items-start gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0"></div><span><strong>Body Metrics:</strong> A cloud weight tracker. Set a goal, and it will calculate if you are ahead or behind your expected target date.</span></li>
                </ul>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg">
                <h3 className="text-indigo-400 font-bold text-lg mb-2 flex items-center gap-2">
                    <Clipboard size={20} /> 5. Exporting Sessions
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                    The <strong>Export to Coach</strong> function exists solely to easily share your raw session data with a coach or training partner. It was specifically formatted for smooth intake into an AI coach, but it works perfectly for human coaches too—or you can just ignore it completely!
                </p>
              </div>
            </div>
            <button onClick={() => setShowAppGuide(false)} className="w-full mt-8 bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-600/25 text-white font-bold py-5 rounded-2xl transition-all">Got it, let's lift!</button>
          </div>
        </div>
      )}

      {showAbout && (
        <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-sm z-50 overflow-y-auto pb-24">
          <div className="p-4 md:p-8 max-w-md mx-auto mt-4">
            <button onClick={() => setShowAbout(false)} className="flex items-center gap-2 text-neutral-400 hover:text-white mb-6 transition-colors w-fit"><ArrowLeft size={20} /> Back to Hub</button>
            <h2 className="text-2xl font-black text-white leading-tight mb-8">The Story Behind Lethal Lifts</h2>
            
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl shadow-lg text-neutral-300 text-sm leading-relaxed space-y-4">
              
              <div className="w-full h-64 bg-neutral-900 rounded-xl flex items-center justify-center overflow-hidden border border-neutral-800 mb-6 shadow-md relative group">
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent z-10"></div>
                  <img 
                      src="ProfilePic.png" 
                      alt="Chef Lethal" 
                      className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => { e.target.onerror = null; e.target.src = "App.Logo.png"; }}
                  />
              </div>

              <p><strong className="text-white text-base">Hey, I'm Chef Lethal.</strong></p>
              
              <p>For years, I tracked my garage gym sessions the old-school way: scribbling in notebooks and eventually battling with clunky spreadsheets on my phone between sets. I always wanted something more dynamic, fast, and user-friendly—something that actually matched the intensity of a time-compressed workout without getting in the way.</p>
              
              <p>When I couldn't find exactly what I needed, I built Lethal Lifts.</p>
              
              <h3 className="text-white font-bold text-base mt-6">A Quick Heads-Up</h3>
              <p>This app isn't a virtual coach, and it isn't designed for day-one beginners. It won't build a routine for you or tell you how to train. Lethal Lifts is a pure tracking engine built for lifters who already know their split, know their exercises, and just need a fast, cloud-connected way to track volume and progressive overload. You bring the blueprint; the app handles the math.</p>
              
              <h3 className="text-white font-bold text-base mt-6">Help Shape the App</h3>
              <div className="bg-neutral-950 rounded-2xl p-4 border border-neutral-800 mb-6">
                  <p className="text-sm text-neutral-400">
                      Found a bug or have a feature request? Shoot an email to <a href="mailto:cheflethallifts@gmail.com?subject=Lethal%20Lifts%20Feedback" className="hover:opacity-80 transition-opacity"><strong className="text-white">cheflethallifts@gmail.com</strong></a> or check out the dedicated discord channel for real-time feedback: <a href="https://discord.gg/HZsPJsEHnK" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline font-medium transition-colors">Join the Discord</a>.
                  </p>
              </div>
              
              <p className="font-bold text-white pt-2">Get after it.</p>

            </div>
          </div>
        </div>
      )}

      <FeedbackModal config={modalConfig} onClose={() => setModalConfig(null)} />
    </React.Fragment>
  );
}

export default App;