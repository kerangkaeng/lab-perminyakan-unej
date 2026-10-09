"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  BIDANG_LABEL,
  BIDANG_VALUES,
  LAB_ROLE_LABEL,
  type Bidang,
  type LabRoleType,
} from "@/lib/lab-roles";

export type UserLite = { id: string; nama: string; nim: string | null; nip: string | null; user_type: string | null };
export type Assignment = {
  id: string;
  role_type: LabRoleType;
  bidang: string | null;
  module_id: string | null;
  user: UserLite;
};
export type ModuleLite = { id: string; title: string };

type AssignInput = { roleType: LabRoleType; bidang?: Bidang; moduleId?: string; replace?: boolean };
type Ctx = {
  busy: boolean;
  assign: (user: UserLite, input: AssignInput) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
};

const ident = (u: UserLite) => u.nim ?? u.nip ?? "—";

const btn =
  "border border-line px-3 py-1.5 text-xs font-mono uppercase text-ink hover:bg-mist disabled:opacity-50";
const btnDanger = "text-xs font-mono uppercase text-red-700 hover:underline disabled:opacity-50";

/** Kotak pencarian user terdaftar (nama / NIM / NIP). */
function UserPicker({ onPick, onCancel, disabled }: { onPick: (u: UserLite) => void; onCancel: () => void; disabled: boolean }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UserLite[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setErr(null);
      return;
    }
    const mine = ++seq.current;
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/lab-roles/users?q=${encodeURIComponent(q.trim())}`);
        const body = await res.json().catch(() => ({}));
        if (mine !== seq.current) return;
        if (!res.ok) {
          setErr(body.error ?? "Gagal mencari user.");
          setResults([]);
        } else {
          setErr(null);
          setResults(body.users ?? []);
        }
      } catch {
        if (mine === seq.current) setErr("Gagal mencari user.");
      } finally {
        if (mine === seq.current) setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="mt-3 border border-line bg-paper p-3">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari nama, NIM, atau NIP (min. 2 huruf)"
          className="w-full border border-line bg-mist px-3 py-2 text-sm"
        />
        <button type="button" onClick={onCancel} className={btn}>
          Batal
        </button>
      </div>
      {err && <p className="mt-2 text-xs text-red-700">{err}</p>}
      {loading && <p className="mt-2 text-xs text-core">Mencari…</p>}
      {!loading && q.trim().length >= 2 && !err && results.length === 0 && (
        <p className="mt-2 text-xs text-core">Tidak ada user terdaftar yang cocok. User harus pernah login dulu.</p>
      )}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-line border border-line">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(u)}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-mist disabled:opacity-50"
              >
                <span className="min-w-0 truncate text-ink">{u.nama}</span>
                <span className="shrink-0 font-mono text-xs text-core">
                  {ident(u)}
                  {u.user_type ? ` · ${u.user_type}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Baris satu orang pemegang jabatan, dengan konfirmasi copot inline. */
function PersonRow({ a, ctx, selfId }: { a: Assignment; ctx: Ctx; selfId: string }) {
  const [confirm, setConfirm] = useState(false);
  const isSelfAdmin = a.role_type === "admin" && a.user.id === selfId;
  return (
    <li className="flex items-center justify-between gap-3 border border-line bg-mist px-3 py-2 text-sm">
      <span className="min-w-0">
        <span className="block truncate text-ink">{a.user.nama}</span>
        <span className="font-mono text-xs text-core">
          {ident(a.user)}
          {a.user.user_type ? ` · ${a.user.user_type}` : ""}
          {isSelfAdmin ? " · kamu" : ""}
        </span>
      </span>
      {isSelfAdmin ? null : confirm ? (
        <span className="flex shrink-0 items-center gap-2 text-xs">
          <span className="text-core">Copot?</span>
          <button type="button" disabled={ctx.busy} onClick={() => ctx.remove(a.id).then(() => setConfirm(false))} className={btnDanger}>
            Ya
          </button>
          <button type="button" onClick={() => setConfirm(false)} className="font-mono uppercase text-core hover:underline">
            Batal
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={ctx.busy}
          onClick={() => setConfirm(true)}
          aria-label={`Copot ${a.user.nama}`}
          className="shrink-0 text-core hover:text-red-700 disabled:opacity-50"
        >
          <Trash2 size={14} />
        </button>
      )}
    </li>
  );
}

/** Slot tunggal (Kepala Lab / Laboran per bidang). */
function SlotCard({
  roleType,
  bidang,
  holder,
  ctx,
  selfId,
}: {
  roleType: LabRoleType;
  bidang: Bidang;
  holder: Assignment | undefined;
  ctx: Ctx;
  selfId: string;
}) {
  const [picking, setPicking] = useState(false);
  const [pending, setPending] = useState<UserLite | null>(null);

  async function choose(u: UserLite) {
    if (holder && holder.user.id !== u.id) {
      setPending(u); // minta konfirmasi penggantian dulu
      return;
    }
    if (await ctx.assign(u, { roleType, bidang })) setPicking(false);
  }

  async function confirmReplace() {
    if (!pending) return;
    if (await ctx.assign(pending, { roleType, bidang, replace: true })) {
      setPending(null);
      setPicking(false);
    }
  }

  return (
    <div className="border border-line p-4">
      <p className="font-mono text-xs uppercase text-core">{BIDANG_LABEL[bidang]}</p>
      {holder ? (
        <ul className="mt-2">
          <PersonRow a={holder} ctx={ctx} selfId={selfId} />
        </ul>
      ) : (
        <p className="mt-2 text-sm text-core">Belum ditetapkan.</p>
      )}

      {pending ? (
        <div className="mt-3 border border-rig/40 bg-rig/5 p-3 text-sm">
          <p className="text-ink">
            Gantikan <strong>{holder?.user.nama}</strong> dengan <strong>{pending.nama}</strong> sebagai{" "}
            {LAB_ROLE_LABEL[roleType]} {BIDANG_LABEL[bidang]}? {holder?.user.nama} akan dicopot dari jabatan ini.
          </p>
          <div className="mt-2 flex gap-3">
            <button type="button" disabled={ctx.busy} onClick={confirmReplace} className={btn}>
              {ctx.busy ? "Menyimpan…" : "Ya, ganti"}
            </button>
            <button type="button" onClick={() => setPending(null)} className="text-xs font-mono uppercase text-core hover:underline">
              Batal
            </button>
          </div>
        </div>
      ) : picking ? (
        <UserPicker disabled={ctx.busy} onPick={choose} onCancel={() => setPicking(false)} />
      ) : (
        <button type="button" onClick={() => setPicking(true)} className={`${btn} mt-3`}>
          {holder ? "Ganti" : "Tetapkan"}
        </button>
      )}
    </div>
  );
}

/** Daftar orang (boleh banyak) dengan tombol tambah. */
function ListCard({
  title,
  items,
  ctx,
  selfId,
  onAdd,
  empty = "Belum ada.",
}: {
  title?: string;
  items: Assignment[];
  ctx: Ctx;
  selfId: string;
  onAdd: (u: UserLite) => Promise<boolean>;
  empty?: string;
}) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="border border-line p-4">
      {title && <p className="font-display font-semibold text-ink">{title}</p>}
      {items.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {items.map((a) => (
            <PersonRow key={a.id} a={a} ctx={ctx} selfId={selfId} />
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-core">{empty}</p>
      )}
      {picking ? (
        <UserPicker
          disabled={ctx.busy}
          onCancel={() => setPicking(false)}
          onPick={async (u) => {
            if (await onAdd(u)) setPicking(false);
          }}
        />
      ) : (
        <button type="button" onClick={() => setPicking(true)} className={`${btn} mt-3`}>
          Tambah
        </button>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      {hint && <p className="mb-4 mt-1 text-xs text-core">{hint}</p>}
      {!hint && <div className="mb-4" />}
      {children}
    </section>
  );
}

export function LabRolesManager({
  assignments,
  modules,
  currentUserId,
}: {
  assignments: Assignment[];
  modules: ModuleLite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function call(method: "POST" | "DELETE", url: string, body?: unknown, okMsg?: string): Promise<boolean> {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan.");
        return false;
      }
      if (okMsg) setNotice(okMsg);
      router.refresh();
      return true;
    } catch {
      setError("Gagal menghubungi server. Periksa koneksi kamu.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  const ctx: Ctx = {
    busy,
    assign: (user, i) =>
      call(
        "POST",
        "/api/admin/lab-roles",
        { user_id: user.id, role_type: i.roleType, bidang: i.bidang, module_id: i.moduleId, replace: i.replace },
        `${user.nama} ditetapkan sebagai ${LAB_ROLE_LABEL[i.roleType]}.`
      ),
    remove: (id) => call("DELETE", `/api/admin/lab-roles?id=${encodeURIComponent(id)}`, undefined, "Jabatan dicopot."),
  };

  const byType = (t: LabRoleType) => assignments.filter((a) => a.role_type === t);
  const slot = (t: LabRoleType, b: Bidang) => assignments.find((a) => a.role_type === t && a.bidang === b);
  const byModule = (t: LabRoleType, moduleId: string) =>
    assignments.filter((a) => a.role_type === t && a.module_id === moduleId);

  return (
    <div className="max-w-3xl">
      <p className="mb-6 text-sm text-core">
        Pilih jabatan dari user yang sudah terdaftar (pernah login). Hak akses mengikuti jabatan secara otomatis:
        Administrator, Kepala Lab, dan Laboran mendapat akses admin; Asisten Praktikum mendapat akses asisten; Dosen
        mendapat akses dosen. Perubahan akses ke atas berlaku setelah user login ulang.
      </p>

      <div aria-live="polite">
        {error && <p role="alert" className="mb-6 border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && !error && <p role="status" className="mb-6 border border-rig/40 bg-rig/5 px-4 py-3 text-sm text-rig">{notice}</p>}
      </div>

      <Section title="Kepala Laboratorium" hint="1 orang per bidang.">
        <div className="grid gap-4 sm:grid-cols-2">
          {BIDANG_VALUES.map((b) => (
            <SlotCard key={b} roleType="kepala_lab" bidang={b} holder={slot("kepala_lab", b)} ctx={ctx} selfId={currentUserId} />
          ))}
        </div>
      </Section>

      <Section title="Laboran / Teknisi" hint="1 orang per bidang.">
        <div className="grid gap-4 sm:grid-cols-2">
          {BIDANG_VALUES.map((b) => (
            <SlotCard key={b} roleType="laboran" bidang={b} holder={slot("laboran", b)} ctx={ctx} selfId={currentUserId} />
          ))}
        </div>
      </Section>

      <Section title="Dosen Peneliti">
        <ListCard
          items={byType("dosen_peneliti")}
          ctx={ctx}
          selfId={currentUserId}
          onAdd={(u) => ctx.assign(u, { roleType: "dosen_peneliti" })}
        />
      </Section>

      <Section title="Dosen MK Praktikum" hint="Tiap modul praktikum boleh punya lebih dari satu dosen.">
        {modules.length === 0 ? (
          <p className="text-sm text-core">Belum ada Modul Praktikum. Tambahkan dulu lewat menu Modul Praktikum.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((m) => (
              <ListCard
                key={m.id}
                title={m.title}
                items={byModule("dosen_mk", m.id)}
                ctx={ctx}
                selfId={currentUserId}
                onAdd={(u) => ctx.assign(u, { roleType: "dosen_mk", moduleId: m.id })}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Asisten Praktikum" hint="Tiap modul praktikum boleh punya lebih dari satu asisten.">
        {modules.length === 0 ? (
          <p className="text-sm text-core">Belum ada Modul Praktikum. Tambahkan dulu lewat menu Modul Praktikum.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {modules.map((m) => (
              <ListCard
                key={m.id}
                title={m.title}
                items={byModule("asisten", m.id)}
                ctx={ctx}
                selfId={currentUserId}
                onAdd={(u) => ctx.assign(u, { roleType: "asisten", moduleId: m.id })}
              />
            ))}
          </div>
        )}
      </Section>

      <Section title="Administrator Sistem" hint="Akses admin penuh, di luar jabatan di atas. Kamu tidak bisa mencopot akses adminmu sendiri.">
        <ListCard
          items={byType("admin")}
          ctx={ctx}
          selfId={currentUserId}
          onAdd={(u) => ctx.assign(u, { roleType: "admin" })}
        />
      </Section>
    </div>
  );
}
