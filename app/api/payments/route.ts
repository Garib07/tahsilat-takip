import { NextResponse } from "next/server";
import { createPayment, listPayments } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listPayments());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await createPayment(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
}
