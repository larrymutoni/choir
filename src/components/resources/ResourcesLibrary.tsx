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
      ? "lg:grid-cols-[280px_minmax(380px,0.85fr)_minmax(460px,1.15fr)]"
      : "lg:grid-cols-[320px_minmax(0,1fr)_0px]";

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
      <div className="flex min-h-[500px] items-center justify-center gap-3 text-sm text-[#77736b]">
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
      <main className="w-full px-2 py-2 sm:px-3 lg:px-4">
        <div className="mb-2 flex h-10 items-center justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-[#292923]">
              Répertoire
            </h1>

            <span className="text-xs text-[#969188]">
              {songs.length}{" "}
              morceau
              {songs.length >
              1
                ? "x"
                : ""}
            </span>
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() =>
                setCreateOpen(
                  true,
                )
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#687a5e] px-3.5 text-sm font-bold text-white transition hover:bg-[#596950]"
            >
              <Plus
                size={15}
              />

              Ajouter
            </button>
          )}
        </div>

        {error && (
          <div className="mb-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="h-[calc(100dvh-7rem)] min-h-[560px] overflow-hidden rounded-xl border border-[#ddd9cf] bg-white">
          <div
            className={`flex h-full w-[300%] transition-transform duration-200 ease-out lg:grid lg:w-full lg:translate-x-0 lg:transition-[grid-template-columns] ${mobileTranslation} ${desktopColumns}`}
          >
            {/* 1 — RÉPERTOIRE */}

            <section
              className={`h-full w-1/3 shrink-0 overflow-hidden lg:w-auto ${
                selectedSong
                  ? "lg:border-r lg:border-[#e5e1d8]"
                  : ""
              }`}
            >
              <div className="border-b border-[#e8e4dc] p-3">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9b978e]"
                  />

                  <input
                    type="search"
                    value={search}
                    onChange={(
                      event,
                    ) => {
                      setSearch(
                        event.target
                          .value,
                      );

                      setActiveLetter(
                        null,
                      );
                    }}
                    placeholder="Rechercher un morceau"
                    className="h-10 w-full rounded-lg border border-[#ddd9cf] bg-[#f8f7f3] pl-9 pr-3 text-sm outline-none focus:border-[#abb6a4] focus:bg-white"
                  />
                </div>

                <div className="mt-2 flex gap-0.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveLetter(
                        null,
                      )
                    }
                    className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${
                      activeLetter ===
                      null
                        ? "bg-[#687a5e] text-white"
                        : "text-[#77736b]"
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
                          key={
                            letter
                          }
                          type="button"
                          disabled={
                            !available
                          }
                          onClick={() =>
                            setActiveLetter(
                              letter,
                            )
                          }
                          className={`shrink-0 rounded px-1.5 py-1 text-[10px] font-bold ${
                            activeLetter ===
                            letter
                              ? "bg-[#687a5e] text-white"
                              : available
                              ? "text-[#69665f] hover:bg-[#efede7]"
                              : "text-[#d2cec6]"
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
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(170px,0.45fr)] border-b border-[#e8e4dc] bg-[#faf9f6] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#99958d]">
                  <span>
                    Morceau
                  </span>

                  <span>
                    Artiste / compositeur
                  </span>
                </div>
              )}

              <div className="h-[calc(100%-91px)] overflow-y-auto">
                {filteredSongs.length ===
                0 ? (
                  <p className="px-5 py-10 text-center text-sm text-[#99958d]">
                    Aucun morceau
                  </p>
                ) : (
                  filteredSongs.map(
                    (song) => {
                      const selected =
                        selectedSongId ===
                        song.id;

                      if (
                        !selectedSong
                      ) {
                        return (
                          <button
                            key={
                              song.id
                            }
                            type="button"
                            onClick={() =>
                              openSong(
                                song,
                              )
                            }
                            className="grid w-full grid-cols-[minmax(0,1fr)_minmax(170px,0.45fr)] items-center border-b border-[#efede7] px-4 py-3 text-left transition hover:bg-[#f5f3ee]"
                          >
                            <span className="flex min-w-0 items-center gap-3">
                              <Music2
                                size={16}
                                className="shrink-0 text-[#687a5e]"
                              />

                              <span className="truncate text-sm font-semibold text-[#37362f]">
                                {
                                  song.title
                                }
                              </span>
                            </span>

                            <span className="truncate text-sm text-[#858178]">
                              {song.composer ??
                                "—"}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <button
                          key={
                            song.id
                          }
                          type="button"
                          onClick={() =>
                            openSong(
                              song,
                            )
                          }
                          className={`flex w-full items-center gap-2.5 border-b border-[#efede7] px-3 py-2.5 text-left transition ${
                            selected
                              ? "bg-[#e5ebe1]"
                              : "hover:bg-[#f5f3ee]"
                          }`}
                        >
                          <Music2
                            size={15}
                            className={
                              selected
                                ? "shrink-0 text-[#5c6f53]"
                                : "shrink-0 text-[#99958d]"
                            }
                          />

                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[#37362f]">
                              {
                                song.title
                              }
                            </span>

                            {song.composer && (
                              <span className="mt-0.5 block truncate text-xs text-[#99958d]">
                                {
                                  song.composer
                                }
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    },
                  )
                )}
              </div>
            </section>

            {/* 2 — MORCEAU / LECTEUR */}

            <section
              className={`h-full w-1/3 shrink-0 overflow-hidden lg:w-auto ${
                selectedPartition
                  ? "lg:border-r lg:border-[#e5e1d8]"
                  : ""
              }`}
            >
              {selectedSong && (
                <div className="flex h-full flex-col">
                  <header className="flex min-h-[64px] shrink-0 items-center gap-2 border-b border-[#e8e4dc] px-3">
                    <button
                      type="button"
                      onClick={
                        closeSong
                      }
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#66635c] transition hover:bg-[#f1efe9]"
                    >
                      <ArrowLeft
                        size={15}
                      />

                      <span className="lg:hidden">
                        Répertoire
                      </span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <h2 className="truncate text-base font-bold text-[#33322c]">
                        {
                          selectedSong.title
                        }
                      </h2>

                      {selectedSong.composer && (
                        <p className="mt-0.5 truncate text-xs text-[#969188]">
                          {
                            selectedSong.composer
                          }
                        </p>
                      )}
                    </div>

                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setEditOpen(
                              true,
                            )
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ddd9cf] px-2.5 text-xs font-bold text-[#625f57] hover:bg-[#f5f3ee]"
                        >
                          <Pencil
                            size={13}
                          />
                          Modifier
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setUploadKind(
                              "audio",
                            )
                          }
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-[#ddd9cf] px-2.5 text-xs font-bold text-[#625f57] hover:bg-[#f5f3ee]"
                        >
                          <Plus
                            size={13}
                          />
                          Son
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
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#ad6262] hover:bg-red-50 disabled:opacity-40"
                          aria-label="Supprimer le morceau"
                        >
                          <Trash2
                            size={14}
                          />
                        </button>
                      </>
                    )}
                  </header>

                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <section className="px-5 py-6 sm:px-7">
                      {audios.length ===
                      0 ? (
                        <div className="py-14 text-center">
                          <FileAudio
                            size={28}
                            className="mx-auto text-[#aaa69d]"
                          />

                          <p className="mt-3 text-sm text-[#8f8b82]">
                            Aucun son
                          </p>

                          {canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                setUploadKind(
                                  "audio",
                                )
                              }
                              className="mt-3 text-sm font-bold text-[#687a5e]"
                            >
                              + Ajouter un son
                            </button>
                          )}
                        </div>
                      ) : (
                        <>
                          {audios.length >
                            1 && (
                            <div className="mb-5">
                              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-[#99958d]">
                                Sons
                              </p>

                              <div className="flex flex-wrap gap-2">
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
                                      className={`max-w-full truncate rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                                        selectedAudioId ===
                                        audio.id
                                          ? "bg-[#687a5e] text-white"
                                          : "border border-[#ddd9cf] text-[#66635c] hover:bg-[#f5f3ee]"
                                      }`}
                                    >
                                      {fileLabel(
                                        audio,
                                      )}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          )}

                          {selectedAudio && (
                            <div className="mx-auto max-w-2xl">
                              <div className="mb-5 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-bold text-[#4b4841]">
                                    {fileLabel(
                                      selectedAudio,
                                    )}
                                  </p>
                                </div>

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
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#ad6262] hover:bg-red-50 disabled:opacity-40"
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
                        </>
                      )}
                    </section>

                    {(partitions.length >
                      0 ||
                      canManage) && (
                      <section className="border-t border-[#e9e5dd] px-5 py-5 sm:px-7">
                        <div className="mb-2 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-[#44423c]">
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
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#687a5e]"
                            >
                              <Plus
                                size={13}
                              />
                              Ajouter
                            </button>
                          )}
                        </div>

                        {partitions.length ===
                        0 ? (
                          <p className="py-5 text-sm text-[#99958d]">
                            Aucune partition
                          </p>
                        ) : (
                          <div className="divide-y divide-[#efede7]">
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
                                  className={`group flex w-full items-center gap-3 py-3 text-left transition ${
                                    selectedPartitionId ===
                                    partition.id
                                      ? "text-[#526049]"
                                      : ""
                                  }`}
                                >
                                  <FileText
                                    size={17}
                                    className="shrink-0 text-[#687a5e]"
                                  />

                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-semibold text-[#45423c]">
                                      {fileLabel(
                                        partition,
                                      )}
                                    </span>

                                    <span className="mt-0.5 block text-xs text-[#99958d]">
                                      {formatFileSize(
                                        partition.sizeBytes,
                                      )}
                                    </span>
                                  </span>

                                  <span className="text-xs font-bold text-[#687a5e] opacity-70 transition group-hover:opacity-100">
                                    Ouvrir
                                  </span>
                                </button>
                              ),
                            )}
                          </div>
                        )}
                      </section>
                    )}
                  </div>
                </div>
              )}
            </section>

            {/* 3 — APERÇU PARTITION */}

            <section className="h-full w-1/3 shrink-0 overflow-hidden lg:w-auto">
              {selectedPartition && (
                <div className="flex h-full flex-col">
                  <header className="flex min-h-[64px] shrink-0 items-center gap-2 border-b border-[#e8e4dc] px-3">
                    <button
                      type="button"
                      onClick={
                        closePartition
                      }
                      className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-bold text-[#66635c] hover:bg-[#f1efe9]"
                    >
                      <ArrowLeft
                        size={15}
                      />

                      Partition
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#33322c]">
                        {fileLabel(
                          selectedPartition,
                        )}
                      </p>
                    </div>

                    {selectedPartition.downloadable && (
                      <a
                        href={downloadUrl(
                          selectedPartition,
                        )}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#687a5e] hover:bg-[#f1efe9]"
                        aria-label="Télécharger"
                      >
                        <Download
                          size={15}
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
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#ad6262] hover:bg-red-50 disabled:opacity-40"
                      >
                        <Trash2
                          size={14}
                        />
                      </button>
                    )}
                  </header>

                  <div className="min-h-0 flex-1">
                    {selectedPartition.mimeType ===
                    "application/pdf" ? (
                      <iframe
                        src={resourceUrl(
                          selectedPartition,
                        )}
                        title={fileLabel(
                          selectedPartition,
                        )}
                        className="h-full w-full border-0"
                      />
                    ) : selectedPartition.mimeType.startsWith(
                        "image/",
                      ) ? (
                      <div className="flex h-full items-center justify-center overflow-auto bg-[#f5f3ee] p-4">
                        <img
                          src={resourceUrl(
                            selectedPartition,
                          )}
                          alt={fileLabel(
                            selectedPartition,
                          )}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                        <FileText
                          size={40}
                          className="text-[#8d9986]"
                        />

                        <p className="mt-4 max-w-sm truncate text-sm font-bold text-[#49463f]">
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
                          className="mt-4 rounded-lg bg-[#687a5e] px-4 py-2 text-sm font-bold text-white"
                        >
                          Ouvrir
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
        <header className="flex items-center justify-between border-b border-[#e7e3da] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292923]">
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77736b] hover:bg-[#f1efe9]"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#656159]">
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
              className="h-10 w-full rounded-xl border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-[#656159]">
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
              className="h-10 w-full rounded-xl border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
            />
          </label>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-[#e7e3da] px-5 py-4">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-[#ddd9cf] px-4 text-sm font-bold text-[#656159]"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#687a5e] px-4 text-sm font-bold text-white disabled:opacity-50"
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
        <header className="flex shrink-0 items-center justify-between border-b border-[#e7e3da] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#292923]">
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
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77736b] hover:bg-[#f1efe9]"
          >
            <X
              size={18}
            />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-[#656159]">
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
              className="h-10 w-full rounded-xl border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
            />
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-bold text-[#656159]">
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
              className="h-10 w-full rounded-xl border border-[#ddd9cf] px-3 text-sm outline-none focus:border-[#aab5a3]"
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

        <footer className="flex shrink-0 justify-end gap-2 border-t border-[#e7e3da] px-5 py-4">
          <button
            type="button"
            disabled={
              saving
            }
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-[#ddd9cf] px-4 text-sm font-bold text-[#656159]"
          >
            Annuler
          </button>

          <button
            type="submit"
            disabled={
              saving
            }
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#687a5e] px-4 text-sm font-bold text-white disabled:opacity-50"
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
          <h3 className="text-sm font-bold text-[#44423c]">
            {title}
          </h3>

          <p className="mt-0.5 text-xs text-[#99958d]">
            {description}
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-bold text-[#687a5e]">
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
        <label className="mt-2 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8d4ca] bg-[#faf9f6] px-4 py-5 text-sm text-[#7f7b72] hover:border-[#abb6a4]">
          <Upload
            size={17}
            className="text-[#687a5e]"
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
        <div className="mt-2 divide-y divide-[#eeeae3] rounded-xl border border-[#e2ded5]">
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
                    className="shrink-0 text-[#687a5e]"
                  />
                ) : (
                  <FileText
                    size={16}
                    className="shrink-0 text-[#687a5e]"
                  />
                )}

                <span className="min-w-0 flex-1 truncate text-sm text-[#4c4942]">
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
        <header className="flex items-center justify-between border-b border-[#e7e3da] px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-[#292923]">
              {kind ===
              "audio"
                ? "Ajouter des sons"
                : "Ajouter des partitions"}
            </h2>

            <p className="mt-0.5 text-xs text-[#969188]">
              {song.title}
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            className="flex h-9 w-9 items-center justify-center rounded-lg text-[#77736b] hover:bg-[#f1efe9]"
          >
            <X
              size={17}
            />
          </button>
        </header>

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

        <footer className="flex justify-end gap-2 border-t border-[#e7e3da] px-5 py-4">
          <button
            type="button"
            onClick={
              onClose
            }
            className="h-10 rounded-xl border border-[#ddd9cf] px-4 text-sm font-bold text-[#656159]"
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
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#687a5e] px-4 text-sm font-bold text-white disabled:opacity-50"
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