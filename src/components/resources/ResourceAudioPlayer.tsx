"use client";

import { Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import { useEffect } from "react";
import { useResourcePlayback } from "@/components/resources/PersistentResourcePlayer";
import type { ResourceFile } from "@/components/resources/types";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

export function ResourceAudioPlayer({ file }: { file: ResourceFile }) {
  const {
    file: activeFile, selectFile, playing, currentTime, duration,
    speed, volume, repeat, repeatDelay, togglePlay, skip, seek,
    setSpeed, setVolume, setRepeat, setRepeatDelay, setInlineMounted,
  } = useResourcePlayback();

  useEffect(() => {
    selectFile(file);
  }, [file.id, selectFile]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setInlineMounted(true);
    return () => setInlineMounted(false);
  }, [setInlineMounted]);

  const selected = activeFile?.id === file.id;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-5">
        <button type="button" onClick={() => skip(-10)} disabled={!selected}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#77736b] transition hover:bg-[#efede7] disabled:opacity-40"
          aria-label="Reculer de 10 secondes"><RotateCcw size={18} /></button>
        <button type="button" onClick={() => void togglePlay()} disabled={!selected}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#687a5e] text-white transition hover:bg-[#596950] disabled:opacity-40"
          aria-label={playing ? "Pause" : "Lecture"}>
          {playing ? <Pause size={23} fill="currentColor" /> : <Play size={23} fill="currentColor" className="ml-0.5" />}
        </button>
        <button type="button" onClick={() => skip(10)} disabled={!selected}
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#77736b] transition hover:bg-[#efede7] disabled:opacity-40"
          aria-label="Avancer de 10 secondes"><RotateCw size={18} /></button>
      </div>
      <div className="mt-5">
        <input aria-label="Position dans le morceau" type="range" min={0} max={duration || 1} step="0.1"
          value={selected ? Math.min(currentTime, duration || 1) : 0}
          onChange={(event) => seek(Number(event.target.value))} disabled={!selected}
          className="w-full accent-[#687a5e]" />
        <div className="mt-1 flex justify-between text-[11px] font-medium text-[#99958d]">
          <span>{formatTime(selected ? currentTime : 0)}</span>
          <span>{formatTime(selected ? duration : 0)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#77736b]">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input type="checkbox" checked={repeat} onChange={(event) => setRepeat(event.target.checked)} className="accent-[#687a5e]" /> Répéter
        </label>
        {repeat && <label className="inline-flex items-center gap-2">Pause entre deux lectures
          <select value={repeatDelay} onChange={(event) => setRepeatDelay(Number(event.target.value))}
            className="rounded-md border border-[#ddd9cf] bg-white px-2 py-1">
            {[0, 3, 5, 10].map((seconds) => <option key={seconds} value={seconds}>{seconds} s</option>)}
          </select>
        </label>}
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {[0.75, 1, 1.25, 1.5].map((value) => (
            <button key={value} type="button" onClick={() => setSpeed(value)}
              className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${speed === value ? "bg-[#687a5e] text-white" : "text-[#77736b] hover:bg-[#efede7]"}`}>
              {value}×
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Volume2 size={16} className="text-[#8a867d]" />
          <input aria-label="Volume" type="range" min={0} max={1} step="0.05" value={volume}
            onChange={(event) => setVolume(Number(event.target.value))} className="w-24 accent-[#687a5e]" />
        </div>
      </div>
    </div>
  );
}
