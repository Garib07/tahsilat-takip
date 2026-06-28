import { NextResponse } from "next/server";
import { getSummary } from "@/lib/store";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    return NextResponse.json(await getSummary({ year, month }));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
}
