import { NextResponse } from "next/server";
import { createCustomer, deleteCustomers, listCustomers, updateCustomer } from "@/lib/store";

export async function GET() {
  return NextResponse.json(await listCustomers());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await createCustomer(body), { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await updateCustomer(String(body.id ?? ""), body));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json(await deleteCustomers(body));
  } catch (error) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Beklenmeyen bir hata oluştu.";
}
