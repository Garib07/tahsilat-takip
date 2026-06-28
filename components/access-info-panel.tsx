"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui";

type NetworkInfo = {
  addresses: string[];
  port: number;
};

export function AccessInfoPanel() {
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);

    fetch("/api/network")
      .then((response) => response.json())
      .then((data: NetworkInfo) => setNetwork(data))
      .catch(() => setNetwork(null));
  }, []);

  const port = network?.port ?? 3000;
  const lanUrls = (network?.addresses ?? []).map((address) => `http://${address}:${port}`);

  return (
    <Card className="mt-6">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-900">Bilgisayar ve Telefon Erişimi</h2>
        <p className="mt-1 text-sm text-slate-500">
          Veriler bu bilgisayarda kalır. Telefondan erişim için aynı Wi-Fi ağı yeterlidir; ayrı mobil
          uygulama gerekmez.
        </p>
      </div>

      <div className="space-y-4 px-6 py-5 text-sm">
        <div>
          <p className="font-medium text-slate-800">Bu bilgisayarda</p>
          <p className="mt-1 font-mono text-slate-600">http://localhost:{port}</p>
          <p className="mt-1 text-slate-500">
            Masaüstü kurulumunda uygulama açıldığında otomatik başlar; tarayıcı sürümünde
            Tahsilat-Takip-Baslat.bat kullanılır.
          </p>
        </div>

        <div>
          <p className="font-medium text-slate-800">Telefondan (aynı Wi-Fi)</p>
          {lanUrls.length ? (
            <ul className="mt-2 space-y-1">
              {lanUrls.map((url) => (
                <li key={url}>
                  <a href={url} className="font-mono text-emerald-700 hover:underline">
                    {url}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-slate-500">
              Ağ adresi alınamadı. Sunucu çalışırken telefon tarayıcısına bilgisayarın IP adresini
              yazın: http://192.168.x.x:{port}
            </p>
          )}
          <p className="mt-2 text-slate-500">
            Bilgisayar açık ve program çalışır durumda olmalıdır. Windows Güvenlik Duvarı izin
            isterse Node.js için ağ erişimine izin verin.
          </p>
        </div>

        {origin ? (
          <div>
            <p className="font-medium text-slate-800">Şu an bağlı olduğunuz adres</p>
            <p className="mt-1 font-mono text-slate-600">{origin}</p>
          </div>
        ) : null}

        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
          Güvenlik: Bu erişim yalnızca yerel ağ içindir. Güvenmediğiniz ağlarda kullanmayın.
        </div>
      </div>
    </Card>
  );
}
