"use client";

import {
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Volume2,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  resourceUrl,
  type ResourceFile,
} from "@/components/resources/types";

function formatTime(
  seconds: number,
) {
  if (
    !Number.isFinite(seconds)
  ) {
    return "0:00";
  }

  const minutes =
    Math.floor(
      seconds / 60,
    );

  const remaining =
    Math.floor(
      seconds % 60,
    );

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

export function ResourceAudioPlayer({
  file,
}: {
  file: ResourceFile;
}) {
  const audioRef =
    useRef<HTMLAudioElement>(
      null,
    );

  const [
    playing,
    setPlaying,
  ] = useState(false);

  const [
    currentTime,
    setCurrentTime,
  ] = useState(0);

  const [
    duration,
    setDuration,
  ] = useState(0);

  const [
    speed,
    setSpeed,
  ] = useState(1);

  const [
    volume,
    setVolume,
  ] = useState(1);

  useEffect(() => {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    audio.pause();
    audio.load();

    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [file.id]);

  useEffect(() => {
    if (
      audioRef.current
    ) {
      audioRef.current.playbackRate =
        speed;
    }
  }, [speed]);

  useEffect(() => {
    if (
      audioRef.current
    ) {
      audioRef.current.volume =
        volume;
    }
  }, [volume]);

  async function togglePlay() {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        return;
      }
    } else {
      audio.pause();
    }
  }

  function skip(
    seconds: number,
  ) {
    const audio =
      audioRef.current;

    if (!audio) {
      return;
    }

    const next =
      Math.max(
        0,
        Math.min(
          audio.currentTime +
            seconds,
          audio.duration || 0,
        ),
      );

    audio.currentTime =
      next;
  }

  return (
    <div className="w-full">
      <audio
        ref={audioRef}
        src={resourceUrl(
          file,
        )}
        preload="metadata"
        onPlay={() =>
          setPlaying(true)
        }
        onPause={() =>
          setPlaying(false)
        }
        onEnded={() =>
          setPlaying(false)
        }
        onTimeUpdate={(
          event,
        ) =>
          setCurrentTime(
            event
              .currentTarget
              .currentTime,
          )
        }
        onLoadedMetadata={(
          event,
        ) =>
          setDuration(
            Number.isFinite(
              event
                .currentTarget
                .duration,
            )
              ? event
                  .currentTarget
                  .duration
              : 0,
          )
        }
      />

      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() =>
            skip(-10)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#77736b] transition hover:bg-[#efede7]"
          aria-label="Reculer de 10 secondes"
        >
          <RotateCcw
            size={18}
          />
        </button>

        <button
          type="button"
          onClick={() =>
            void togglePlay()
          }
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#687a5e] text-white transition hover:bg-[#596950]"
          aria-label={
            playing
              ? "Pause"
              : "Lecture"
          }
        >
          {playing ? (
            <Pause
              size={23}
              fill="currentColor"
            />
          ) : (
            <Play
              size={23}
              fill="currentColor"
              className="ml-0.5"
            />
          )}
        </button>

        <button
          type="button"
          onClick={() =>
            skip(10)
          }
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#77736b] transition hover:bg-[#efede7]"
          aria-label="Avancer de 10 secondes"
        >
          <RotateCw
            size={18}
          />
        </button>
      </div>

      <div className="mt-5">
        <input
          type="range"
          min={0}
          max={
            duration || 1
          }
          step="0.1"
          value={
            Math.min(
              currentTime,
              duration || 1,
            )
          }
          onChange={(
            event,
          ) => {
            const value =
              Number(
                event.target
                  .value,
              );

            if (
              audioRef.current
            ) {
              audioRef.current.currentTime =
                value;
            }

            setCurrentTime(
              value,
            );
          }}
          className="w-full accent-[#687a5e]"
        />

        <div className="mt-1 flex justify-between text-[11px] font-medium text-[#99958d]">
          <span>
            {formatTime(
              currentTime,
            )}
          </span>

          <span>
            {formatTime(
              duration,
            )}
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1">
          {[
            0.75,
            1,
            1.25,
            1.5,
          ].map(
            (value) => (
              <button
                key={value}
                type="button"
                onClick={() =>
                  setSpeed(
                    value,
                  )
                }
                className={`rounded-lg px-2.5 py-1.5 text-xs font-bold transition ${
                  speed ===
                  value
                    ? "bg-[#687a5e] text-white"
                    : "text-[#77736b] hover:bg-[#efede7]"
                }`}
              >
                {value}×
              </button>
            ),
          )}
        </div>

        <div className="flex items-center gap-2">
          <Volume2
            size={16}
            className="text-[#8a867d]"
          />

          <input
            type="range"
            min={0}
            max={1}
            step="0.05"
            value={volume}
            onChange={(
              event,
            ) =>
              setVolume(
                Number(
                  event.target
                    .value,
                ),
              )
            }
            className="w-24 accent-[#687a5e]"
          />
        </div>
      </div>
    </div>
  );
}