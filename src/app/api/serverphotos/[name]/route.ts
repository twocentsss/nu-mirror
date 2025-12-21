import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

const PHOTOS_DIR = path.join(process.cwd(), "src", "serverphotos");
const EXT_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function guessMime(fileName: string) {
  const ext = path.extname(fileName).toLowerCase();
  return EXT_MIME[ext] || "application/octet-stream";
}

export async function GET(_: NextRequest, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  const safeName = path.basename(name);
  const filePath = path.join(PHOTOS_DIR, safeName);
  try {
    const data = await fs.readFile(filePath);
    const mimeType = guessMime(safeName);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
