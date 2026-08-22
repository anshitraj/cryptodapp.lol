"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export type EditableListing = {
  id: string;
  name: string;
  description: string;
  icon_url: string | null;
  link: string;
};

export default function ListingEditor({
  bidId,
  listing,
}: {
  bidId: string;
  listing: EditableListing;
}) {
  const [name, setName] = useState(listing.name);
  const [description, setDescription] = useState(listing.description);
  const [iconUrl, setIconUrl] = useState(listing.icon_url ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("bidId", bidId);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setIconUrl(data.url);
      setSaved(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bidId, name, description, iconUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save");
      setSaved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center font-semibold text-green">
        Payment confirmed — you&apos;re on the board.
      </p>

      <div className="glass flex items-center gap-3 rounded-2xl p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-soft">
          {iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={iconUrl} alt="" className="h-full w-full object-cover" onError={(e) => (e.currentTarget.style.display = "none")} />
          ) : (
            <span className="text-lg font-bold text-blue">{(name || "?").charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-ink">{name || "Untitled"}</p>
          <p className="truncate text-sm text-ink-soft">{description || "No description yet"}</p>
        </div>
      </div>

      <p className="text-sm text-ink-faint">
        We pulled this from {listing.link} automatically — tweak it if it's not quite right.
      </p>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            className="glass rounded-xl px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-ink-soft">
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            rows={3}
            className="glass resize-none rounded-xl px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
          />
        </label>
        <div className="flex flex-col gap-1 text-sm text-ink-soft">
          Logo
          <div className="flex items-center gap-2">
            <input
              value={iconUrl}
              onChange={(e) => setIconUrl(e.target.value)}
              placeholder="https://… or upload a file"
              className="glass min-w-0 flex-1 rounded-xl px-4 py-2.5 text-[15px] text-ink outline-none focus:border-blue"
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploading}
              className="glass shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink hover:border-blue disabled:opacity-60"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          <p className="text-xs text-ink-faint">PNG, JPEG, WebP, GIF, or SVG — up to 2MB.</p>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving || uploading || !name.trim()}
          className="rounded-full bg-blue-claim px-6 py-3 font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
        </button>
        <Link href="/leaderboard" className="text-sm font-semibold text-ink-soft hover:text-ink">
          Looks good, take me to the board →
        </Link>
      </div>
    </div>
  );
}
