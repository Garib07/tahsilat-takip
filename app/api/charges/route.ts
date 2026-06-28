import { NextResponse } from "next/server";
import { createCharge, deleteMonthlyCharges, generateMonthlyCharges, listCharges } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listCharges());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = body.generate
      ? await generateMonthlyCharges(body)
      : await createCharge(body);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await deleteMonthlyCharges(body));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
}
