#!/usr/bin/env node
/**
 * Image Optimization Script
 * 
 * Compresses product images and poster to reduce file sizes dramatically.
 * Uses sharp library for high-quality compression.
 * 
 * Usage:
 *   npm run optimize-images
 * 
 * Requirements:
 *   npm install sharp
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const BACKUP_DIR = path.join(PUBLIC_DIR, 'images-backup');

// Configuration
const CONFIG = {
  // Product images: max 400KB, 800px width
  products: {
    maxWidth: 800,
    quality: 80,
    format: 'jpeg'
  },
  // Hero poster: max 500KB, 1920px width
  poster: {
    maxWidth: 1920,
    quality: 75,
    format: 'webp'
  },
  // Logo: keep as PNG but optimize
  logo: {
    maxWidth: 512,
    quality: 90,
    format: 'png'
  }
};

async function optimizeImage(inputPath, outputPath, options) {
  const { maxWidth, quality, format } = options;
  
  try {
    const stats = fs.statSync(inputPath);
    const sizeBefore = stats.size;
    
    let pipeline = sharp(inputPath)
      .resize(maxWidth, null, { 
        withoutEnlargement: true,
        fit: 'inside'
      });
    
    if (format === 'webp') {
      pipeline = pipeline.webp({ quality });
    } else if (format === 'jpeg') {
      pipeline = pipeline.jpeg({ quality, progressive: true });
    } else if (format === 'png') {
      pipeline = pipeline.png({ compressionLevel: 9 });
    }
    
    await pipeline.toFile(outputPath);
    
    const sizeAfter = fs.statSync(outputPath).size;
    const reduction = ((sizeBefore - sizeAfter) / sizeBefore * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(inputPath)}: ${formatSize(sizeBefore)} → ${formatSize(sizeAfter)} (-${reduction}%)`);
    
    return { before: sizeBefore, after: sizeAfter };
  } catch (error) {
    console.error(`❌ Failed to optimize ${inputPath}:`, error.message);
    return null;
  }
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

async function main() {
  console.log('🖼️  Image Optimization Script\n');
  console.log('This will compress images in public/images and public/poster.jpg');
  console.log('Original images will be backed up to public/images-backup\n');
  
  // Check if sharp is installed
  try {
    require.resolve('sharp');
  } catch {
    console.error('❌ sharp is not installed. Run: npm install sharp');
    process.exit(1);
  }
  
  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log('📁 Created backup directory: public/images-backup\n');
  }
  
  let totalBefore = 0;
  let totalAfter = 0;
  
  // Backup and optimize product images
  if (fs.existsSync(IMAGES_DIR)) {
    const images = fs.readdirSync(IMAGES_DIR).filter(f => 
      f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
    );
    
    console.log(`\n📦 Optimizing ${images.length} product images...\n`);
    
    for (const image of images) {
      const inputPath = path.join(IMAGES_DIR, image);
      const backupPath = path.join(BACKUP_DIR, image);
      
      // Backup original
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(inputPath, backupPath);
      }
      
      // Optimize in place
      const tempPath = inputPath + '.tmp';
      const result = await optimizeImage(inputPath, tempPath, CONFIG.products);
      
      if (result) {
        fs.renameSync(tempPath, inputPath);
        totalBefore += result.before;
        totalAfter += result.after;
      }
    }
  }
  
  // Optimize poster.jpg → poster.webp
  const posterJpg = path.join(PUBLIC_DIR, 'poster.jpg');
  const posterWebp = path.join(PUBLIC_DIR, 'poster.webp');
  
  if (fs.existsSync(posterJpg)) {
    console.log('\n📦 Optimizing hero poster...\n');
    
    // Backup original
    const posterBackup = path.join(BACKUP_DIR, 'poster.jpg');
    if (!fs.existsSync(posterBackup)) {
      fs.copyFileSync(posterJpg, posterBackup);
    }
    
    const result = await optimizeImage(posterJpg, posterWebp, CONFIG.poster);
    
    if (result) {
      totalBefore += result.before;
      totalAfter += result.after;
      console.log('\n⚠️  Note: Update CSS to use poster.webp instead of poster.jpg');
    }
  }
  
  // Optimize logo
  const logoPng = path.join(PUBLIC_DIR, 'logo.png');
  if (fs.existsSync(logoPng)) {
    console.log('\n📦 Optimizing logo...\n');
    
    const logoBackup = path.join(BACKUP_DIR, 'logo.png');
    if (!fs.existsSync(logoBackup)) {
      fs.copyFileSync(logoPng, logoBackup);
    }
    
    const tempPath = logoPng + '.tmp';
    const result = await optimizeImage(logoPng, tempPath, CONFIG.logo);
    
    if (result) {
      fs.renameSync(tempPath, logoPng);
      totalBefore += result.before;
      totalAfter += result.after;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total before: ${formatSize(totalBefore)}`);
  console.log(`Total after:  ${formatSize(totalAfter)}`);
  console.log(`Total saved:  ${formatSize(totalBefore - totalAfter)} (${((totalBefore - totalAfter) / totalBefore * 100).toFixed(1)}%)`);
  console.log('\n✅ Optimization complete!');
  console.log('\n📝 Next steps:');
  console.log('  1. Update CSS to use poster.webp instead of poster.jpg');
  console.log('  2. Test the website to ensure images look good');
  console.log('  3. Original images backed up in public/images-backup/');
}

main().catch(console.error);
