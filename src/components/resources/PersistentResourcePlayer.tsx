"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { Music2, Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { resourceUrl, type ResourceFile } from "@/components/resources/types";

type Playback = {
  file: ResourceFile | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  volume: number;
  repeat: boolean;
  repeatDelay: number;
  selectFile: (file: ResourceFile) => void;
  togglePlay: () => Promise<void>;
  skip: (seconds: number) => void;
  seek: (seconds: number) => void;
  setSpeed: (speed: number) => void;
  setVolume: (volume: number) => void;
  setRepeat: (repeat: boolean) => void;
  setRepeatDelay: (seconds: number) => void;
  setInlineMounted: (mounted: boolean) => void;
  stop: () => void;
};

const PlaybackContext = createContext<Playback | null>(null);

export function useResourcePlayback() {
  const playback = useContext(PlaybackContext);
  if (!playback) throw new Error("Resource player requires PersistentResourcePlayer.");
  return playback;
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

function FloatingAudioBar() {
  const {
    file, playing, currentTime, duration, speed, repeat, togglePlay,
    skip, seek, setSpeed, setRepeat, stop,
  } = useResourcePlayback();
  const pathname = usePathname();
  // Hide the compact controls only while the full inline player is on screen.
  const { inlineMounted } = useInlinePlayerVisibility();
  if (!file || inlineMounted) return null;

  return (
    <div
      role="region"
      aria-label="Lecteur audio de la chorale"
      className="fixed bottom-3 left-3 right-3 z-[80] mx-auto max-w-[700px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-900/20 sm:bottom-5 sm:p-4"
    >
      <div className="flex min-w-0 items-center gap-3">
        <Music2 size={20} className="shrink-0 text-[#687a5e]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">{file.title || file.originalFilename}</p>
          <p className="text-[11px] text-slate-500">{formatTime(currentTime)} / {formatTime(duration)}</p>
        </div>
        <button type="button" onClick={() => skip(-10)} aria-label="Reculer de 10 secondes" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><RotateCcw size={17} /></button>
        <button type="button" onClick={() => void togglePlay()} aria-label={playing ? "Pause" : "Lecture"} className="rounded-full bg-[#687a5e] p-3 text-white hover:bg-[#596950]">
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
        </button>
        <button type="button" onClick={() => skip(10)} aria-label="Avancer de 10 secondes" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"><RotateCw size={17} /></button>
        <button type="button" onClick={stop} aria-label="Fermer le lecteur" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <input aria-label="Position dans le morceau" type="range" min={0} max={duration || 1} step="0.1" value={Math.min(currentTime, duration || 1)} onChange={(event) => seek(Number(event.target.value))} className="min-w-0 flex-1 accent-[#687a5e]" />
        <select aria-label="Vitesse de lecture" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded-md border border-slate-200 bg-white px-1 py-1 text-xs text-slate-600">
          {[0.75, 1, 1.25, 1.5].map((value) => <option key={value} value={value}>{value}×</option>)}
        </select>
        <label className="inline-flex items-center gap-1 text-xs text-slate-600"><input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} className="accent-[#687a5e]" /> Répéter</label>
      </div>
      {pathname !== "/membre/ressources" && <p className="mt-1 text-[10px] text-slate-400">Lecture en cours pendant la navigation</p>}
    </div>
  );
}

// The floating bar and inline player use the same provider, not separate audio elements.
const InlineVisibilityContext = createContext(false);
function useInlinePlayerVisibility() {
  return { inlineMounted: useContext(InlineVisibilityContext) };
}

export function PersistentResourcePlayer({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const currentId = useRef<string | null>(null);
  const repeatTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [file, setFile] = useState<ResourceFile | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, changeSpeed] = useState(1);
  const [volume, changeVolume] = useState(1);
  const [repeat, changeRepeat] = useState(false);
  const [repeatDelay, changeRepeatDelay] = useState(0);
  const [inlineMounted, setInlineMounted] = useState(false);

  const clearTimeoutIfAny = useCallback(() => {
    if (repeatTimeout.current !== null) {
      clearTimeout(repeatTimeout.current);
      repeatTimeout.current = null;
    }
  }, []);

  const selectFile = useCallback((nextFile: ResourceFile) => {
    if (currentId.current === nextFile.id) return;
    currentId.current = nextFile.id;
    clearTimeoutIfAny();
    audioRef.current?.pause();
    setFile(nextFile);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [clearTimeoutIfAny]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.load();
    audio.playbackRate = speed;
    audio.volume = volume;
  }, [file?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);
  useEffect(() => () => clearTimeoutIfAny(), [clearTimeoutIfAny]);

  const togglePlay = useCallback(async () => {
    clearTimeoutIfAny();
    const audio = audioRef.current;
    if (!audio || !currentId.current) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    try { await audio.play(); } catch { setPlaying(false); }
  }, [clearTimeoutIfAny]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || 0));
    setCurrentTime(audio.currentTime);
  }, []);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    seek(audio.currentTime + seconds);
  }, [seek]);

  const setRepeat = useCallback((next: boolean) => {
    clearTimeoutIfAny();
    changeRepeat(next);
  }, [clearTimeoutIfAny]);

  const stop = useCallback(() => {
    clearTimeoutIfAny();
    audioRef.current?.pause();
    currentId.current = null;
    setFile(null);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [clearTimeoutIfAny]);

  const value: Playback = {
    file, playing, currentTime, duration, speed, volume, repeat, repeatDelay,
    selectFile, togglePlay, skip, seek, setSpeed: changeSpeed,
    setVolume: changeVolume, setRepeat, setRepeatDelay: changeRepeatDelay,
    setInlineMounted, stop,
  };

  function onAudioEnded() {
    setPlaying(false);
    if (!repeat) return;
    clearTimeoutIfAny();
    const audio = audioRef.current;
    const endedId = currentId.current;
    if (!audio || !endedId) return;
    repeatTimeout.current = setTimeout(() => {
      repeatTimeout.current = null;
      if (currentId.current !== endedId || audioRef.current !== audio) return;
      audio.currentTime = 0;
      void audio.play().catch(() => setPlaying(false));
    }, repeatDelay * 1000);
  }

  return (
    <PlaybackContext.Provider value={value}>
      <InlineVisibilityContext.Provider value={inlineMounted}>
        <audio
          ref={audioRef}
          src={file ? resourceUrl(file) : undefined}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={onAudioEnded}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(Number.isFinite(event.currentTarget.duration) ? event.currentTarget.duration : 0)}
        />
        {children}
        <FloatingAudioBar />
      </InlineVisibilityContext.Provider>
    </PlaybackContext.Provider>
  );
}
