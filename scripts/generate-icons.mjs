import { crc32, deflateSync } from "node:zlib";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outputDirectory = path.join(process.cwd(), "public", "icons");
await mkdir(outputDirectory, { recursive: true });

function writeChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32BE(data.length);
  const checksumBuffer = Buffer.alloc(4);
  checksumBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([lengthBuffer, typeBuffer, data, checksumBuffer]);
}

function drawRectangle(pixels, width, height, color, x, y, rectangleWidth, rectangleHeight) {
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(width, Math.round(x + rectangleWidth));
  const bottom = Math.min(height, Math.round(y + rectangleHeight));

  for (let row = top; row < bottom; row += 1) {
    for (let column = left; column < right; column += 1) {
      const offset = (row * width + column) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }
}

function createIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  drawRectangle(pixels, size, size, [46, 91, 255], 0, 0, size, size);
  const scale = size / 512;
  drawRectangle(pixels, size, size, [217, 255, 87], 120 * scale, 350 * scale, 272 * scale, 42 * scale);
  drawRectangle(pixels, size, size, [217, 255, 87], 164 * scale, 276 * scale, 220 * scale, 42 * scale);
  drawRectangle(pixels, size, size, [217, 255, 87], 208 * scale, 202 * scale, 176 * scale, 42 * scale);
  drawRectangle(pixels, size, size, [255, 101, 79], 112 * scale, 392 * scale, 288 * scale, 30 * scale);

  const scanlines = Buffer.alloc((size * 4 + 1) * size);
  for (let row = 0; row < size; row += 1) {
    const scanlineOffset = row * (size * 4 + 1);
    scanlines[scanlineOffset] = 0;
    pixels.copy(scanlines, scanlineOffset + 1, row * size * 4, (row + 1) * size * 4);
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    writeChunk("IHDR", header),
    writeChunk("IDAT", deflateSync(scanlines)),
    writeChunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const [fileName, size] of [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["icon-maskable-512.png", 512],
]) {
  await writeFile(path.join(outputDirectory, fileName), createIcon(size));
}

await writeFile(path.join(outputDirectory, "README.txt"), "Ícones gerados a partir de icon.svg.\n");
