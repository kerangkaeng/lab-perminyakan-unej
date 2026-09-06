"use client";

import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer, NodeViewWrapper } from "@tiptap/react";
import { useCallback, useRef, useState } from "react";

// Extend Image bawaan Tiptap supaya punya atribut `width` yang ikut
// tersimpan ke HTML (style="width:...px") — jadi ukurannya tetap terbawa
// saat konten dibaca ulang di halaman publik (bukan cuma di editor).
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { style: `width: ${attributes.width}px` };
        },
        parseHTML: (element) => {
          const style = element.getAttribute("style") || "";
          const match = style.match(/width:\s*(\d+)px/);
          return match ? parseInt(match[1], 10) : null;
        },
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});

function ResizableImageView({ node, updateAttributes, selected }: any) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = imgRef.current?.getBoundingClientRect().width ?? 300;
      setResizing(true);

      function onMove(ev: PointerEvent) {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(80, Math.round(startWidth + delta));
        setLiveWidth(newWidth);
        updateAttributes({ width: newWidth });
      }
      function onUp() {
        setResizing(false);
        setLiveWidth(null);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      }
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper as="span" className="relative inline-block align-top" style={{ maxWidth: "100%" }}>
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        style={{
          width: node.attrs.width ? `${node.attrs.width}px` : "100%",
          maxWidth: "100%",
          display: "block",
        }}
        className={selected ? "outline outline-2 outline-rig" : ""}
        draggable={false}
      />
      <span
        onPointerDown={onPointerDown}
        title="Seret untuk mengubah ukuran"
        className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize border-2 border-paper bg-rig shadow"
        style={{ touchAction: "none" }}
      />
      {resizing && liveWidth && (
        <span className="absolute -top-6 right-0 whitespace-nowrap bg-ink px-1.5 py-0.5 font-mono text-[10px] text-paper">
          {liveWidth}px
        </span>
      )}
    </NodeViewWrapper>
  );
}
