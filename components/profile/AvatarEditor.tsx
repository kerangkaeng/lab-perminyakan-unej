"use client";

import { useEffect, useRef, useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";

const OUT_SIZE = 512; // hasil akhir 512x512 px
const MAX_ZOOM = 4;

type Pt = { x: number; y: number };

/**
 * Editor crop foto profil ala media sosial: geser untuk memposisikan,
 * slider / scroll / cubit untuk zoom, hasilnya dipotong persegi 512x512
 * (ditampilkan bulat) dan dikompres jadi WebP/JPEG kecil sebelum diunggah.
 */
export function AvatarEditor({
  file,
  busy,
  onCancel,
  onSave,
}: {
  file: File;
  busy: boolean;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [V, setV] = useState(280); // sisi area crop (px)
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState<Pt>({ x: 0, y: 0 });

  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Pt>());
  const pinch = useRef<{ dist: number; zoom: number } | null>(null);
  const zoomRef = useRef(1);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const vRef = useRef(280);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      imgRef.current = im;
      setImg(im);
    };
    im.onerror = () => setLoadError(true);
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const v = Math.max(200, Math.min(280, window.innerWidth - 96));
    vRef.current = v;
    setV(v);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [busy, onCancel]);

  function baseScale(): number {
    const im = imgRef.current;
    return im ? vRef.current / Math.min(im.naturalWidth, im.naturalHeight) : 1;
  }

  function clampPos(p: Pt, z: number): Pt {
    const im = imgRef.current;
    if (!im) return p;
    const s = baseScale() * z;
    const mx = Math.max(0, (im.naturalWidth * s - vRef.current) / 2);
    const my = Math.max(0, (im.naturalHeight * s - vRef.current) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }

  function applyZoom(z: number) {
    const nz = Math.min(MAX_ZOOM, Math.max(1, z));
    zoomRef.current = nz;
    setZoom(nz);
    setPos((p) => clampPos(p, nz));
  }

  // Scroll mouse = zoom (listener non-passive supaya halaman tidak ikut scroll).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      applyZoom(zoomRef.current * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [img]);

  function onPointerDown(e: React.PointerEvent) {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const [a, b] = Array.from(pointers.current.values());
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: zoomRef.current };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, cur);

    if (pointers.current.size === 1) {
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      setPos((p) => clampPos({ x: p.x + dx, y: p.y + dy }, zoomRef.current));
    } else if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = Array.from(pointers.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch.current.dist > 0) applyZoom(pinch.current.zoom * (dist / pinch.current.dist));
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    pointers.current.delete(e.pointerId);
    pinch.current = null;
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const step = 12;
    const d: Record<string, Pt> = {
      ArrowLeft: { x: step, y: 0 },
      ArrowRight: { x: -step, y: 0 },
      ArrowUp: { x: 0, y: step },
      ArrowDown: { x: 0, y: -step },
    };
    const m = d[e.key];
    if (m) {
      e.preventDefault();
      setPos((p) => clampPos({ x: p.x + m.x, y: p.y + m.y }, zoomRef.current));
    } else if (e.key === "+" || e.key === "=") applyZoom(zoomRef.current * 1.1);
    else if (e.key === "-") applyZoom(zoomRef.current / 1.1);
  }

  async function save() {
    if (!img) return;
    const s = baseScale() * zoom;
    const size = V / s;
    const sx = img.naturalWidth / 2 + (-V / 2 - pos.x) / s;
    const sy = img.naturalHeight / 2 + (-V / 2 - pos.y) / s;

    const canvas = document.createElement("canvas");
    canvas.width = OUT_SIZE;
    canvas.height = OUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff"; // PNG transparan -> latar putih
    ctx.fillRect(0, 0, OUT_SIZE, OUT_SIZE);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, size, size, 0, 0, OUT_SIZE, OUT_SIZE);

    const toBlob = (type: string, q: number) =>
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, q));
    let blob = await toBlob("image/webp", 0.88);
    if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg", 0.9);
    if (blob) onSave(blob);
  }

  const s = img ? baseScale() * zoom : 1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Atur foto profil"
        className="w-full max-w-sm bg-paper p-5 shadow-2xl"
      >
        <h2 className="font-display text-lg font-semibold text-ink">Atur foto profil</h2>
        <p className="mt-1 text-xs text-core">Geser untuk memposisikan, atur zoom dengan slider.</p>

        {loadError ? (
          <p className="my-8 text-sm text-red-700">
            Foto tidak bisa dibuka. Pastikan formatnya JPG, PNG, atau WebP (bukan HEIC).
          </p>
        ) : (
          <>
            <div className="mt-4 flex justify-center">
              <div
                ref={viewportRef}
                tabIndex={0}
                onKeyDown={onKeyDown}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="relative cursor-grab touch-none select-none overflow-hidden bg-ink outline-none focus-visible:ring-2 focus-visible:ring-rig active:cursor-grabbing"
                style={{ width: V, height: V }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.src}
                    alt=""
                    draggable={false}
                    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
                    style={{
                      width: img.naturalWidth * s,
                      height: img.naturalHeight * s,
                      transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
                    }}
                  />
                ) : (
                  <p className="flex h-full items-center justify-center text-xs text-white/70">Memuat foto…</p>
                )}
                {/* Mask bulat: area di luar lingkaran digelapkan */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-full border-2 border-white/90"
                  style={{ boxShadow: "0 0 0 999px rgba(11,18,32,0.6)" }}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 text-core">
              <ZoomOut size={16} aria-hidden />
              <input
                type="range"
                min={1}
                max={MAX_ZOOM}
                step={0.01}
                value={zoom}
                disabled={!img || busy}
                onChange={(e) => applyZoom(parseFloat(e.target.value))}
                aria-label="Zoom"
                className="h-1 w-full cursor-pointer accent-[#0B3B4E]"
              />
              <ZoomIn size={16} aria-hidden />
            </div>
          </>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="border border-line px-4 py-2 text-xs font-mono uppercase text-ink hover:bg-mist disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!img || busy}
            className="bg-rig px-4 py-2 text-xs font-mono uppercase text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Menyimpan…" : "Simpan foto"}
          </button>
        </div>
      </div>
    </div>
  );
}
