import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = 'C:/Users/jp074/Code Playground/jewels/src/imports';

async function run() {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png')) {
      const input = path.join(dir, file);
      // Clean up the name a bit to remove double extensions if any
      const baseName = file.replace(/\.png$/, '').replace(/\.jpg$/, '');
      const output = path.join(dir, `${baseName}.webp`);
      
      console.log(`Converting ${file} -> ${baseName}.webp...`);
      await sharp(input).webp({ quality: 80 }).toFile(output);
      
      const inStat = fs.statSync(input);
      const outStat = fs.statSync(output);
      console.log(`  Size reduced from ${(inStat.size / 1024 / 1024).toFixed(2)}MB to ${(outStat.size / 1024).toFixed(2)}KB`);
    }
  }
}
run();
