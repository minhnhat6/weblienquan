// Database Seed Script
// Populates categories and products from existing data

import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { categories, products } from '../src/lib/data';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL!;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn']
});

async function main() {
  console.log('🌱 Seeding database...\n');

  // Seed categories
  console.log('📁 Seeding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        slug: category.slug,
        icon: category.icon
      },
      create: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        icon: category.icon
      }
    });
  }
  console.log(`✅ Seeded ${categories.length} categories\n`);

  // Seed products
  console.log('📦 Seeding products...');
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        categoryId: product.categoryId,
        totalStock: product.totalStock,
        soldCount: product.soldCount,
        isHot: product.isHot,
        discount: product.discount,
        winRate: product.winRate,
        totalGold: product.totalGold,
        totalMatches: product.totalMatches,
        heroes: product.heroes,
        skins: product.skins,
        gems: product.gems,
        rank: product.rank,
        heroImages: product.heroImages || [],
        skinImages: product.skinImages || [],
        gemImages: product.gemImages || []
      },
      create: {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        categoryId: product.categoryId,
        totalStock: product.totalStock,
        soldCount: product.soldCount,
        isHot: product.isHot,
        discount: product.discount,
        winRate: product.winRate,
        totalGold: product.totalGold,
        totalMatches: product.totalMatches,
        heroes: product.heroes,
        skins: product.skins,
        gems: product.gems,
        rank: product.rank,
        heroImages: product.heroImages || [],
        skinImages: product.skinImages || [],
        gemImages: product.gemImages || []
      }
    });
  }
  console.log(`✅ Seeded ${products.length} products\n`);

  // Create sample account stock for testing
  console.log('🎮 Creating sample account stocks...');
  const sampleAccounts = [
    { productId: 1, accountData: JSON.stringify({ username: 'testaccount1', password: 'test123' }) },
    { productId: 1, accountData: JSON.stringify({ username: 'testaccount2', password: 'test123' }) },
    { productId: 2, accountData: JSON.stringify({ username: 'premiumacc1', password: 'test123' }) },
    { productId: 3, accountData: JSON.stringify({ username: 'basicacc1', password: 'test123' }) },
  ];

  for (const account of sampleAccounts) {
    await prisma.accountStock.create({
      data: account
    });
  }
  console.log(`✅ Created ${sampleAccounts.length} sample accounts\n`);

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
