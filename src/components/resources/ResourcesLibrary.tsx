"use client";

import {
  ArrowLeft,
  Download,
  FileAudio,
  FileText,
  LoaderCircle,
  Music2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ResourceAudioPlayer,
} from "@/components/resources/ResourceAudioPlayer";

import {
  downloadUrl,
  formatFileSize,
  resourceUrl,
  type ResourceFile,
  type ResourcesResponse,
  type Song,
} from "@/components/resources/types";

import { NotifyMembersField } from "@/components/notifications/NotifyMembersField";
import { publishMemberUpdate } from "@/lib/publish-member-update";

type ApiMessage = {
  message?: string;
  error?: string;
};

type SongCreateResponse =
  ApiMessage & {
    id?: string;
  };

type UploadTicketResponse =
  ApiMessage & {
    uploadUrl?: string;
  };

type UploadKind =
  | "audio"
  | "score";

type MobilePane =
  | "songs"
  | "song"
  | "partition";

const ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(
    "",
  );

function fileStem(
  filename: string,
) {
  return filename
    .replace(
      /\.[^.]+$/,
      "",
    )
    .trim();
}

function fileLabel(
  file: ResourceFile,
) {
  return (
    fileStem(
      file.originalFilename,
    ) ||
    file.title
  );
}

function initialLetter(
  value: string,
) {
  const normalized =
    value
      .normalize("NFD")
      .replace(
        /\p{Diacritic}/gu,
        "",
      )
      .trim()
      .toUpperCase();

  const first =
    normalized.charAt(0);

  return /^[A-Z]$/.test(
    first,
  )
    ? first
    : "#";
}

