"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui";

type SyncState = {
  desktop: boolean;
  enabled: boolean;
  appUrl: string;
  updatedAt: string;
  tursoDatabaseUrl: string;
  hasToken: boolean;
};

export function SyncSettingsPanel() {
  const router = useRouter();
  const [state, setState] = useState<SyncState | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [tursoDatabaseUrl, setTursoDatabaseUrl] = useState("");
  const [tursoAuthToken, setTursoAuthToken] = useState("");
  const [appUrl, setAppUrl] = useState("https://tahsilat-takip-4qrm.vercel.app");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/sync")
      .then((response) => response.json())
      .then((data: SyncState) => {
        setState(data);
        if (data.desktop) {
          setEnabled(data.enabled);
          setTursoDatabaseUrl(data.tursoDatabaseUrl ?? "");
          setAppUrl(data.appUrl || "https://tahsilat-takip-4qrm.vercel.app");
        }
      })
      .catch(() => setState({ desktop: false, enabled: false, appUrl: "", updatedAt: "", tursoDatabaseUrl: "", hasToken: false }));
  }, []);

  if (!state?.desktop) {
    return null;
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          enabled,
          tursoDatabaseUrl,
          tursoAuthToken,
          appUrl
        })
      });

      const data = (await response.json()) as { error?: string; status?: SyncState };

      if (!response.ok) {
        setError(data.error ?? "Kaydedilemedi.");
        return;
      }

      setMessage(enabled ? "Bulut senkronu açıldı. Değişiklikler anında paylaşılır." : "Bulut senkronu kapatıldı.");
      setTursoAuthToken("");
      if (data.status) {
        setState({
          ...state!,
          ...data.status,
          tursoDatabaseUrl,
          hasToken: Boolean(tursoAuthToken || state?.hasToken)
        });
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncNow() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync" })
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "Senkron başarısız.");
        return;
      }

      setMessage("Buluttan güncel veri alındı.");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Bulut Senkronizasyonu</h2>
        <p className="mt-1 text-sm text-slate-500">
          .exe ile web sürümü aynı Turso veritabanını kullanır. Kaydettiğiniz her değişiklik otomatik buluta gider.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 px-6 py-5 text-sm">
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <span className="font-medium text-slate-800">Bulut senkronunu aç</span>
        </label>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Turso Database URL</label>
          <input
            value={tursoDatabaseUrl}
            onChange={(event) => setTursoDatabaseUrl(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            placeholder="libsql://tahsilat-takip-....turso.io"
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Turso Token</label>
          <input
            type="password"
            value={tursoAuthToken}
            onChange={(event) => setTursoAuthToken(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
            placeholder={state.hasToken ? "Kayıtlı token var — değiştirmek için yazın" : "Turso token"}
          />
        </div>

        <div>
          <label className="mb-1 block font-medium text-slate-700">Web adresi</label>
          <input
            value={appUrl}
            onChange={(event) => setAppUrl(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs"
          />
        </div>

        {state.updatedAt ? (
          <p className="text-xs text-slate-500">
            Son ayar güncellemesi: {new Date(state.updatedAt).toLocaleString("tr-TR")}
          </p>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>

          {enabled ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleSyncNow}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Buluttan güncelle
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Senkron acilirken yerel ve bulut verisi karsilastirilir; daha dolu olan korunur. Bos .exe
          kurulumu buluttaki veriyi silmez. Emin degilseniz once webden kontrol edin.
        </div>
      </form>
    </Card>
  );
}
