import os from "node:os";

export async function GET() {
  const addresses: string[] = [];

  for (const interfaces of Object.values(os.networkInterfaces())) {
    for (const item of interfaces ?? []) {
      if (item.family === "IPv4" && !item.internal) {
        addresses.push(item.address);
      }
    }
  }

  const port = Number(process.env.PORT) || 3000;

  return Response.json({
    addresses: [...new Set(addresses)],
    port
  });
}
