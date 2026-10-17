"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  FolderOpen,
  Grid3X3,
  List,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
  Images,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Album = {
  id: string;
  title: string;
  description: string | null;
  activity: string | null;
  album_date: string;
  sort_order: number | null;
  cover_media_id: string | null;
  media_count: number;
  photo_count: number;
  video_count: number;
};

type Media = {
  id: string;
  album_id: string | null;
  media_type: "photo" | "video";
  original_filename: string;
  mime_type: string;
  size_bytes: number;
  captured_at: string;
  taken_at: string | null;
  year_override: number | null;
  width: number | null;
  height: number | null;
  has_thumbnail: number;
  has_preview: number;
  album_title: string | null;
  activity: string | null;
  album_date: string | null;
  created_at: string;
  updated_at: string;
};

type Props = {
  albums: Album[];
  media: Media[];
  canManage: boolean;
};

type View = "library" | "albums" | "photos" | "videos" | "album" | "unassigned";
type Layout = "grid" | "list";

type ApiResult = {
  id?: string;
  uploadUrl?: string;
  message?: string;
  error?: string;
  duplicate?: boolean;
  existingId?: string;
};

type PreparedMedia = {
  thumbnail?: Blob;
  preview?: Blob;
  width?: number;
  height?: number;
};

function mediaUrl(
  id: string,
  variant: "thumb" | "preview" | "original" = "original",
) {
  return `/api/member/gallery/media/${encodeURIComponent(id)}?variant=${variant}`;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} Mo`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function formatAlbumDate(value: string) {
  return formatDate(`${value}T12:00:00`);
}

function monthLabel(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function effectiveDate(item: Media) {
  if (item.album_date) return `${item.album_date}T12:00:00`;
  if (item.taken_at) return item.taken_at;
  if (item.year_override) return `${item.year_override}-01-01T12:00:00`;
  return item.created_at;
}

function effectiveYear(item: Media) {
  if (item.album_date) {
    return Number(item.album_date.slice(0, 4));
  }

  if (item.year_override && !item.taken_at) {
    return item.year_override;
  }

  return new Date(effectiveDate(item)).getFullYear();
}

function periodLabel(item: Media) {
  if (item.year_override && !item.taken_at && !item.album_date) {
    return String(item.year_override);
  }
  return monthLabel(effectiveDate(item));
}

function mediaDateLabel(item: Media) {
  if (item.taken_at) return formatDate(item.taken_at);
  if (item.album_date) return formatAlbumDate(item.album_date);
  if (item.year_override) return String(item.year_override);
  return formatDate(item.created_at);
}

function dateInputValue(value: string | null) {
  return value ? value.slice(0, 10) : "";
}


function normalizeGallerySearch(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("fr-FR")
    .trim();
}


function safeArchiveName(value: string) {
  const cleaned = value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "galerie";
}

function uniqueArchiveFilename(filename: string, used: Set<string>) {
  const clean = filename.split(/[\\/]/).pop()?.trim() || "media";
  const dot = clean.lastIndexOf(".");
  const base = dot > 0 ? clean.slice(0, dot) : clean;
  const extension = dot > 0 ? clean.slice(dot) : "";
  let candidate = clean;
  let suffix = 2;

  while (used.has(candidate.toLocaleLowerCase())) {
    candidate = `${base} (${suffix})${extension}`;
    suffix += 1;
  }

  used.add(candidate.toLocaleLowerCase());
  return candidate;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function zipDateTime(value: string) {
  const parsed = new Date(value);
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  const year = Math.min(2107, Math.max(1980, date.getFullYear()));
  const dosDate = ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();
  const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  return { dosDate, dosTime };
}

function createStoredZip(entries: Array<{ name: string; data: ArrayBuffer; date: string }>) {
  if (entries.length > 65535) throw new Error("Trop de fichiers pour une archive ZIP.");

  const encoder = new TextEncoder();
  const localParts: BlobPart[] = [];
  const centralParts: BlobPart[] = [];
  let offset = 0;
  let centralSize = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const bytes = new Uint8Array(entry.data);
    const checksum = crc32(bytes);
    const { dosDate, dosTime } = zipDateTime(entry.date);

    if (bytes.byteLength > 0xffffffff || offset > 0xffffffff) {
      throw new Error("Archive trop volumineuse pour ce téléchargement ZIP.");
    }

    const local = new Uint8Array(30);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true); // UTF-8 filenames
    localView.setUint16(8, 0, true); // stored, no recompression
    localView.setUint16(10, dosTime, true);
    localView.setUint16(12, dosDate, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, bytes.byteLength, true);
    localView.setUint32(22, bytes.byteLength, true);
    localView.setUint16(26, name.byteLength, true);
    localView.setUint16(28, 0, true);

    localParts.push(local, name, entry.data);

    const central = new Uint8Array(46);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, dosTime, true);
    centralView.setUint16(14, dosDate, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, bytes.byteLength, true);
    centralView.setUint32(24, bytes.byteLength, true);
    centralView.setUint16(28, name.byteLength, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);

    centralParts.push(central, name);

    offset += local.byteLength + name.byteLength + bytes.byteLength;
    centralSize += central.byteLength + name.byteLength;
  }

  if (offset > 0xffffffff || centralSize > 0xffffffff) {
    throw new Error("Archive trop volumineuse pour ce téléchargement ZIP.");
  }

  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);

  return new Blob([...localParts, ...centralParts, end], {
    type: "application/zip",
  });
}

async function sha256(file: Blob) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function loadImage(blob: Blob) {
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await image.decode();
    return image;
  } finally {
    // Revoked by caller after canvas work; decode has already retained the bitmap.
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

function canvasBlob(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxSide: number,
  quality: number,
) {
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas indisponible.");
  context.drawImage(source, 0, 0, width, height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Conversion impossible."))),
      "image/webp",
      quality,
    );
  });
}

async function preparePhoto(blob: Blob): Promise<PreparedMedia> {
  const image = await loadImage(blob);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const [thumbnail, preview] = await Promise.all([
    canvasBlob(image, width, height, 520, 0.78),
    canvasBlob(image, width, height, 1600, 0.86),
  ]);
  return { thumbnail, preview, width, height };
}

async function prepareVideoPosterFromUrl(url: string): Promise<PreparedMedia> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";

    let finished = false;
    const timeout = window.setTimeout(() => finishError(), 7000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeAttribute("src");
      video.load();
    };

    const finishError = () => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error("Aperçu vidéo indisponible."));
    };

    video.onerror = finishError;

    video.onloadedmetadata = () => {
      const target = Number.isFinite(video.duration) && video.duration > 0.2
        ? Math.min(1, Math.max(0.05, video.duration * 0.05))
        : 0.05;
      video.currentTime = target;
    };

    video.onseeked = async () => {
      if (finished) return;
      try {
        const width = video.videoWidth;
        const height = video.videoHeight;
        if (!width || !height) throw new Error("Dimensions vidéo indisponibles.");
        const thumbnail = await canvasBlob(video, width, height, 520, 0.78);
        finished = true;
        cleanup();
        resolve({ thumbnail, width, height });
      } catch {
        finishError();
      }
    };

    video.src = url;
  });
}

async function prepareVideoPoster(file: File) {
  const url = URL.createObjectURL(file);
  try {
    return await prepareVideoPosterFromUrl(url);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function LocalFilePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  if (!url) return <div className="h-full w-full bg-slate-100" />;

  if (file.type.startsWith("video/")) {
    return <video src={url} muted playsInline preload="metadata" className="h-full w-full object-cover" />;
  }

  return <img src={url} alt="" className="h-full w-full object-cover" />;
}

export function GalleryView({ albums, media, canManage }: Props) {
  const router = useRouter();
  const [orderedAlbums, setOrderedAlbums] = useState<Album[]>(albums);
  const [draggedAlbumId, setDraggedAlbumId] = useState<string | null>(null);
  const [orderingAlbums, setOrderingAlbums] = useState(false);
  useEffect(() => setOrderedAlbums(albums), [albums]);
  const [view, setView] = useState<View>("albums");
  const [layout, setLayout] = useState<Layout>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [year, setYear] = useState<number | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);
  const [openMediaId, setOpenMediaId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [menuMediaId, setMenuMediaId] = useState<string | null>(null);
  const [moveIds, setMoveIds] = useState<string[]>([]);
  const [moveDestination, setMoveDestination] = useState("");
  const [moveNewAlbumTitle, setMoveNewAlbumTitle] = useState("");
  const [moveNewAlbumDate, setMoveNewAlbumDate] = useState(today());
  const [moving, setMoving] = useState(false);
  const [moveProgress, setMoveProgress] = useState({ done: 0, total: 0 });
  const [moveError, setMoveError] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({
    done: 0,
    total: 0,
  });
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [destination, setDestination] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [newAlbumTitle, setNewAlbumTitle] = useState("");
  const [newAlbumDate, setNewAlbumDate] = useState(today());
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const [editMediaOpen, setEditMediaOpen] = useState(false);
  const [editTakenAt, setEditTakenAt] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editAlbumId, setEditAlbumId] = useState("");
  const [editNewAlbumTitle, setEditNewAlbumTitle] = useState("");
  const [editNewAlbumDate, setEditNewAlbumDate] = useState(today());
  const [savingMedia, setSavingMedia] = useState(false);

  const [editAlbumOpen, setEditAlbumOpen] = useState(false);
  const [editAlbumTitle, setEditAlbumTitle] = useState("");
  const [editAlbumDate, setEditAlbumDate] = useState("");
  const [editAlbumActivity, setEditAlbumActivity] = useState("");
  const [editAlbumDescription, setEditAlbumDescription] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);

  const wheelLock = useRef(false);

  const years = useMemo(
    () =>
      Array.from(
        new Set(
          orderedAlbums
            .map((album) => Number(album.album_date.slice(0, 4)))
            .filter((value) => Number.isInteger(value)),
        ),
      ).sort((a, b) => b - a),
    [orderedAlbums],
  );

  const selectedAlbum = albums.find((album) => album.id === selectedAlbumId) ?? null;
  const unassignedCount = media.filter((item) => !item.album_id).length;

  const normalizedSearch = normalizeGallerySearch(searchQuery);

  const visibleAlbums = useMemo(() => {
    let items =
      year === null
        ? orderedAlbums
        : orderedAlbums.filter(
            (album) =>
              Number(
                album.album_date.slice(
                  0,
                  4,
                ),
              ) === year,
          );

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((album) =>
      normalizeGallerySearch([
        album.title,
        album.activity,
        album.description,
        album.album_date,
      ].filter(Boolean).join(" ")).includes(normalizedSearch),
    );
  }, [orderedAlbums, normalizedSearch, year]);

  const filtered = useMemo(() => {
    let items = [...media];

    if (view === "photos") items = items.filter((item) => item.media_type === "photo");
    if (view === "videos") items = items.filter((item) => item.media_type === "video");
    if (view === "unassigned") items = items.filter((item) => !item.album_id);
    if (view === "album" && selectedAlbumId) {
      items = items.filter((item) => item.album_id === selectedAlbumId);
    }
    if (year && view !== "album") items = items.filter((item) => effectiveYear(item) === year);

    if (normalizedSearch) {
      items = items.filter((item) =>
        normalizeGallerySearch([
          item.original_filename,
          item.album_title,
          item.activity,
          mediaDateLabel(item),
          String(effectiveYear(item)),
          item.media_type === "photo" ? "photo" : "video",
        ].filter(Boolean).join(" ")).includes(normalizedSearch),
      );
    }

    return items.sort((a, b) => {
      const byDate = new Date(effectiveDate(b)).getTime() - new Date(effectiveDate(a)).getTime();
      if (byDate !== 0) return byDate;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [media, view, year, selectedAlbumId, normalizedSearch]);

  const groupedMedia = useMemo(() => {
    const groups = new Map<string, Media[]>();
    for (const item of filtered) {
      // Dans un album, c'est la date de cet album qui définit le regroupement.
      // La date propre au média reste inchangée dans ses informations.
      const key = view === "album" && selectedAlbum
        ? monthLabel(`${selectedAlbum.album_date}T12:00:00`)
        : periodLabel(item);
      const current = groups.get(key) ?? [];
      current.push(item);
      groups.set(key, current);
    }
    return Array.from(groups.entries());
  }, [filtered, view, selectedAlbum]);

  const activeMedia = filtered.find((item) => item.id === openMediaId) ?? null;
  const activeIndex = filtered.findIndex((item) => item.id === openMediaId);

  async function reorderVisibleAlbum(targetId: string) {
    const sourceId = draggedAlbumId;
    setDraggedAlbumId(null);
    if (!canManage || orderingAlbums || normalizedSearch || !sourceId || sourceId === targetId) return;
    const source = visibleAlbums.findIndex((album) => album.id === sourceId);
    const target = visibleAlbums.findIndex((album) => album.id === targetId);
    if (source < 0 || target < 0) return;

    const nextVisible = [...visibleAlbums];
    const [moved] = nextVisible.splice(source, 1);
    nextVisible.splice(target, 0, moved);
    const visibleIds = new Set(visibleAlbums.map((album) => album.id));
    let position = 0;
    const nextAll = orderedAlbums.map((album) => visibleIds.has(album.id)
      ? nextVisible[position++] : album);
    const previous = orderedAlbums;
    setOrderedAlbums(nextAll);
    setOrderingAlbums(true);
    try {
      const response = await fetch("/api/admin/gallery/albums", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: nextAll.map((album) => album.id) }),
      });
      if (!response.ok) {
        const error = (await response.json().catch(() => ({}))) as { message?: string };
        throw new Error(error.message ?? "Impossible d’enregistrer l’ordre des albums.");
      }
      router.refresh();
    } catch (error) {
      setOrderedAlbums(previous);
      window.alert(error instanceof Error ? error.message : "Erreur lors du classement.");
    } finally {
      setOrderingAlbums(false);
    }
  }

  function showLibrary() {
    setView("library");
    setSelectedAlbumId(null);
  }

  function showAlbum(id: string) {
    setSelectedAlbumId(id);
    setView("album");
    // L'année filtre les albums, pas les médias à l'intérieur d'un album.
    setYear(null);
    setSearchQuery("");
  }

  function showPreviousMedia() {
    if (!filtered.length || activeIndex < 0) return;
    const index = activeIndex === 0 ? filtered.length - 1 : activeIndex - 1;
    setOpenMediaId(filtered[index].id);
  }

  function showNextMedia() {
    if (!filtered.length || activeIndex < 0) return;
    const index = activeIndex === filtered.length - 1 ? 0 : activeIndex + 1;
    setOpenMediaId(filtered[index].id);
  }

  function handleViewerWheel(event: React.WheelEvent<HTMLDivElement>) {
    const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
    if (wheelLock.current || Math.abs(delta) < 35) return;
    wheelLock.current = true;
    delta > 0 ? showNextMedia() : showPreviousMedia();
    window.setTimeout(() => {
      wheelLock.current = false;
    }, 350);
  }

  useEffect(() => {
    if (!openMediaId) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") showNextMedia();
      if (event.key === "ArrowLeft") showPreviousMedia();
      if (event.key === "Escape") setOpenMediaId(null);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openMediaId, activeIndex, filtered]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const candidates = [filtered[activeIndex - 1], filtered[activeIndex + 1]].filter(Boolean) as Media[];
    for (const item of candidates) {
      if (item.media_type === "photo") {
        const image = new Image();
        image.src = mediaUrl(item.id, item.has_preview ? "preview" : "original");
      }
    }
  }, [activeIndex, filtered]);

  // La sélection est limitée à la vue en cours pour éviter de déplacer
  // involontairement des médias provenant d'un autre album.
  useEffect(() => {
    setSelectionMode(false);
    setSelectedMediaIds([]);
    setMenuMediaId(null);
  }, [view, selectedAlbumId, year]);

  useEffect(() => {
    if (!menuMediaId) return;
    function closeOnOutside(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest("[data-gallery-media-menu]")) return;
      setMenuMediaId(null);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuMediaId(null);
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [menuMediaId]);

  function selectOne(id: string) {
    if (moving) return;
    setMenuMediaId(null);
    setSelectionMode(true);
    setSelectedMediaIds((current) => current.includes(id) ? current : [...current, id]);
  }

  function startMove(ids: string[]) {
    if (!canManage || moving) return;
    const visible = new Set(filtered.map((item) => item.id));
    const requested = [...new Set(ids)].filter((id) => visible.has(id));
    if (!requested.length) return;
    setMenuMediaId(null);
    setMoveError("");
    setMoveDestination("");
    setMoveNewAlbumTitle("");
    setMoveNewAlbumDate(today());
    setMoveProgress({ done: 0, total: 0 });
    setMoveIds(requested);
  }

  function closeMove() {
    if (moving) return;
    setMoveIds([]);
    setMoveError("");
  }

  async function moveSelectedMedia() {
    if (!canManage || moving || !moveDestination || !moveIds.length) return;
    setMoveError("");
    setMoving(true);

    let targetAlbumId = moveDestination;
    let completed = 0;
    const failures: string[] = [];
    let firstFailure = "";

    try {
      if (moveIds.length >= 20 && !window.confirm(
        `Déplacer jusqu'à ${moveIds.length} médias vers l'album sélectionné ?`,
      )) return;

      if (moveDestination === "__new") {
        if (!moveNewAlbumTitle.trim() || !moveNewAlbumDate) {
          setMoveError("Indiquez le nom et la date du nouvel album.");
          return;
        }
        const response = await fetch("/api/admin/gallery/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: moveNewAlbumTitle.trim(),
            albumDate: moveNewAlbumDate,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
        if (!response.ok || !payload.id) {
          throw new Error(payload.message ?? "Impossible de créer l'album.");
        }
        targetAlbumId = payload.id;
      }

      const candidates = moveIds
        .map((id) => media.find((item) => item.id === id))
        .filter((item): item is Media => Boolean(item));
      const toMove = candidates.filter((item) => item.album_id !== targetAlbumId);

      if (!toMove.length) {
        setMoveIds([]);
        setSelectedMediaIds([]);
        setSelectionMode(false);
        return;
      }

      setMoveProgress({ done: 0, total: toMove.length });
      for (const item of toMove) {
        try {
          // PUT = changement d'album uniquement : préserve prise de vue, année et fichier.
          const response = await fetch("/api/admin/gallery/media", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: item.id, albumId: targetAlbumId }),
          });
          if (!response.ok) {
            const payload = (await response.json().catch(() => ({}))) as { message?: string; error?: string };
            throw new Error(payload.message ?? payload.error ?? `HTTP ${response.status}`);
          }
        } catch (error) {
          failures.push(item.id);
          if (!firstFailure) firstFailure = error instanceof Error ? error.message : "Erreur réseau";
        } finally {
          completed += 1;
          setMoveProgress({ done: completed, total: toMove.length });
        }
      }

      if (failures.length) {
        setMoveIds(failures);
        setSelectedMediaIds(failures);
        setSelectionMode(true);
        setMoveDestination(targetAlbumId);
        setMoveError(`${toMove.length - failures.length} déplacé(s), ${failures.length} échec(s). ${firstFailure}. Réessayez les éléments restants.`);
      } else {
        setMoveIds([]);
        setSelectedMediaIds([]);
        setSelectionMode(false);
      }
      if (failures.length < toMove.length) router.refresh();
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : "Déplacement impossible.");
    } finally {
      setMoving(false);
    }
  }

  function toggleSelection(id: string) {
    setSelectedMediaIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = filtered.map((item) => item.id);
    const allVisibleSelected =
      visibleIds.length > 0 &&
      visibleIds.every((id) => selectedMediaIds.includes(id));

    setSelectedMediaIds(
      allVisibleSelected
        ? []
        : visibleIds,
    );
  }

  function exitSelection() {
    setMenuMediaId(null);
    setSelectionMode(false);
    setSelectedMediaIds([]);
  }

  async function downloadItemsAsZip(items: Media[], archiveName: string) {
    if (!items.length || downloadBusy) return;

    const totalBytes = items.reduce((sum, item) => sum + item.size_bytes, 0);
    if (
      totalBytes > 700 * 1024 * 1024 &&
      !window.confirm(
        `Cette archive contient ${formatBytes(totalBytes)}. Sa préparation peut prendre du temps. Continuer ?`,
      )
    ) {
      return;
    }

    setDownloadBusy(true);
    setDownloadProgress(`0/${items.length}`);

    try {
      const entries: Array<{ name: string; data: ArrayBuffer; date: string }> = [];
      const usedNames = new Set<string>();

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index];
        setDownloadProgress(`${index + 1}/${items.length}`);

        const response = await fetch(`${mediaUrl(item.id, "original")}&download=1`);
        if (!response.ok) {
          throw new Error(`Impossible de télécharger ${item.original_filename}.`);
        }

        entries.push({
          name: uniqueArchiveFilename(item.original_filename, usedNames),
          data: await response.arrayBuffer(),
          date: effectiveDate(item),
        });
      }

      const zip = createStoredZip(entries);
      const url = URL.createObjectURL(zip);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeArchiveName(archiveName)}.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (caught) {
      window.alert(
        caught instanceof Error
          ? caught.message
          : "Impossible de préparer l’archive ZIP.",
      );
    } finally {
      setDownloadBusy(false);
      setDownloadProgress("");
    }
  }

  function downloadSelectedMedia() {
    const selected = filtered.filter((item) => selectedMediaIds.includes(item.id));
    if (!selected.length) return;

    const name = view === "album" && selectedAlbum
      ? `${selectedAlbum.title}-selection`
      : "galerie-selection";

    void downloadItemsAsZip(selected, name);
  }

  function downloadAlbum() {
    if (!selectedAlbum) return;
    const items = media.filter((item) => item.album_id === selectedAlbum.id);
    void downloadItemsAsZip(items, selectedAlbum.title);
  }

  async function deleteSelectedMedia() {
    if (!canManage || !selectedMediaIds.length || bulkDeleting) return;

    const ids = [...selectedMediaIds];
    const count = ids.length;
    if (!window.confirm(`Supprimer définitivement ${count} média${count > 1 ? "s" : ""} ?`)) return;

    setBulkDeleting(true);
    setBulkDeleteProgress({ done: 0, total: count });

    try {
      for (let index = 0; index < ids.length; index += 1) {
        const response = await fetch("/api/admin/gallery/media", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: ids[index] }),
        });

        if (!response.ok) {
          throw new Error("Une suppression a échoué.");
        }

        setBulkDeleteProgress({
          done: index + 1,
          total: count,
        });
      }

      exitSelection();
      router.refresh();
    } catch (caught) {
      window.alert(
        caught instanceof Error
          ? caught.message
          : "Impossible de supprimer la sélection.",
      );
    } finally {
      setBulkDeleting(false);
      setBulkDeleteProgress({ done: 0, total: 0 });
    }
  }

  function resetAddForm() {
    setDestination("");
    setFiles([]);
    setNewAlbumTitle("");
    setNewAlbumDate(today());
    setProgress("");
    setError("");
  }

  function closeAdd() {
    if (uploading) return;
    setAddOpen(false);
    resetAddForm();
  }

  function addFiles(incoming: FileList | File[]) {
    const accepted = Array.from(incoming).filter(
      (file) => file.type.startsWith("image/") || file.type.startsWith("video/"),
    );

    setFiles((current) => {
      const combined = [...current, ...accepted];
      return combined.filter(
        (file, index) =>
          combined.findIndex(
            (candidate) =>
              candidate.name === file.name &&
              candidate.size === file.size &&
              candidate.lastModified === file.lastModified,
          ) === index,
      );
    });
  }

  function removeFile(index: number) {
    setFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  async function submitMedia() {
    // Un média peut rester sans album, puis être classé dans « Médias à classer ».
    if (!files.length) {
      setError("Ajoute au moins une photo ou une vidéo.");
      return;
    }
    if (destination === "__new" && (!newAlbumTitle.trim() || !newAlbumDate)) {
      setError("Indique le nom et la date du nouvel album.");
      return;
    }

    setUploading(true);
    setError("");
    let duplicates = 0;

    try {
      let albumId = destination && destination !== "__new" ? destination : "";

      if (destination === "__new") {
        const response = await fetch("/api/admin/gallery/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newAlbumTitle,
            albumDate: newAlbumDate,
          }),
        });
        const result = (await response.json()) as ApiResult;
        if (!response.ok || !result.id) {
          throw new Error(result.message ?? result.error ?? "Impossible de créer l’album.");
        }
        albumId = result.id;
      }

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setProgress(`${index + 1} / ${files.length}`);

        const [hash, prepared] = await Promise.all([
          sha256(file),
          file.type.startsWith("image/")
            ? preparePhoto(file).catch(() => ({} as PreparedMedia))
            : prepareVideoPoster(file).catch(() => ({} as PreparedMedia)),
        ]);

        const ticketResponse = await fetch("/api/member/gallery/upload-ticket", { method: "POST" });
        const ticket = (await ticketResponse.json()) as ApiResult;
        if (!ticketResponse.ok || !ticket.uploadUrl) {
          throw new Error(ticket.message ?? "Impossible de préparer l’envoi.");
        }

        const formData = new FormData();
        formData.append("file", file);
        if (albumId) formData.append("albumId", albumId);
        formData.append("capturedAt", new Date().toISOString());
        formData.append("contentHash", hash);
        if (prepared.width) formData.append("width", String(prepared.width));
        if (prepared.height) formData.append("height", String(prepared.height));
        if (prepared.thumbnail) {
          formData.append("thumbnail", prepared.thumbnail, "thumbnail.webp");
        }
        if (prepared.preview) {
          formData.append("preview", prepared.preview, "preview.webp");
        }

        const uploadResponse = await fetch(ticket.uploadUrl, {
          method: "POST",
          body: formData,
        });
        const result = (await uploadResponse.json().catch(() => ({}))) as ApiResult;

        if (uploadResponse.status === 409 && result.duplicate) {
          duplicates += 1;
          continue;
        }
        if (!uploadResponse.ok) {
          throw new Error(result.error ?? result.message ?? `Impossible d’envoyer ${file.name}.`);
        }
      }

      setAddOpen(false);
      resetAddForm();
      router.refresh();
      if (duplicates) {
        window.alert(`${duplicates} doublon${duplicates > 1 ? "s" : ""} ignoré${duplicates > 1 ? "s" : ""}.`);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Une erreur est survenue.");
    } finally {
      setUploading(false);
      setProgress("");
    }
  }

  async function getVariantTicket(id: string) {
    const response = await fetch("/api/admin/gallery/media/variants-ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = (await response.json()) as ApiResult;
    if (!response.ok || !result.uploadUrl) throw new Error("Ticket d’optimisation impossible.");
    return result.uploadUrl;
  }

  async function optimizeExisting(item: Media) {
    let prepared: PreparedMedia;

    if (item.media_type === "photo") {
      const response = await fetch(mediaUrl(item.id, "original"));
      if (!response.ok) return false;
      prepared = await preparePhoto(await response.blob());
    } else {
      prepared = await prepareVideoPosterFromUrl(mediaUrl(item.id, "original"));
    }

    if (!prepared.thumbnail && !prepared.preview) return false;
    const uploadUrl = await getVariantTicket(item.id);
    const formData = new FormData();
    if (prepared.thumbnail) formData.append("thumbnail", prepared.thumbnail, "thumbnail.webp");
    if (prepared.preview) formData.append("preview", prepared.preview, "preview.webp");
    if (prepared.width) formData.append("width", String(prepared.width));
    if (prepared.height) formData.append("height", String(prepared.height));

    const response = await fetch(uploadUrl, { method: "POST", body: formData });
    return response.ok;
  }

  useEffect(() => {
    if (!canManage) return;
    const pending = media.filter((item) =>
      item.media_type === "photo"
        ? !item.has_thumbnail || !item.has_preview
        : !item.has_thumbnail,
    );
    if (!pending.length) return;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      let changed = false;
      for (const item of pending.slice(0, 4)) {
        if (cancelled) return;
        try {
          if (await optimizeExisting(item)) changed = true;
        } catch {
          // A legacy codec may not be drawable in the browser; keep the normal fallback.
        }
      }
      if (changed && !cancelled) router.refresh();
    }, 1400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [canManage, media, router]);

  async function deleteMedia(id: string) {
    if (!window.confirm("Supprimer définitivement ce média ?")) return;
    const response = await fetch("/api/admin/gallery/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      setOpenMediaId(null);
      router.refresh();
    }
  }

  async function deleteAlbum() {
    if (!selectedAlbum) return;
    if (!window.confirm(`Supprimer l’album « ${selectedAlbum.title} » ? Les médias seront à classer avant d’être visibles dans un autre album.`)) {
      return;
    }
    const response = await fetch("/api/admin/gallery/albums", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedAlbum.id }),
    });
    if (response.ok) {
      setSelectedAlbumId(null);
      setView("albums");
      router.refresh();
    }
  }

  function openMediaEditor() {
    if (!activeMedia) return;
    setEditTakenAt(dateInputValue(activeMedia.taken_at));
    setEditYear(activeMedia.year_override ? String(activeMedia.year_override) : "");
    setEditAlbumId(activeMedia.album_id ?? "");
    setEditNewAlbumTitle("");
    setEditNewAlbumDate(today());
    setEditMediaOpen(true);
  }

  async function saveMediaMetadata() {
    if (!activeMedia || savingMedia) return;
    if (editAlbumId === "__new" && (!editNewAlbumTitle.trim() || !editNewAlbumDate)) {
      window.alert("Renseignez le nom et la date du nouvel album.");
      return;
    }
    setSavingMedia(true);
    try {
      let targetAlbumId = editAlbumId;
      if (editAlbumId === "__new") {
        const createResponse = await fetch("/api/admin/gallery/albums", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: editNewAlbumTitle.trim(),
            albumDate: editNewAlbumDate,
          }),
        });
        const created = (await createResponse.json().catch(() => ({}))) as {
          id?: string;
          message?: string;
        };
        if (!createResponse.ok || !created.id) {
          throw new Error(created.message ?? "Impossible de créer l’album.");
        }
        targetAlbumId = created.id;
        // Garder l'album créé si la modification du média échoue : pas de doublon au nouvel essai.
        setEditAlbumId(created.id);
      }
      const response = await fetch("/api/admin/gallery/media", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: activeMedia.id,
          takenAt: editTakenAt || null,
          yearOverride: editTakenAt ? null : editYear ? Number(editYear) : null,
          albumId: targetAlbumId || null,
        }),
      });
      if (!response.ok) throw new Error("Impossible d’enregistrer.");
      setEditMediaOpen(false);
      router.refresh();
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "Impossible d’enregistrer.");
    } finally {
      setSavingMedia(false);
    }
  }

  function openAlbumEditor() {
    if (!selectedAlbum) return;
    setEditAlbumTitle(selectedAlbum.title);
    setEditAlbumDate(selectedAlbum.album_date);
    setEditAlbumActivity(selectedAlbum.activity ?? "");
    setEditAlbumDescription(selectedAlbum.description ?? "");
    setEditAlbumOpen(true);
  }

  async function saveAlbum() {
    if (!selectedAlbum || !editAlbumTitle.trim() || !editAlbumDate) return;
    setSavingAlbum(true);
    try {
      const response = await fetch("/api/admin/gallery/albums", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedAlbum.id,
          title: editAlbumTitle,
          albumDate: editAlbumDate,
          activity: editAlbumActivity,
          description: editAlbumDescription,
          coverMediaId: selectedAlbum.cover_media_id,
        }),
      });
      if (!response.ok) throw new Error("Impossible d’enregistrer l’album.");
      setEditAlbumOpen(false);
      router.refresh();
    } catch (caught) {
      window.alert(caught instanceof Error ? caught.message : "Impossible d’enregistrer.");
    } finally {
      setSavingAlbum(false);
    }
  }

  const title =
    view === "albums"
      ? year
        ? `Albums · ${year}`
        : "Albums"
      : view === "album"
        ? selectedAlbum?.title ?? "Album"
        : view === "unassigned"
          ? "Médias à classer"
        : view === "photos"
          ? "Photos"
          : view === "videos"
            ? "Vidéos"
            : year
              ? `Bibliothèque · ${year}`
              : "Bibliothèque";

  return (
    <>
      <div className="flex min-h-[calc(100vh-9rem)] rounded-2xl border border-slate-200 bg-white shadow-sm">
        <aside className="hidden w-52 shrink-0 border-r border-slate-200 bg-slate-50/70 p-3 md:block">
          <p className="px-3 pb-2 pt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Galerie</p>
          <nav className="space-y-1">
            <SidebarButton
              active={
                view === "albums" &&
                year === null
              }
              icon={FolderOpen}
              label="Albums"
              onClick={() => {
                setView("albums");
                setSelectedAlbumId(null);
                setYear(null);
              }}
            />
          </nav>

          {years.length > 0 && (
            <>
              <p className="px-3 pb-2 pt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Années</p>
              <nav className="space-y-1">
                {years.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setView("albums");
                      setSelectedAlbumId(null);
                      setYear(item);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${year === item ? "bg-white font-semibold text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </>
          )}

        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex min-h-20 flex-col items-stretch gap-3 border-b border-slate-200 px-5 py-4 sm:px-7">
            <div className="w-full min-w-0">
              <h1 className="break-words text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
              {view === "album" && selectedAlbum && (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-sm text-slate-500">
                    {formatAlbumDate(selectedAlbum.album_date)}{selectedAlbum.activity ? ` · ${selectedAlbum.activity}` : ""}
                  </p>
                  {canManage && !selectionMode && (
                    <button
                      type="button"
                      onClick={openAlbumEditor}
                      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-500"
                    >
                      <Pencil size={13} /> Modifier l’album et sa date
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {!selectionMode && (
                <div className="relative min-w-[170px] flex-1 sm:max-w-72">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Rechercher"
                    aria-label="Rechercher dans la galerie"
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Effacer la recherche"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              )}

              {view !== "albums" && (
                <div className="hidden rounded-lg border border-slate-200 p-1 sm:flex">
                  <button type="button" onClick={() => setLayout("grid")} className={`rounded-md p-2 ${layout === "grid" ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-700"}`} aria-label="Vue grille">
                    <Grid3X3 size={16} />
                  </button>
                  <button type="button" onClick={() => setLayout("list")} className={`rounded-md p-2 ${layout === "list" ? "bg-slate-100 text-slate-950" : "text-slate-400 hover:text-slate-700"}`} aria-label="Vue liste">
                    <List size={16} />
                  </button>
                </div>
              )}

              {view === "album" && selectedAlbum && filtered.length > 0 && !selectionMode && (
                <button
                  type="button"
                  disabled={downloadBusy}
                  onClick={downloadAlbum}
                  className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download size={16} /> {downloadBusy ? `ZIP ${downloadProgress}` : "Télécharger l’album"}
                </button>
              )}

              {canManage && view === "album" && selectedAlbum && !selectionMode && (
                <button type="button" onClick={deleteAlbum} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label="Supprimer l’album" title="Supprimer l’album">
                  <Trash2 size={17} />
                </button>
              )}

              {view !== "albums" && filtered.length > 0 && (
                selectionMode ? (
                  <>
                    <button
                      type="button"
                      onClick={toggleSelectAllVisible}
                      className="h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      {filtered.length > 0 &&
                      filtered.every((item) => selectedMediaIds.includes(item.id))
                        ? "Tout désélectionner"
                        : "Tout sélectionner"}
                    </button>

                    <span className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                      {selectedMediaIds.length} sélectionné{selectedMediaIds.length > 1 ? "s" : ""}
                    </span>
                    <button
                      type="button"
                      disabled={!selectedMediaIds.length || downloadBusy}
                      onClick={downloadSelectedMedia}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={16} /> {downloadBusy ? `ZIP ${downloadProgress}` : "Télécharger"}
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        disabled={!selectedMediaIds.length || moving}
                        onClick={() => startMove(selectedMediaIds)}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
                      >
                        <FolderOpen size={16} /> Déplacer
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        disabled={!selectedMediaIds.length || bulkDeleting}
                        onClick={deleteSelectedMedia}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} /> {bulkDeleting ? "Suppression…" : "Supprimer"}
                      </button>
                    )}

                    {bulkDeleting && bulkDeleteProgress.total > 0 && (
                      <div className="w-36">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-500">
                          <span>Suppression</span>
                          <span>
                            {bulkDeleteProgress.done}/{bulkDeleteProgress.total}
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
                            style={{
                              width: `${Math.round(
                                (bulkDeleteProgress.done /
                                  bulkDeleteProgress.total) *
                                  100,
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <button type="button" onClick={exitSelection} className="h-10 rounded-lg px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800">
                      Annuler
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setSelectionMode(true)} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Sélectionner
                  </button>
                )
              )}

              {canManage && !selectionMode && (
                <button type="button" onClick={() => {
                  // Si l'on ajoute depuis un album, le pré-sélectionner.
                  setDestination(view === "album" && selectedAlbum ? selectedAlbum.id : "");
                  setAddOpen(true);
                }} className="inline-flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
                  <Plus size={16} /> Ajouter
                </button>
              )}
            </div>
          </header>

          <div className="p-4 sm:p-6">
            {view === "albums" ? (
              <div className="space-y-5">
                {canManage && year === null && unassignedCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setView("unassigned");
                      setSelectedAlbumId(null);
                      setYear(null);
                      setSearchQuery("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left transition hover:bg-amber-100"
                  >
                    <FolderOpen size={20} className="text-amber-700" />
                    <span>
                      <span className="block text-sm font-semibold text-amber-950">Médias à classer</span>
                      <span className="block text-xs text-amber-800">{unassignedCount} média{unassignedCount > 1 ? "s" : ""} sans album</span>
                    </span>
                  </button>
                )}
                {canManage && !normalizedSearch && visibleAlbums.length > 1 && (
                  <p className="text-xs text-slate-500">
                    {orderingAlbums ? "Enregistrement de l’ordre…" : "Glissez un album sur un autre pour modifier leur ordre."}
                  </p>
                )}
                {(visibleAlbums.length > 0 || unassignedCount === 0 || !canManage || year !== null) && (
                  <AlbumGrid
                    albums={visibleAlbums}
                    media={media}
                    onOpen={showAlbum}
                    canReorder={canManage && !orderingAlbums && !normalizedSearch && visibleAlbums.length > 1}
                    draggedAlbumId={draggedAlbumId}
                    onDragStart={setDraggedAlbumId}
                    onDragEnd={() => setDraggedAlbumId(null)}
                    onDropAlbum={(id) => void reorderVisibleAlbum(id)}
                  />
                )}
              </div>
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : layout === "list" ? (
              <MediaList
                items={filtered}
                selectionMode={selectionMode}
                selectedIds={selectedMediaIds}
                canManage={canManage}
                menuMediaId={menuMediaId}
                onMenu={(id) => setMenuMediaId((current) => current === id ? null : id)}
                onSelect={selectOne}
                onMove={(id) => startMove([id])}
                onDelete={(id) => { setMenuMediaId(null); void deleteMedia(id); }}
                onOpen={(id) => setOpenMediaId(id)}
                onToggle={toggleSelection}
              />
            ) : (
              <div className="space-y-8">
                {groupedMedia.map(([label, items]) => (
                  <section key={label}>
                    <h2 className="mb-3 text-sm font-semibold capitalize text-slate-700">{label}</h2>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      {items.map((item) => (
                        <MediaTile
                          key={item.id}
                          item={item}
                          selectionMode={selectionMode}
                          selected={selectedMediaIds.includes(item.id)}
                          canManage={canManage}
                          menuOpen={menuMediaId === item.id}
                          onMenu={() => setMenuMediaId((current) => current === item.id ? null : item.id)}
                          onSelect={() => selectOne(item.id)}
                          onMove={() => startMove([item.id])}
                          onDelete={() => { setMenuMediaId(null); void deleteMedia(item.id); }}
                          onOpen={() => setOpenMediaId(item.id)}
                          onToggle={() => toggleSelection(item.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {addOpen && canManage && (
        <UploadModal
          albums={albums}
          files={files}
          destination={destination}
          newAlbumTitle={newAlbumTitle}
          newAlbumDate={newAlbumDate}
          uploading={uploading}
          progress={progress}
          error={error}
          onClose={closeAdd}
          onAddFiles={addFiles}
          onRemoveFile={removeFile}
          onDestination={setDestination}
          onNewAlbumTitle={setNewAlbumTitle}
          onNewAlbumDate={setNewAlbumDate}
          onSubmit={submitMedia}
        />
      )}

      {activeMedia && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/90 p-3" onWheel={handleViewerWheel} onClick={() => setOpenMediaId(null)}>
          <div className="relative flex h-full w-full max-w-7xl flex-col items-center justify-center" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={showPreviousMedia} className="absolute left-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:left-4" aria-label="Précédent">
              <ChevronLeft size={24} />
            </button>
            <button type="button" onClick={showNextMedia} className="absolute right-2 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20 sm:right-4" aria-label="Suivant">
              <ChevronRight size={24} />
            </button>

            <div className="min-h-0 flex flex-1 items-center justify-center px-12 pb-20 pt-12 sm:px-20">
              {activeMedia.media_type === "photo" ? (
                <img
                  src={mediaUrl(activeMedia.id, activeMedia.has_preview ? "preview" : "original")}
                  alt={activeMedia.original_filename}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <video
                  key={activeMedia.id}
                  src={mediaUrl(activeMedia.id, "original")}
                  poster={activeMedia.has_thumbnail ? mediaUrl(activeMedia.id, "thumb") : undefined}
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                  className="max-h-full max-w-full"
                />
              )}
            </div>

            <div className="absolute left-3 right-3 top-3 flex items-center justify-between text-white sm:left-5 sm:right-5">
              <span className="rounded-full bg-black/35 px-3 py-1.5 text-xs backdrop-blur">{activeIndex + 1} / {filtered.length}</span>
              <div className="flex gap-2">
                <a href={`${mediaUrl(activeMedia.id, "original")}&download=1`} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Télécharger">
                  <Download size={18} />
                </a>
                {canManage && (
                  <button type="button" onClick={() => deleteMedia(activeMedia.id)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-red-600" aria-label="Supprimer">
                    <Trash2 size={18} />
                  </button>
                )}
                <button type="button" onClick={() => setOpenMediaId(null)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/20" aria-label="Fermer">
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-4 rounded-xl bg-black/45 px-4 py-3 text-white backdrop-blur sm:bottom-5 sm:left-5 sm:right-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{activeMedia.original_filename}</p>
                <p className="mt-1 text-xs text-white/70">
                  {mediaDateLabel(activeMedia)} · {formatBytes(activeMedia.size_bytes)}
                  {activeMedia.width && activeMedia.height ? ` · ${activeMedia.width} × ${activeMedia.height}` : ""}
                  {activeMedia.album_title ? ` · ${activeMedia.album_title}` : ""}
                </p>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={openMediaEditor}
                  className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
                >
                  <Pencil size={15} /> Modifier les informations
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {moveIds.length > 0 && canManage && (
        <SimpleModal title={`Déplacer ${moveIds.length} média${moveIds.length > 1 ? "s" : ""}`} onClose={closeMove}>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Les fichiers et leurs dates seront conservés. Seul leur album sera modifié.</p>
            <Field label="Album de destination">
              <select
                value={moveDestination}
                disabled={moving}
                onChange={(event) => { setMoveDestination(event.target.value); setMoveError(""); }}
                className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choisir un album</option>
                <option value="__new">+ Créer un album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>{album.title} · {album.album_date.slice(0, 4)}</option>
                ))}
              </select>
            </Field>
            {moveDestination === "__new" && (
              <>
                <Field label="Nom du nouvel album">
                  <input value={moveNewAlbumTitle} disabled={moving} onChange={(event) => setMoveNewAlbumTitle(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" placeholder="Nom de l'album" />
                </Field>
                <Field label="Date de l'album">
                  <input type="date" value={moveNewAlbumDate} disabled={moving} onChange={(event) => setMoveNewAlbumDate(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm" />
                </Field>
              </>
            )}
            {moving && moveProgress.total > 0 && (
              <p className="text-sm font-medium text-slate-700" role="status">Déplacement : {moveProgress.done}/{moveProgress.total}</p>
            )}
            {moveError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{moveError}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" disabled={moving} onClick={closeMove} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-40">Annuler</button>
              <button type="button" disabled={moving || !moveDestination || (moveDestination === "__new" && (!moveNewAlbumTitle.trim() || !moveNewAlbumDate))} onClick={() => void moveSelectedMedia()} className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40">{moving ? "Déplacement…" : "Déplacer"}</button>
            </div>
          </div>
        </SimpleModal>
      )}

      {editMediaOpen && activeMedia && (
        <SimpleModal title="Informations du média" onClose={() => !savingMedia && setEditMediaOpen(false)}>
          <div className="space-y-4">
            <Field label="Date de prise / événement">
              <input type="date" value={editTakenAt} onChange={(event) => { setEditTakenAt(event.target.value); if (event.target.value) setEditYear(""); }} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
            </Field>
            <Field label="Année seulement si la date est inconnue">
              <input type="number" min="1900" max="2200" placeholder="2019" value={editYear} disabled={Boolean(editTakenAt)} onChange={(event) => setEditYear(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400" />
            </Field>
            <Field label="Album">
              <select value={editAlbumId} disabled={savingMedia} onChange={(event) => setEditAlbumId(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
                <option value="__new">+ Créer un nouvel album</option>
                <option value="">Sans album</option>
                {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
              </select>
            </Field>
            {editAlbumId === "__new" && (
              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <Field label="Nom du nouvel album">
                  <input value={editNewAlbumTitle} disabled={savingMedia} onChange={(event) => setEditNewAlbumTitle(event.target.value)} placeholder="Nom de l’album" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
                </Field>
                <Field label="Date du nouvel album">
                  <input type="date" value={editNewAlbumDate} disabled={savingMedia} onChange={(event) => setEditNewAlbumDate(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
                </Field>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditMediaOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Annuler</button>
              <button type="button" disabled={savingMedia} onClick={saveMediaMetadata} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">{savingMedia ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </SimpleModal>
      )}

      {editAlbumOpen && selectedAlbum && (
        <SimpleModal title="Modifier l’album" onClose={() => !savingAlbum && setEditAlbumOpen(false)}>
          <div className="space-y-4">
            <Field label="Nom"><input value={editAlbumTitle} onChange={(event) => setEditAlbumTitle(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" /></Field>
            <Field label="Date de l’album"><input type="date" value={editAlbumDate} onChange={(event) => setEditAlbumDate(event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" /></Field>
            <Field label="Activité"><input value={editAlbumActivity} onChange={(event) => setEditAlbumActivity(event.target.value)} placeholder="Concert" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" /></Field>
            <Field label="Description"><textarea value={editAlbumDescription} onChange={(event) => setEditAlbumDescription(event.target.value)} rows={3} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setEditAlbumOpen(false)} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Annuler</button>
              <button type="button" disabled={savingAlbum} onClick={saveAlbum} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">{savingAlbum ? "Enregistrement…" : "Enregistrer"}</button>
            </div>
          </div>
        </SimpleModal>
      )}
    </>
  );
}

function SidebarButton({ active, icon: Icon, label, onClick }: {
  active: boolean;
  icon: typeof Images;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition ${active ? "bg-white font-semibold text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white hover:text-slate-950"}`}>
      <Icon size={16} /> {label}
    </button>
  );
}

const videoDurationCache = new Map<string, number>();
const videoDurationPending = new Map<string, Promise<number | null>>();
const videoDurationQueue: Array<() => void> = [];
let videoDurationActive = 0;

function formatVideoDuration(seconds: number) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

const durationPillClass = "pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white shadow-sm";

function loadVideoDuration(id: string): Promise<number | null> {
  const cached = videoDurationCache.get(id);
  if (cached !== undefined) return Promise.resolve(cached);
  const pending = videoDurationPending.get(id);
  if (pending) return pending;

  const request = new Promise<number | null>((resolve) => {
    const run = () => {
      videoDurationActive += 1;
      const video = document.createElement("video");
      video.preload = "metadata";
      video.muted = true;
      video.playsInline = true;
      let finished = false;
      const timeout = window.setTimeout(() => finish(null), 9000);

      function finish(value: number | null) {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        video.onloadedmetadata = null;
        video.onerror = null;
        video.removeAttribute("src");
        video.load();
        if (value !== null) videoDurationCache.set(id, value);
        videoDurationActive -= 1;
        videoDurationPending.delete(id);
        const next = videoDurationQueue.shift();
        if (next) next();
        resolve(value);
      }

      video.onloadedmetadata = () => {
        const duration = video.duration;
        finish(Number.isFinite(duration) && duration > 0 ? duration : null);
      };
      video.onerror = () => finish(null);
      video.src = mediaUrl(id, "original");
    };

    if (videoDurationActive < 4) run();
    else videoDurationQueue.push(run);
  });
  videoDurationPending.set(id, request);
  return request;
}

// Les métadonnées sont demandées uniquement quand la miniature devient visible.
function VideoDurationBadge({ id }: { id: string }) {
  const [duration, setDuration] = useState<number | null>(() => videoDurationCache.get(id) ?? null);
  const badgeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let active = true;
    const cached = videoDurationCache.get(id);
    if (cached !== undefined) {
      setDuration(cached);
      return;
    }

    const node = badgeRef.current;
    if (!node) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void loadVideoDuration(id).then((value) => {
          if (active && value !== null) setDuration(value);
        });
      }
    }, { rootMargin: "160px" });
    observer.observe(node);
    return () => {
      active = false;
      observer.disconnect();
    };
  }, [id]);

  return (
    <span ref={badgeRef} aria-label={duration !== null ? `Durée ${formatVideoDuration(duration)}` : undefined} className={`${durationPillClass} ${duration !== null ? "opacity-100" : "opacity-0"}`}>
      {duration !== null ? formatVideoDuration(duration) : "0:00"}
    </span>
  );
}

