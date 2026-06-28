import { Card } from "@/components/ui";
import { listDatabaseBackups } from "@/lib/storage";

export async function CloudInfoPanel() {
  const backups = await listDatabaseBackups(5);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <Card className="mt-6">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Bulut Erişimi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Veriler Turso bulut veritabanında saklanır. HTTPS ve giriş koruması aktiftir.
        </p>
      </div>

      <div className="space-y-4 px-6 py-5 text-sm">
        {appUrl ? (
          <div>
            <p className="font-medium text-slate-800">Uygulama adresi</p>
            <a href={appUrl} className="mt-1 inline-block font-mono text-emerald-700 hover:underline">
              {appUrl}
            </a>
            <p className="mt-1 text-slate-500">
              Bilgisayar, telefon ve tabletten bu adresle erişebilirsiniz.
            </p>
          </div>
        ) : (
          <p className="text-slate-500">
            Vercel ortam değişkenlerine NEXT_PUBLIC_APP_URL ekleyin (ör. https://tahsilat.vercel.app).
          </p>
        )}

        <div>
          <p className="font-medium text-slate-800">Otomatik yedekleme</p>
          <p className="mt-1 text-slate-500">Her gece 03:00&apos;te son 30 yedek saklanır.</p>
          {backups.length ? (
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-600">
              {backups.map((backup) => (
                <li key={backup.id}>
                  #{backup.id} · {new Date(backup.createdAt).toLocaleString("tr-TR")}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate-500">Henüz yedek kaydı yok.</p>
          )}
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-900">
          Oturum 8 saat sonra otomatik kapanır. Güçlü bir şifre kullanın.
        </div>
      </div>
    </Card>
  );
}
