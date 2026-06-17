import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const inputDir = "public/articles";
const outputDir = "public/articles-webp";

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const inputPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await walk(inputPath);
      continue;
    }

    if (!/\.(jpg|jpeg|png)$/i.test(entry.name)) continue;

    const relativePath = path.relative(inputDir, inputPath);
    const outputPath = path
      .join(outputDir, relativePath)
      .replace(/\.(jpg|jpeg|png)$/i, ".webp");

    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    await sharp(inputPath)
      .rotate()
      .resize({ width: 1200, withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(outputPath);

    console.log(outputPath);
  }
}

await walk(inputDir);