"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { useRef, useState } from "react";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Quote,
  LinkIcon,
  ImageIcon,
  Undo,
  Redo,
} from "lucide-react";

export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-petrol underline" } }),
      Image,
      Placeholder.configure({ placeholder: "Tulis isi berita di sini..." }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-news min-h-[240px] px-4 py-3 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  async function handleImageButtonClick() {
    fileInputRef.current?.click();
  }

  async function handleImageSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;

    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/news/upload-image", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      alert("Gagal mengunggah gambar.");
      return;
    }
    const { url } = await res.json();
    editor.chain().focus().setImage({ src: url }).run();
  }

  function handleSetLink() {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Masukkan URL tautan:", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `p-2 border border-line ${active ? "bg-petrol text-paper border-petrol" : "text-ink hover:border-petrol"}`;

  return (
    <div className="border border-line bg-mist">
      <div className="flex flex-wrap gap-1 border-b border-line p-2">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive("bold"))}>
          <Bold size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive("italic"))}>
          <Italic size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive("heading", { level: 2 }))}>
          <Heading2 size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive("bulletList"))}>
          <List size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive("orderedList"))}>
          <ListOrdered size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive("blockquote"))}>
          <Quote size={15} />
        </button>
        <button type="button" onClick={handleSetLink} className={btnClass(editor.isActive("link"))}>
          <LinkIcon size={15} />
        </button>
        <button type="button" onClick={handleImageButtonClick} disabled={uploading} className={btnClass(false)}>
          <ImageIcon size={15} />
        </button>
        <span className="mx-1 w-px bg-line" />
        <button type="button" onClick={() => editor.chain().focus().undo().run()} className={btnClass(false)}>
          <Undo size={15} />
        </button>
        <button type="button" onClick={() => editor.chain().focus().redo().run()} className={btnClass(false)}>
          <Redo size={15} />
        </button>
        {uploading && <span className="ml-2 self-center text-xs text-core">Mengunggah gambar...</span>}
      </div>

      <EditorContent editor={editor} />

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
    </div>
  );
}
