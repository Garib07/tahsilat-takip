import { NextRequest, NextResponse } from "next/server";
import { getSyncStatus, saveSyncSettings, syncNow } from "@/lib/sync";
import { isDesktopApp } from "@/lib/sync-config";
import { readSyncConfig } from "@/lib/sync-config";

export async function GET() {
  if (!isDesktopApp()) {
    return NextResponse.json({ desktop: false, enabled: false });
  }

  const status = await getSyncStatus();
  const config = await readSyncConfig();

  return NextResponse.json({
    ...status,
    tursoDatabaseUrl: config?.tursoDatabaseUrl ?? "",
    hasToken: Boolean(config?.tursoAuthToken)
  });
}

export async function POST(request: NextRequest) {
  if (!isDesktopApp()) {
    return NextResponse.json({ error: "Yalnızca masaüstü uygulamasında kullanılabilir." }, { status: 403 });
  }

  const body = (await request.json()) as {
    action?: "save" | "sync";
    enabled?: boolean;
    tursoDatabaseUrl?: string;
    tursoAuthToken?: string;
    appUrl?: string;
  };

  if (body.action === "sync") {
    const status = await syncNow();
    return NextResponse.json({ ok: true, status });
  }

  const existing = await readSyncConfig();
  const token = String(body.tursoAuthToken ?? "").trim() || existing?.tursoAuthToken || "";

  const status = await saveSyncSettings({
    enabled: Boolean(body.enabled),
    tursoDatabaseUrl: String(body.tursoDatabaseUrl ?? existing?.tursoDatabaseUrl ?? ""),
    tursoAuthToken: token,
    appUrl: String(body.appUrl ?? existing?.appUrl ?? "")
  });

  return NextResponse.json({ ok: true, status });
}