export function ResourcesLibrary() {
  const [
    data,
    setData,
  ] =
    useState<ResourcesResponse | null>(
      null,
    );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    activeLetter,
    setActiveLetter,
  ] = useState<
    string | null
  >(null);

  const [
    selectedSongId,
    setSelectedSongId,
  ] = useState<
    string | null
  >(null);

  const [
    selectedAudioId,
    setSelectedAudioId,
  ] = useState<
    string | null
  >(null);

  const [
    selectedPartitionId,
    setSelectedPartitionId,
  ] = useState<
    string | null
  >(null);

  const [
    mobilePane,
    setMobilePane,
  ] =
    useState<MobilePane>(
      "songs",
    );

  const [
    createOpen,
    setCreateOpen,
  ] = useState(false);

  const [
    editOpen,
    setEditOpen,
  ] = useState(false);

  const [
    uploadKind,
    setUploadKind,
  ] =
    useState<UploadKind | null>(
      null,
    );

  const [
    deleting,
    setDeleting,
  ] = useState<
    string | null
  >(null);

  const canManage =
    data?.canManage ??
    false;

  async function load(
    preferredSongId?: string,
  ) {
    try {
      setError("");

      const response =
        await fetch(
          "/api/member/resources",
          {
            cache:
              "no-store",
          },
        );

      const result =
        (await response.json()) as
          ResourcesResponse &
          ApiMessage;

      if (!response.ok) {
        throw new Error(
          result.message ??
            result.error ??
            "Impossible de charger le répertoire.",
        );
      }

      setData(result);

      if (
        preferredSongId &&
        result.songs.some(
          (song) =>
            song.id ===
            preferredSongId,
        )
      ) {
        setSelectedSongId(
          preferredSongId,
        );
      }
    } catch (reason) {
      setError(
        reason instanceof
          Error
          ? reason.message
          : "Impossible de charger le répertoire.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const songs =
    data?.songs ?? [];

  const filteredSongs =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return songs.filter(
        (song) => {
          const matchesSearch =
            !query ||
            song.title
              .toLowerCase()
              .includes(
                query,
              ) ||
            (
              song.composer ??
              ""
            )
              .toLowerCase()
              .includes(
                query,
              );

          const matchesLetter =
            !activeLetter ||
            initialLetter(
              song.title,
            ) ===
              activeLetter;

          return (
            matchesSearch &&
            matchesLetter
          );
        },
      );
    }, [
      songs,
      search,
      activeLetter,
    ]);

  const availableLetters =
    useMemo(
      () =>
        new Set(
          songs.map(
            (song) =>
              initialLetter(
                song.title,
              ),
          ),
        ),
      [songs],
    );

  const selectedSong =
    songs.find(
      (song) =>
        song.id ===
        selectedSongId,
    ) ?? null;

  const audios =
    useMemo(
      () =>
        selectedSong?.files.filter(
          (file) =>
            file.kind ===
            "audio",
        ) ?? [],
      [selectedSong],
    );

  const partitions =
    useMemo(
      () =>
        selectedSong?.files.filter(
          (file) =>
            file.kind ===
            "score",
        ) ?? [],
      [selectedSong],
    );

  useEffect(() => {
    if (
      audios.length ===
      0
    ) {
      setSelectedAudioId(
        null,
      );

      return;
    }

    setSelectedAudioId(
      (current) => {
        if (
          current &&
          audios.some(
            (audio) =>
              audio.id ===
              current,
          )
        ) {
          return current;
        }

        return audios[0].id;
      },
    );
  }, [audios]);

  const selectedAudio =
    audios.find(
      (audio) =>
        audio.id ===
        selectedAudioId,
    ) ?? null;

  const selectedPartition =
    partitions.find(
      (partition) =>
        partition.id ===
        selectedPartitionId,
    ) ?? null;

  function openSong(
    song: Song,
  ) {
    setSelectedSongId(
      song.id,
    );

    setSelectedAudioId(
      null,
    );

    setSelectedPartitionId(
      null,
    );

    setMobilePane(
      "song",
    );
  }

  function closeSong() {
    setSelectedSongId(
      null,
    );

    setSelectedAudioId(
      null,
    );

    setSelectedPartitionId(
      null,
    );

    setMobilePane(
      "songs",
    );
  }

  function openPartition(
    partition: ResourceFile,
  ) {
    setSelectedPartitionId(
      partition.id,
    );

    setMobilePane(
      "partition",
    );
  }

  function closePartition() {
    setSelectedPartitionId(
      null,
    );

    setMobilePane(
      "song",
    );
  }

  async function deleteSong(
    song: Song,
  ) {
    if (
      !window.confirm(
        `Supprimer « ${song.title} » ?`,
      )
    ) {
      return;
    }

    setDeleting(
      song.id,
    );

    try {
      const response =
        await fetch(
          "/api/member/resources/songs",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id: song.id,
              }),
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as ApiMessage;

      if (!response.ok) {
        throw new Error(
          result.message ??
            result.error ??
            "Impossible de supprimer le morceau.",
        );
      }

      closeSong();

      await load();
    } catch (reason) {
      window.alert(
        reason instanceof
          Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setDeleting(
        null,
      );
    }
  }

  async function deleteFile(
    file: ResourceFile,
  ) {
    if (
      !window.confirm(
        `Supprimer « ${fileLabel(
          file,
        )} » ?`,
      )
    ) {
      return;
    }

    setDeleting(
      file.id,
    );

    try {
      const response =
        await fetch(
          "/api/member/resources/files",
          {
            method:
              "DELETE",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id: file.id,
              }),
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as ApiMessage;

      if (!response.ok) {
        throw new Error(
          result.message ??
            result.error ??
            "Impossible de supprimer le fichier.",
        );
      }

      if (
        file.id ===
        selectedPartitionId
      ) {
        closePartition();
      }

      if (
        file.id ===
        selectedAudioId
      ) {
        setSelectedAudioId(
          null,
        );
      }

      await load(
        selectedSongId ??
          undefined,
      );
    } catch (reason) {
      window.alert(
        reason instanceof
          Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setDeleting(
        null,
      );
    }
  }

  const desktopColumns =
    !selectedSong
      ? "lg:grid-cols-[minmax(0,1fr)_0px_0px]"
      : selectedPartition
        ? "lg:grid-cols-[340px_minmax(420px,0.9fr)_minmax(480px,1.1fr)]"
        : "lg:grid-cols-[360px_minmax(0,1fr)_0px]";

  const mobileTranslation =
    mobilePane ===
    "songs"
      ? "translate-x-0"
      : mobilePane ===
        "song"
      ? "translate-x-[-33.333333%]"
      : "translate-x-[-66.666667%]";

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center gap-3 text-sm text-slate-500">
        <LoaderCircle
          size={20}
          className="animate-spin"
        />

        Chargement…
      </div>
    );
  }

  return (
    <>
      <main className="w-full">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            <span className="font-semibold text-slate-900">
              {songs.length}
            </span>{" "}
            morceau{songs.length > 1 ? "x" : ""}
          </p>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                setCreateOpen(true)
              }
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Plus size={16} />
              Ajouter un morceau
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="h-[calc(100dvh-10rem)] min-h-[600px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div
            className={`flex h-full w-[300%] transition-transform duration-200 ease-out lg:grid lg:w-full lg:translate-x-0 lg:transition-[grid-template-columns] ${mobileTranslation} ${desktopColumns}`}
          >
            {/* Songs */}
            <section
              className={`h-full w-1/3 shrink-0 overflow-hidden bg-white lg:w-auto ${
                selectedSong
                  ? "lg:border-r lg:border-slate-200"
                  : ""
              }`}
            >
              <div className="border-b border-slate-200 p-4">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(event) => {
                      setSearch(
                        event.target.value,
                      );

                      setActiveLetter(
                        null,
                      );
                    }}
                    placeholder="Rechercher un morceau…"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveLetter(null)
                    }
                    className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-semibold transition ${
                      activeLetter === null
                        ? "bg-slate-900 text-white"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    Tous
                  </button>

                  {ALPHABET.map(
                    (letter) => {
                      const available =
                        availableLetters.has(
                          letter,
                        );

                      return (
                        <button
                          key={letter}
                          type="button"
                          disabled={!available}
                          onClick={() =>
                            setActiveLetter(
                              letter,
                            )
                          }
                          className={`shrink-0 rounded-md px-2 py-1 text-[11px] font-semibold transition ${
                            activeLetter ===
                            letter
                              ? "bg-slate-900 text-white"
                              : available
                                ? "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                : "cursor-default text-slate-200"
                          }`}
                        >
                          {letter}
                        </button>
                      );
                    },
                  )}
                </div>
              </div>

              {!selectedSong && (
                <div className="hidden grid-cols-[minmax(0,1.5fr)_minmax(160px,0.7fr)_90px_100px] border-b border-slate-200 bg-slate-50 px-5 py-2.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 sm:grid">
                  <span>
                    Morceau
                  </span>

                  <span>
                    Compositeur
                  </span>

                  <span className="text-center">
                    Fichiers
                  </span>

                  <span>
                    Modifié
                  </span>
                </div>
              )}

              <div
                className={
                  selectedSong
                    ? "h-[calc(100%-109px)] overflow-y-auto"
                    : "h-[calc(100%-150px)] overflow-y-auto"
                }
              >
                {filteredSongs.length ===
                0 ? (
                  <div className="flex h-48 items-center justify-center px-6 text-center">
                    <div>
                      <Music2
                        size={26}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Aucun morceau trouvé
                      </p>
                    </div>
                  </div>
                ) : (
                  filteredSongs.map(
                    (song) => {
                      const selected =
                        selectedSongId ===
                        song.id;

                      const audioCount =
                        song.files.filter(
                          (file) =>
                            file.kind ===
                            "audio",
                        ).length;

                      const scoreCount =
                        song.files.filter(
                          (file) =>
                            file.kind ===
                            "score",
                        ).length;

                      if (!selectedSong) {
                        return (
                          <button
                            key={song.id}
                            type="button"
                            onClick={() =>
                              openSong(song)
                            }
                            className="group w-full border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 sm:grid sm:grid-cols-[minmax(0,1.5fr)_minmax(160px,0.7fr)_90px_100px] sm:items-center sm:px-5"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-blue-50 group-hover:text-blue-600">
                                <Music2
                                  size={15}
                                />
                              </span>

                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-slate-900">
                                  {song.title}
                                </span>

                                <span className="mt-0.5 block truncate text-xs text-slate-500 sm:hidden">
                                  {song.composer ??
                                    "Compositeur non renseigné"}
                                </span>
                              </span>
                            </span>

                            <span className="hidden truncate text-sm text-slate-500 sm:block">
                              {song.composer ??
                                "—"}
                            </span>

                            <span className="mt-2 flex items-center gap-2 text-xs text-slate-500 sm:mt-0 sm:justify-center">
                              {audioCount >
                                0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FileAudio
                                    size={13}
                                  />
                                  {
                                    audioCount
                                  }
                                </span>
                              )}

                              {scoreCount >
                                0 && (
                                <span className="inline-flex items-center gap-1">
                                  <FileText
                                    size={13}
                                  />
                                  {
                                    scoreCount
                                  }
                                </span>
                              )}

                              {audioCount ===
                                0 &&
                                scoreCount ===
                                  0 &&
                                "—"}
                            </span>

                            <span className="hidden text-xs text-slate-400 sm:block">
                              {new Intl.DateTimeFormat(
                                "fr-FR",
                                {
                                  day: "2-digit",
                                  month:
                                    "short",
                                },
                              ).format(
                                new Date(
                                  song.updatedAt,
                                ),
                              )}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() =>
                            openSong(song)
                          }
                          className={`flex w-full items-center gap-3 border-b border-slate-100 px-3 py-3 text-left transition ${
                            selected
                              ? "bg-blue-50"
                              : "hover:bg-slate-50"
                          }`}
                        >
                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                              selected
                                ? "bg-blue-100 text-blue-700"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            <Music2
                              size={15}
                            />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate text-sm font-semibold ${
                                selected
                                  ? "text-blue-950"
                                  : "text-slate-900"
                              }`}
                            >
                              {song.title}
                            </span>

                            <span className="mt-0.5 block truncate text-xs text-slate-500">
                              {song.composer ??
                                "—"}
                            </span>
                          </span>
                        </button>
                      );
                    },
                  )
                )}
              </div>
            </section>

            {/* Song details */}
            <section
              className={`h-full w-1/3 shrink-0 overflow-hidden bg-white lg:w-auto ${
                selectedPartition
                  ? "lg:border-r lg:border-slate-200"
                  : ""
              }`}
            >
              {selectedSong && (
                <div className="flex h-full flex-col">
                  <header className="flex min-h-[72px] shrink-0 items-center gap-2 border-b border-slate-200 px-4">
                    <button
                      type="button"
                      onClick={closeSong}
                      className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ArrowLeft
                        size={15}
                      />

                      <span className="lg:hidden">
                        Répertoire
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-semibold text-slate-950">
                        {
                          selectedSong.title
                        }
                      </h2>

                      <p className="mt-0.5 truncate text-xs text-slate-500">
                        {selectedSong.composer ??
                          "Compositeur non renseigné"}
                      </p>
                    </div>

                    {canManage && (
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setEditOpen(
                              true,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                          aria-label="Modifier le morceau"
                          title="Modifier"
                        >
                          <Pencil
                            size={15}
                          />
                        </button>

                        <button
                          type="button"
                          disabled={
                            deleting ===
                            selectedSong.id
                          }
                          onClick={() =>
                            void deleteSong(
                              selectedSong,
                            )
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          aria-label="Supprimer le morceau"
                          title="Supprimer"
                        >
                          <Trash2
                            size={15}
                          />
                        </button>
                      </div>
                    )}
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 p-4 sm:p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileAudio
                            size={15}
                          />

                          <span className="text-xs font-medium">
                            Audio
                          </span>
                        </div>

                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {audios.length}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-3.5">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FileText
                            size={15}
                          />

                          <span className="text-xs font-medium">
                            Partitions
                          </span>
                        </div>

                        <p className="mt-2 text-xl font-semibold text-slate-950">
                          {
                            partitions.length
                          }
                        </p>
                      </div>
                    </div>

                    <section className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <div>
                          <h3 className="text-sm font-semibold text-slate-900">
                            Fichiers audio
                          </h3>
                        </div>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              setUploadKind(
                                "audio",
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            <Plus
                              size={14}
                            />
                            Ajouter
                          </button>
                        )}
                      </div>

                      {audios.length ===
                      0 ? (
                        <div className="px-4 py-8 text-center">
                          <FileAudio
                            size={24}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-2 text-sm text-slate-500">
                            Aucun fichier audio
                          </p>
                        </div>
                      ) : (
                        <div className="p-4">
                          {audios.length >
                            1 && (
                            <div className="mb-4 flex flex-wrap gap-2">
                              {audios.map(
                                (
                                  audio,
                                ) => (
                                  <button
                                    key={
                                      audio.id
                                    }
                                    type="button"
                                    onClick={() =>
                                      setSelectedAudioId(
                                        audio.id,
                                      )
                                    }
                                    className={`max-w-full truncate rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                                      selectedAudioId ===
                                      audio.id
                                        ? "border-slate-900 bg-slate-900 text-white"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                                    }`}
                                  >
                                    {fileLabel(
                                      audio,
                                    )}
                                  </button>
                                ),
                              )}
                            </div>
                          )}

                          {selectedAudio && (
                            <div>
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="min-w-0 truncate text-sm font-medium text-slate-700">
                                  {fileLabel(
                                    selectedAudio,
                                  )}
                                </p>

                                {canManage && (
                                  <button
                                    type="button"
                                    disabled={
                                      deleting ===
                                      selectedAudio.id
                                    }
                                    onClick={() =>
                                      void deleteFile(
                                        selectedAudio,
                                      )
                                    }
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                                    aria-label="Supprimer le fichier audio"
                                  >
                                    <Trash2
                                      size={14}
                                    />
                                  </button>
                                )}
                              </div>

                              <ResourceAudioPlayer
                                file={
                                  selectedAudio
                                }
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </section>

                    <section className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
                      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                        <h3 className="text-sm font-semibold text-slate-900">
                          Partitions
                        </h3>

                        {canManage && (
                          <button
                            type="button"
                            onClick={() =>
                              setUploadKind(
                                "score",
                              )
                            }
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                          >
                            <Plus
                              size={14}
                            />
                            Ajouter
                          </button>
                        )}
                      </div>

                      {partitions.length ===
                      0 ? (
                        <div className="px-4 py-8 text-center">
                          <FileText
                            size={24}
                            className="mx-auto text-slate-300"
                          />

                          <p className="mt-2 text-sm text-slate-500">
                            Aucune partition
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {partitions.map(
                            (
                              partition,
                            ) => (
                              <button
                                key={
                                  partition.id
                                }
                                type="button"
                                onClick={() =>
                                  openPartition(
                                    partition,
                                  )
                                }
                                className={`group flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                                  selectedPartitionId ===
                                  partition.id
                                    ? "bg-blue-50"
                                    : "hover:bg-slate-50"
                                }`}
                              >
                                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
                                  <FileText
                                    size={16}
                                  />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium text-slate-900">
                                    {fileLabel(
                                      partition,
                                    )}
                                  </span>

                                  <span className="mt-0.5 block text-xs text-slate-400">
                                    {formatFileSize(
                                      partition.sizeBytes,
                                    )}
                                  </span>
                                </span>

                                <span className="text-xs font-semibold text-blue-600 opacity-0 transition group-hover:opacity-100">
                                  Ouvrir
                                </span>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                </div>
              )}
            </section>

            {/* Preview */}
            <section className="h-full w-1/3 shrink-0 overflow-hidden bg-white lg:w-auto">
              {selectedPartition && (
                <div className="flex h-full flex-col">
                  <header className="flex min-h-[72px] shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-4">
                    <button
                      type="button"
                      onClick={
                        closePartition
                      }
                      className="flex h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <ArrowLeft
                        size={15}
                      />

                      <span className="lg:hidden">
                        Retour
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fileLabel(
                          selectedPartition,
                        )}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        {formatFileSize(
                          selectedPartition.sizeBytes,
                        )}
                      </p>
                    </div>

                    {selectedPartition.downloadable && (
                      <a
                        href={downloadUrl(
                          selectedPartition,
                        )}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Télécharger"
                        title="Télécharger"
                      >
                        <Download
                          size={16}
                        />
                      </a>
                    )}

                    {canManage && (
                      <button
                        type="button"
                        disabled={
                          deleting ===
                          selectedPartition.id
                        }
                        onClick={() =>
                          void deleteFile(
                            selectedPartition,
                          )
                        }
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        aria-label="Supprimer la partition"
                      >
                        <Trash2
                          size={15}
                        />
                      </button>
                    )}
                  </header>

                  <div className="min-h-0 flex-1 bg-slate-100">
                    {selectedPartition.mimeType ===
                    "application/pdf" ? (
                      <iframe
                        src={resourceUrl(
                          selectedPartition,
                        )}
                        title={fileLabel(
                          selectedPartition,
                        )}
                        className="h-full w-full border-0 bg-white"
                      />
                    ) : selectedPartition.mimeType.startsWith(
                        "image/",
                      ) ? (
                      <div className="flex h-full items-center justify-center overflow-auto p-6">
                        <img
                          src={resourceUrl(
                            selectedPartition,
                          )}
                          alt={fileLabel(
                            selectedPartition,
                          )}
                          className="max-h-full max-w-full rounded-lg bg-white object-contain shadow-sm"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <FileText
                          size={36}
                          className="text-slate-300"
                        />

                        <p className="mt-4 max-w-sm truncate text-sm font-semibold text-slate-700">
                          {fileLabel(
                            selectedPartition,
                          )}
                        </p>

                        <a
                          href={resourceUrl(
                            selectedPartition,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Ouvrir le fichier
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {editOpen &&
        selectedSong && (
          <EditSongModal
            song={
              selectedSong
            }
            onClose={() =>
              setEditOpen(
                false,
              )
            }
            onSaved={async () => {
              setEditOpen(
                false,
              );

              await load(
                selectedSong.id,
              );
            }}
          />
        )}

      {createOpen && (
        <CreateSongModal
          onClose={() =>
            setCreateOpen(
              false,
            )
          }
          onCreated={async (
            songId,
          ) => {
            setCreateOpen(
              false,
            );

            await load(
              songId,
            );

            setSelectedSongId(
              songId,
            );

            setSelectedPartitionId(
              null,
            );

            setMobilePane(
              "song",
            );
          }}
        />
      )}

      {uploadKind &&
        selectedSong && (
          <UploadFilesModal
            song={
              selectedSong
            }
            kind={
              uploadKind
            }
            onClose={() =>
              setUploadKind(
                null,
              )
            }
            onComplete={async () => {
              setUploadKind(
                null,
              );

              await load(
                selectedSong.id,
              );
            }}
          />
        )}
    </>
  );
}

function EditSongModal({
  song,
  onClose,
  onSaved,
}: {
  song: Song;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [
    title,
    setTitle,
  ] = useState(
    song.title,
  );

  const [
    composer,
    setComposer,
  ] = useState(
    song.composer ?? "",
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    notifyMembers,
    setNotifyMembers,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, []);

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Le titre est obligatoire.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/member/resources/songs",
          {
            method:
              "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                id:
                  song.id,

                title:
                  title.trim(),

                composer:
                  composer.trim() ||
                  null,

                program:
                  song.program,

                lyrics:
                  song.lyrics,

                notes:
                  song.notes,

                status:
                  song.status,
              }),
          },
        );

      const result =
        (await response
          .json()
          .catch(
            () => ({}),
          )) as ApiMessage;

      if (!response.ok) {
        throw new Error(
          result.message ??
            result.error ??
            "Impossible de modifier le morceau.",
        );
      }

      await publishMemberUpdate(
        "resources",
        notifyMembers,
      );

      await onSaved();
    } catch (reason) {
      setError(
        reason instanceof
          Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={
          submit
        }
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Modifier le morceau
          </h2>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="border-b border-slate-200 px-5 py-3">
          <NotifyMembersField
            checked={notifyMembers}
            onCheckedChange={setNotifyMembers}
            disabled={saving}
          />
        </div>

        <div className="p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Titre *
            </span>

            <input
              autoFocus
              value={
                title
              }
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
                )
              }
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Artiste / compositeur
            </span>

            <input
              value={
                composer
              }
              onChange={(
                event,
              ) =>
                setComposer(
                  event.target
                    .value,
                )
              }
              placeholder="Optionnel"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving && (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            )}

            Enregistrer
          </button>
        </footer>
      </form>
    </div>
  );
}

function CreateSongModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;

  onCreated: (
    songId: string,
  ) => Promise<void>;
}) {
  const [
    title,
    setTitle,
  ] = useState("");

  const [
    composer,
    setComposer,
  ] = useState("");

  const [
    audioFiles,
    setAudioFiles,
  ] = useState<File[]>(
    [],
  );

  const [
    scoreFiles,
    setScoreFiles,
  ] = useState<File[]>(
    [],
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    notifyMembers,
    setNotifyMembers,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, []);

  async function uploadFile(
    uploadUrl: string,
    songId: string,
    file: File,
    kind: UploadKind,
  ) {
    const label =
      fileStem(
        file.name,
      );

    const body =
      new FormData();

    body.set(
      "file",
      file,
    );

    body.set(
      "kind",
      kind,
    );

    body.set(
      "songId",
      songId,
    );

    body.set(
      "title",
      label,
    );

    body.set(
      "category",
      label,
    );

    body.set(
      "published",
      "true",
    );

    body.set(
      "downloadable",
      "true",
    );

    const response =
      await fetch(
        uploadUrl,
        {
          method:
            "POST",

          body,
        },
      );

    const result =
      (await response
        .json()
        .catch(
          () => ({}),
        )) as ApiMessage;

    if (!response.ok) {
      throw new Error(
        result.error ??
          result.message ??
          `Impossible d'envoyer ${file.name}.`,
      );
    }
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (!title.trim()) {
      setError(
        "Le titre est obligatoire.",
      );

      return;
    }

    setSaving(true);
    setError("");

    let songId:
      | string
      | null = null;

    try {
      const response =
        await fetch(
          "/api/member/resources/songs",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                title:
                  title.trim(),

                composer:
                  composer.trim() ||
                  null,

                program: null,
                lyrics: null,
                notes: null,
                status:
                  "published",
              }),
          },
        );

      const result =
        (await response.json()) as
          SongCreateResponse;

      if (
        !response.ok ||
        !result.id
      ) {
        throw new Error(
          result.message ??
            result.error ??
            "Impossible de créer le morceau.",
        );
      }

      songId =
        result.id;

      const files = [
        ...audioFiles.map(
          (file) => ({
            file,
            kind:
              "audio" as const,
          }),
        ),

        ...scoreFiles.map(
          (file) => ({
            file,
            kind:
              "score" as const,
          }),
        ),
      ];

      if (
        files.length >
        0
      ) {
        const ticketResponse =
          await fetch(
            "/api/member/resources/upload-ticket",
            {
              method:
                "POST",
            },
          );

        const ticket =
          (await ticketResponse.json()) as
            UploadTicketResponse;

        if (
          !ticketResponse.ok ||
          !ticket.uploadUrl
        ) {
          throw new Error(
            ticket.message ??
              ticket.error ??
              "Impossible de préparer les fichiers.",
          );
        }

        for (
          const item of
          files
        ) {
          await uploadFile(
            ticket.uploadUrl,
            songId,
            item.file,
            item.kind,
          );
        }
      }

      await publishMemberUpdate(
        "resources",
        notifyMembers,
      );

      await onCreated(
        songId,
      );
    } catch (reason) {
      const message =
        reason instanceof
          Error
          ? reason.message
          : "Une erreur est survenue.";

      if (songId) {
        window.alert(
          `Le morceau a été créé, mais certains fichiers n'ont pas pu être envoyés.\n\n${message}`,
        );

        await publishMemberUpdate(
          "resources",
          notifyMembers,
        );

        await onCreated(
          songId,
        );

        return;
      }

      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={
          submit
        }
        className="flex max-h-[88dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Ajouter un morceau
          </h2>

          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="border-b border-slate-200 px-5 py-3">
          <NotifyMembersField
            checked={notifyMembers}
            onCheckedChange={setNotifyMembers}
            disabled={saving}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Titre *
            </span>

            <input
              autoFocus
              value={title}
              onChange={(
                event,
              ) =>
                setTitle(
                  event.target
                    .value,
                )
              }
              placeholder="Nom du morceau"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Artiste / compositeur
            </span>

            <input
              value={
                composer
              }
              onChange={(
                event,
              ) =>
                setComposer(
                  event.target
                    .value,
                )
              }
              placeholder="Optionnel"
              className="h-10 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-500"
            />
          </label>

          <FilePicker
            title="Sons"
            description="MP3, M4A, WAV…"
            accept="audio/*"
            files={
              audioFiles
            }
            onChange={
              setAudioFiles
            }
          />

          <FilePicker
            title="Partitions"
            description="PDF ou image"
            accept=".pdf,image/jpeg,image/png,image/webp"
            files={
              scoreFiles
            }
            onChange={
              setScoreFiles
            }
          />

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving && (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            )}

            Ajouter
          </button>
        </footer>
      </form>
    </div>
  );
}

