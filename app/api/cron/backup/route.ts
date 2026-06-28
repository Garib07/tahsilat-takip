import { NextResponse } from "next/server";
import { createDatabaseBackup, isCloudStorageEnabled } from "@/lib/storage";

export async function GET() {
  if (!isCloudStorageEnabled()) {
    return NextResponse.json({ skipped: true, reason: "Bulut depolama aktif değil." });
  }

  const backup = await createDatabaseBackup();
  return NextResponse.json({ ok: true, backup });
}