function VideoPreview({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const [duration, setDuration] = useState<number | null>(() => videoDurationCache.get(id) ?? null);
  return (
    <>
      <video
        src={mediaUrl(id, "original")}
        muted
        playsInline
        preload="metadata"
        onLoadedMetadata={(event) => {
          const video =
            event.currentTarget;

          if (Number.isFinite(video.duration) && video.duration > 0) {
            videoDurationCache.set(id, video.duration);
            setDuration(video.duration);
          }

          if (
            Number.isFinite(
              video.duration,
            ) &&
            video.duration > 0.1
          ) {
            try {
              video.currentTime =
                Math.min(
                  0.2,
                  video.duration * 0.05,
                );
            } catch {
              // Première image disponible du navigateur.
            }
          }
        }}
        className={`h-full w-full object-cover ${
          compact
            ? ""
            : "transition duration-300"
        }`}
      />

      <PlayOverlay />
      {duration !== null && <span className={durationPillClass}>{formatVideoDuration(duration)}</span>}
    </>
  );
}

type MediaMenuHandlers = {
  canManage: boolean;
  menuOpen: boolean;
  onMenu: () => void;
  onSelect: () => void;
  onMove: () => void;
  onDelete: () => void;
};

function MediaActionsMenu({ item, canManage, menuOpen, onMenu, onSelect, onMove, onDelete, placement = "grid" }: { item: Media; placement?: "grid" | "list" } & MediaMenuHandlers) {
  return (
    <div
      data-gallery-media-menu
      className={`${placement === "grid" ? "absolute bottom-1.5 right-1.5 z-30" : "relative z-30"} ${menuOpen ? "opacity-100" : "[@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100"} transition-opacity`}
    >
      <button
        type="button"
        aria-label={`Actions pour ${item.original_filename}`}
        title="Actions"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        onClick={onMenu}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-950/60 text-white shadow-sm backdrop-blur transition hover:bg-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <MoreHorizontal size={17} />
      </button>
      {menuOpen && (
        <div role="menu" className="absolute bottom-full right-0 z-50 mb-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 text-slate-800 shadow-xl">
          <button type="button" role="menuitem" onClick={onSelect} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Sélectionner</button>
          <a role="menuitem" href={`${mediaUrl(item.id, "original")}&download=1`} onClick={onMenu} className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Télécharger</a>
          {canManage && (
            <>
              <button type="button" role="menuitem" onClick={onMove} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100">Déplacer vers un album</button>
              <button type="button" role="menuitem" onClick={onDelete} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Supprimer</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function MediaTile({ item, selectionMode, selected, onOpen, onToggle, ...menu }: {
  item: Media;
  selectionMode: boolean;
  selected: boolean;
  onOpen: () => void;
  onToggle: () => void;
} & MediaMenuHandlers) {
  return (
    <div className={`group relative aspect-square ${menu.menuOpen ? "z-40" : ""} ${selected ? "rounded-md ring-4 ring-blue-500 ring-offset-2" : ""}`}>
      <button
        type="button"
        onClick={selectionMode ? onToggle : onOpen}
        aria-label={selectionMode ? `Sélectionner ${item.original_filename}` : `Ouvrir ${item.original_filename}`}
        className="absolute inset-0 w-full overflow-hidden rounded-md bg-slate-100"
      >
        {item.media_type === "photo" ? (
          <img
            src={mediaUrl(item.id, item.has_thumbnail ? "thumb" : "original")}
            alt={item.original_filename}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : item.has_thumbnail ? (
          <>
            <img src={mediaUrl(item.id, "thumb")} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <PlayOverlay />
            <VideoDurationBadge id={item.id} />
          </>
        ) : (
          <VideoPreview id={item.id} />
        )}
      </button>
      {selectionMode ? (
        <button type="button" aria-label={selected ? "Désélectionner" : "Sélectionner"} onClick={onToggle} className={`absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm ${selected ? "border-blue-500 bg-blue-500 text-white" : "border-white bg-black/35 text-transparent backdrop-blur"}`}>
          ✓
        </button>
      ) : (
        <MediaActionsMenu item={item} {...menu} />
      )}
    </div>
  );
}

function PlayOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur"><Film size={18} /></div>
    </div>
  );
}

function MediaList({ items, selectionMode, selectedIds, onOpen, onToggle, canManage, menuMediaId, onMenu, onSelect, onMove, onDelete }: {
  items: Media[];
  selectionMode: boolean;
  selectedIds: string[];
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  canManage: boolean;
  menuMediaId: string | null;
  onMenu: (id: string) => void;
  onSelect: (id: string) => void;
  onMove: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200">
      <div className="hidden grid-cols-[32px_52px_minmax(0,2fr)_1fr_1fr_100px_90px] gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:grid">
        <span /> <span /> <span>Nom</span> <span>Date</span> <span>Album</span> <span>Type</span> <span className="text-right">Taille</span>
      </div>
      {items.map((item) => {
        const selected = selectedIds.includes(item.id);
        return (
          <div key={item.id} className={`group relative ${menuMediaId === item.id ? "z-40" : ""}`}>
            <button
              type="button"
              onClick={() => selectionMode ? onToggle(item.id) : onOpen(item.id)}
              className={`grid w-full grid-cols-[32px_48px_minmax(0,1fr)_auto] items-center gap-3 border-b border-slate-100 px-3 py-2 pr-14 text-left last:border-b-0 hover:bg-slate-50 sm:grid-cols-[32px_52px_minmax(0,2fr)_1fr_1fr_100px_90px] ${selected ? "bg-blue-50" : ""}`}
            >
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition ${selectionMode ? selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 bg-white text-transparent" : "invisible"}`} aria-hidden="true">✓</span>
              <div className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">
                {item.media_type === "photo" ? (
                  <img src={mediaUrl(item.id, item.has_thumbnail ? "thumb" : "original")} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : item.has_thumbnail ? (
                  <img src={mediaUrl(item.id, "thumb")} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <VideoPreview id={item.id} compact />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{item.original_filename}</p>
                <p className="mt-0.5 text-xs text-slate-400 sm:hidden">{mediaDateLabel(item)}</p>
              </div>
              <span className="hidden text-sm text-slate-500 sm:block">{mediaDateLabel(item)}</span>
              <span className="hidden truncate text-sm text-slate-500 sm:block">{item.album_title ?? "—"}</span>
              <span className="hidden truncate text-xs text-slate-500 sm:block" title={item.mime_type}>
                {item.mime_type.split("/")[1]?.toUpperCase() || (item.media_type === "photo" ? "Image" : "Vidéo")}
              </span>
              <span className="text-right text-xs text-slate-400 sm:text-sm">{formatBytes(item.size_bytes)}</span>
            </button>
            {!selectionMode && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <MediaActionsMenu
                  item={item}
                  placement="list"
                  canManage={canManage}
                  menuOpen={menuMediaId === item.id}
                  onMenu={() => onMenu(item.id)}
                  onSelect={() => onSelect(item.id)}
                  onMove={() => onMove(item.id)}
                  onDelete={() => onDelete(item.id)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function AlbumGrid({ albums, media, onOpen, canReorder, draggedAlbumId, onDragStart, onDragEnd, onDropAlbum }: {
  albums: Album[];
  media: Media[];
  onOpen: (id: string) => void;
  canReorder: boolean;
  draggedAlbumId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onDropAlbum: (id: string) => void;
}) {
  if (!albums.length) {
    return <div className="flex min-h-72 flex-col items-center justify-center text-center"><FolderOpen size={28} className="text-slate-300" /><p className="mt-3 text-sm text-slate-500">Aucun album pour le moment.</p></div>;
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {albums.map((album) => {
        const albumMedia = media.filter((item) => item.album_id === album.id);
        const cover = albumMedia.find((item) => item.id === album.cover_media_id) ?? albumMedia.find((item) => item.media_type === "photo") ?? albumMedia[0];

        return (
          <div
            key={album.id}
            draggable={canReorder}
            onDragStart={(event) => {
              if (!canReorder) return;
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", album.id);
              onDragStart(album.id);
            }}
            onDragOver={(event) => { if (canReorder) event.preventDefault(); }}
            onDrop={(event) => { event.preventDefault(); if (canReorder) onDropAlbum(album.id); }}
            onDragEnd={onDragEnd}
            className={`relative rounded-xl transition ${canReorder ? "cursor-grab active:cursor-grabbing" : ""} ${draggedAlbumId === album.id ? "opacity-60 ring-2 ring-blue-400" : ""}`}
          >
          <button type="button" onClick={() => onOpen(album.id)} className="group w-full text-left">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
              {canReorder && <span className="absolute right-2 top-2 z-10 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white">↕ Déplacer</span>}
              {cover ? (
                cover.media_type === "photo" ? (
                  <img src={mediaUrl(cover.id, cover.has_thumbnail ? "thumb" : "original")} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]" />
                ) : cover.has_thumbnail ? (
                  <><img src={mediaUrl(cover.id, "thumb")} alt="" loading="lazy" className="h-full w-full object-cover" /><PlayOverlay /><VideoDurationBadge id={cover.id} /></>
                ) : (
                  <VideoPreview id={cover.id} />
                )
              ) : (
                <div className="flex h-full items-center justify-center text-slate-300"><FolderOpen size={30} /></div>
              )}
            </div>
            <h3 className="mt-3 truncate text-sm font-semibold text-slate-900">{album.title}</h3>
            <p className="mt-1 text-xs text-slate-500">{album.media_count} élément{album.media_count !== 1 ? "s" : ""} · {formatAlbumDate(album.album_date)}</p>
          </button>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400"><Images size={22} /></div>
      <p className="mt-4 text-sm font-semibold text-slate-700">Aucun média</p>
      <p className="mt-1 text-sm text-slate-400">Les photos et vidéos apparaîtront ici.</p>
    </div>
  );
}

function UploadModal(props: {
  albums: Album[];
  files: File[];
  destination: string;
  newAlbumTitle: string;
  newAlbumDate: string;
  uploading: boolean;
  progress: string;
  error: string;
  onClose: () => void;
  onAddFiles: (files: FileList | File[]) => void;
  onRemoveFile: (index: number) => void;
  onDestination: (value: string) => void;
  onNewAlbumTitle: (value: string) => void;
  onNewAlbumDate: (value: string) => void;
  onSubmit: () => void;
}) {
  const {
    albums, files, destination, newAlbumTitle, newAlbumDate, uploading, progress, error,
    onClose, onAddFiles, onRemoveFile, onDestination, onNewAlbumTitle, onNewAlbumDate, onSubmit,
  } = props;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold text-slate-950">Ajouter à la galerie</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="space-y-6">
            {!files.length ? (
              <label onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); onAddFiles(event.dataTransfer.files); }} className="flex min-h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 text-center transition hover:border-slate-300 hover:bg-slate-100">
                <Images size={28} className="text-slate-400" />
                <p className="mt-4 text-sm font-semibold text-slate-800">Choisir des photos ou vidéos</p>
                <p className="mt-1 text-sm text-slate-400">ou les glisser ici</p>
                <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => { if (event.currentTarget.files) onAddFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
              </label>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <p className="text-sm font-medium text-slate-700">{files.length} fichier{files.length > 1 ? "s" : ""}</p>
                  <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    + Ajouter
                    <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" className="hidden" onChange={(event) => { if (event.currentTarget.files) onAddFiles(event.currentTarget.files); event.currentTarget.value = ""; }} />
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.size}-${file.lastModified}`} className="group relative aspect-square overflow-hidden rounded-lg bg-slate-100">
                      <LocalFilePreview file={file} />
                      <button type="button" onClick={() => onRemoveFile(index)} className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-red-600" aria-label="Retirer"><X size={15} /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-5">
              <label className="text-sm font-medium text-slate-700">Album <span className="font-normal text-slate-400">facultatif</span></label>
              <select value={destination} onChange={(event) => onDestination(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500">
                <option value="">Sans album (à classer plus tard)</option>
                <option value="__new">+ Créer un album</option>
                {albums.map((album) => <option key={album.id} value={album.id}>{album.title}</option>)}
              </select>
              {destination === "" && (
                <p className="mt-2 text-xs text-slate-500">Les médias envoyés sans album restent accessibles aux gestionnaires depuis Albums → Médias à classer.</p>
              )}
              {destination === "__new" && (
                <div className="mt-3 space-y-3">
                  <input value={newAlbumTitle} onChange={(event) => onNewAlbumTitle(event.target.value)} placeholder="Nom de l’album" aria-label="Nom du nouvel album" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
                  <label className="block text-sm text-slate-600">
                    Date du nouvel album
                    <input type="date" value={newAlbumDate} onChange={(event) => onNewAlbumDate(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500" />
                  </label>
                </div>
              )}

            </div>

            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
            {progress && <p className="text-sm font-medium text-blue-600">Préparation et envoi {progress}</p>}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button type="button" disabled={uploading} onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100">Annuler</button>
          <button type="button" disabled={uploading || !files.length} onClick={onSubmit} className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40">
            {uploading ? `Envoi ${progress}` : `Ajouter${files.length ? ` (${files.length})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function SimpleModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-sm font-medium text-slate-700">{label}</span><div className="mt-2">{children}</div></label>;
}
