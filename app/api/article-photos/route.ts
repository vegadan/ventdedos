import { readdir } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return NextResponse.json([]);
  }

  const folder = path.join(process.cwd(), "public", "articles", articleId);

  try {
    const files = await readdir(folder);

    const images = files
      .filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .map((file) => `/articles/${articleId}/${file}`);

    return NextResponse.json(images);
  } catch {
    return NextResponse.json([]);
  }
}