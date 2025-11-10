import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '..', 'public');

// Images to optimize with their target quality/size
const imagesToOptimize = [
  {
    input: 'imvestr_inputmethod.png',
    output: 'imvestr_inputmethod.png',
    type: 'png',
    quality: 80,
    maxWidth: 2000,
  },
  {
    input: 'imvestr_szenarien.png',
    output: 'imvestr_szenarien.png',
    type: 'png',
    quality: 80,
    maxWidth: 2000,
  },
  {
    input: 'imvestr_kpis.png',
    output: 'imvestr_kpis.png',
    type: 'png',
    quality: 80,
    maxWidth: 2000,
  },
  {
    input: 'imvestr_objektdaten.png',
    output: 'imvestr_objektdaten.png',
    type: 'png',
    quality: 80,
    maxWidth: 2000,
  },
  {
    input: 'hero-background.jpg',
    output: 'hero-background.jpg',
    type: 'jpeg',
    quality: 80,
    maxWidth: 2400,
  },
];

async function getFileSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function optimizeImage(config) {
  const inputPath = path.join(publicDir, config.input);
  const tempPath = path.join(publicDir, `temp_${config.output}`);
  const outputPath = path.join(publicDir, config.output);

  try {
    // Check if file exists
    const originalSize = await getFileSize(inputPath);
    if (originalSize === 0) {
      console.log(`⚠️  Skipping ${config.input} - file not found`);
      return;
    }

    console.log(`\n📸 Optimizing ${config.input} (${formatBytes(originalSize)})...`);

    // Process image
    let pipeline = sharp(inputPath);

    // Resize if needed
    const metadata = await pipeline.metadata();
    if (metadata.width && metadata.width > config.maxWidth) {
      pipeline = pipeline.resize(config.maxWidth, null, {
        withoutEnlargement: true,
        fit: 'inside',
      });
    }

    // Apply compression based on type
    if (config.type === 'jpeg') {
      pipeline = pipeline.jpeg({ quality: config.quality, progressive: true, mozjpeg: true });
    } else if (config.type === 'png') {
      pipeline = pipeline.png({
        quality: config.quality,
        compressionLevel: 9,
        palette: true,
      });
    }

    // Save to temp file first
    await pipeline.toFile(tempPath);

    const newSize = await getFileSize(tempPath);
    const reduction = ((originalSize - newSize) / originalSize * 100).toFixed(1);

    console.log(`✅ Optimized: ${formatBytes(originalSize)} → ${formatBytes(newSize)} (${reduction}% reduction)`);

    // Replace original with optimized version
    await fs.rename(tempPath, outputPath);

  } catch (error) {
    console.error(`❌ Error optimizing ${config.input}:`, error.message);

    // Clean up temp file if it exists
    try {
      await fs.unlink(tempPath);
    } catch {}
  }
}

async function main() {
  console.log('🚀 Starting image optimization...\n');

  let totalOriginalSize = 0;
  let totalNewSize = 0;

  for (const config of imagesToOptimize) {
    const inputPath = path.join(publicDir, config.input);
    const originalSize = await getFileSize(inputPath);

    await optimizeImage(config);

    const newSize = await getFileSize(path.join(publicDir, config.output));

    totalOriginalSize += originalSize;
    totalNewSize += newSize;
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total original size: ${formatBytes(totalOriginalSize)}`);
  console.log(`Total optimized size: ${formatBytes(totalNewSize)}`);
  console.log(`Total reduction: ${((totalOriginalSize - totalNewSize) / totalOriginalSize * 100).toFixed(1)}%`);
  console.log('✨ Optimization complete!\n');
}

main().catch(console.error);