function FilePicker({
  title,
  description,
  accept,
  files,
  onChange,
}: {
  title: string;
  description: string;
  accept: string;
  files: File[];

  onChange: (
    files: File[],
  ) => void;
}) {
  function selectFiles(
    event:
      ChangeEvent<HTMLInputElement>,
  ) {
    const selected =
      Array.from(
        event.target.files ??
          [],
      );

    onChange([
      ...files,
      ...selected,
    ]);

    event.target.value =
      "";
  }

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            {title}
          </h3>

          <p className="mt-0.5 text-xs text-slate-400">
            {description}
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-blue-600">
          <Plus
            size={14}
          />
          Ajouter

          <input
            type="file"
            multiple
            accept={
              accept
            }
            onChange={
              selectFiles
            }
            className="hidden"
          />
        </label>
      </div>

      {files.length ===
      0 ? (
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-[#7f7b72] hover:border-blue-400">
          <Upload
            size={17}
            className="text-blue-600"
          />

          Choisir des fichiers

          <input
            type="file"
            multiple
            accept={
              accept
            }
            onChange={
              selectFiles
            }
            className="hidden"
          />
        </label>
      ) : (
        <div className="mt-2 divide-y divide-[#eeeae3] rounded-xl border border-slate-200">
          {files.map(
            (
              file,
              index,
            ) => (
              <div
                key={`${file.name}-${file.size}-${index}`}
                className="flex items-center gap-3 px-3 py-2.5"
              >
                {title ===
                "Sons" ? (
                  <FileAudio
                    size={16}
                    className="shrink-0 text-blue-600"
                  />
                ) : (
                  <FileText
                    size={16}
                    className="shrink-0 text-blue-600"
                  />
                )}

                <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                  {file.name}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      files.filter(
                        (
                          _,
                          fileIndex,
                        ) =>
                          fileIndex !==
                          index,
                      ),
                    )
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[#ac6262] hover:bg-red-50"
                >
                  <X
                    size={14}
                  />
                </button>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

function UploadFilesModal({
  song,
  kind,
  onClose,
  onComplete,
}: {
  song: Song;
  kind: UploadKind;
  onClose: () => void;
  onComplete:
    () => Promise<void>;
}) {
  const [
    files,
    setFiles,
  ] = useState<File[]>(
    [],
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    notifyMembers,
    setNotifyMembers,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    const previous =
      document.body.style
        .overflow;

    document.body.style.overflow =
      "hidden";

    return () => {
      document.body.style.overflow =
        previous;
    };
  }, []);

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    if (
      files.length === 0
    ) {
      setError(
        "Choisissez au moins un fichier.",
      );

      return;
    }

    setSaving(true);
    setError("");

    try {
      const ticketResponse =
        await fetch(
          "/api/member/resources/upload-ticket",
          {
            method:
              "POST",
          },
        );

      const ticket =
        (await ticketResponse.json()) as
          UploadTicketResponse;

      if (
        !ticketResponse.ok ||
        !ticket.uploadUrl
      ) {
        throw new Error(
          ticket.message ??
            ticket.error ??
            "Impossible de préparer l'envoi.",
        );
      }

      for (
        const file of files
      ) {
        const label =
          fileStem(
            file.name,
          );

        const body =
          new FormData();

        body.set(
          "file",
          file,
        );

        body.set(
          "kind",
          kind,
        );

        body.set(
          "songId",
          song.id,
        );

        body.set(
          "title",
          label,
        );

        body.set(
          "category",
          label,
        );

        body.set(
          "published",
          "true",
        );

        body.set(
          "downloadable",
          "true",
        );

        const response =
          await fetch(
            ticket.uploadUrl,
            {
              method:
                "POST",

              body,
            },
          );

        const result =
          (await response
            .json()
            .catch(
              () => ({}),
            )) as ApiMessage;

        if (!response.ok) {
          throw new Error(
            result.error ??
              result.message ??
              `Impossible d'envoyer ${file.name}.`,
          );
        }
      }

      await publishMemberUpdate(
        "resources",
        notifyMembers,
      );

      await onComplete();
    } catch (reason) {
      setError(
        reason instanceof
          Error
          ? reason.message
          : "Une erreur est survenue.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]">
      <form
        onSubmit={
          submit
        }
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {kind ===
              "audio"
                ? "Ajouter des sons"
                : "Ajouter des partitions"}
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              {song.title}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          >
            <X
              size={17}
            />
          </button>
        </header>

        <div className="border-b border-slate-200 px-5 py-3">
          <NotifyMembersField
            checked={notifyMembers}
            onCheckedChange={setNotifyMembers}
            disabled={saving}
          />
        </div>

        <div className="p-5">
          <FilePicker
            title={
              kind === "audio"
                ? "Sons"
                : "Partitions"
            }
            description={
              kind === "audio"
                ? "Un ou plusieurs fichiers audio."
                : "Une ou plusieurs partitions."
            }
            accept={
              kind === "audio"
                ? "audio/*"
                : ".pdf,image/jpeg,image/png,image/webp"
            }
            files={
              files
            }
            onChange={
              setFiles
            }
          />

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-200 px-5 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-600"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={
              saving ||
              files.length ===
                0
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving ? (
              <LoaderCircle
                size={15}
                className="animate-spin"
              />
            ) : (
              <Upload
                size={15}
              />
            )}

            Ajouter
          </button>
        </footer>
      </form>
    </div>
  );
}