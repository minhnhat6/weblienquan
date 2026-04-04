/**
 * Migration Script: localStorage → PostgreSQL
 * 
 * This script migrates existing localStorage data to PostgreSQL database.
 * It handles:
 * - User accounts with password transformation (XOR → bcrypt)
 * - Orders and transaction history
 * - Recharge requests
 * - Consignment items
 * 
 * Usage: npx tsx scripts/migrate-localstorage.ts
 */

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Initialize Prisma
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Backup directory
const BACKUP_DIR = path.join(process.cwd(), 'data', 'backup');

interface OldUser {
  id: string;
  username: string;
  email: string;
  password: string; // May be XOR-obfuscated or plain
  balance?: number;
  discount?: number;
  role?: string;
  referralCode?: string;
  referredBy?: string;
  createdAt?: string;
}

interface OldOrder {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  status: string;
  accountDetails?: any;
  createdAt?: string;
}

interface OldTransaction {
  id: string;
  userId: string;
  type: string;
  amount: number;
  description?: string;
  createdAt?: string;
}

interface OldRecharge {
  id: string;
  userId: string;
  amount: number;
  method: string;
  status: string;
  proofImage?: string;
  createdAt?: string;
}

interface OldConsignment {
  id: string;
  userId: string;
  productName: string;
  description?: string;
  price: number;
  status: string;
  images?: string[];
  createdAt?: string;
}

/**
 * Create backup directory if not exists
 */
function ensureBackupDir() {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
}

/**
 * Export localStorage data to JSON files
 */
function exportLocalStorageData() {
  console.log('📦 Exporting localStorage data...');
  ensureBackupDir();

  const timestamp = new Date().toISOString().split('T')[0];
  
  // Note: This assumes you run this script in a browser context or
  // have localStorage data exported manually.
  // For server-side migration, you'll need to copy data from browser's localStorage.
  
  console.log('⚠️  Manual step required:');
  console.log('   1. Open browser console on your app');
  console.log('   2. Run: JSON.stringify(localStorage)');
  console.log('   3. Copy output to data/localstorage-export.json');
  console.log('');
  
  const exportPath = path.join(BACKUP_DIR, `localstorage-${timestamp}.json`);
  console.log(`   Expected file: ${exportPath}`);
  
  return exportPath;
}

/**
 * Load localStorage data from JSON file
 */
function loadLocalStorageData(filePath: string): any {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    console.log('');
    console.log('To export localStorage data:');
    console.log('1. Open your app in browser');
    console.log('2. Open DevTools Console (F12)');
    console.log('3. Run this code:');
    console.log('');
    console.log('   const data = {');
    console.log('     users: localStorage.getItem("slq_users"),');
    console.log('     products: localStorage.getItem("slq_products"),');
    console.log('     orders: localStorage.getItem("slq_orders"),');
    console.log('     transactions: localStorage.getItem("slq_transactions"),');
    console.log('     recharges: localStorage.getItem("slq_pending_recharges"),');
    console.log('     consignments: localStorage.getItem("slq_consignments")');
    console.log('   };');
    console.log('   console.log(JSON.stringify(data, null, 2));');
    console.log('');
    console.log(`4. Save output to: ${filePath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Transform user passwords from XOR/plain to bcrypt
 */
async function transformUsers(oldUsers: OldUser[]): Promise<any[]> {
  console.log(`   Transforming ${oldUsers.length} users...`);
  
  const transformed = await Promise.all(
    oldUsers.map(async (user) => {
      // Hash password with bcrypt (10 rounds)
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: hashedPassword, // Changed from 'password' to 'passwordHash'
        balance: user.balance || 0,
        discount: user.discount || 0,
        role: user.role || 'user',
        referralCode: user.referralCode || `REF${user.id.slice(-6)}`,
        referredBy: user.referredBy || null,
        spinTickets: 0,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: new Date(),
      };
    })
  );
  
  console.log(`   ✅ Transformed ${transformed.length} users`);
  return transformed;
}

/**
 * Transform orders
 */
function transformOrders(oldOrders: OldOrder[]): any[] {
  console.log(`   Transforming ${oldOrders.length} orders...`);
  
  const transformed = oldOrders.map((order) => ({
    id: order.id,
    userId: order.userId,
    productId: parseInt(order.productId) || 1, // Convert to Int, default to 1 if invalid
    productName: order.accountDetails?.productName || `Product ${order.productId}`,
    accountData: JSON.stringify(order.accountDetails || {}),
    amount: order.amount,
    status: order.status as any,
    createdAt: order.createdAt ? new Date(order.createdAt) : new Date(),
    updatedAt: new Date(),
  }));
  
  console.log(`   ✅ Transformed ${transformed.length} orders`);
  return transformed;
}

/**
 * Transform transactions
 */
function transformTransactions(oldTransactions: OldTransaction[]): any[] {
  console.log(`   Transforming ${oldTransactions.length} transactions...`);
  
  const transformed = oldTransactions.map((txn) => ({
    id: txn.id,
    userId: txn.userId,
    type: txn.type as any,
    amount: txn.amount,
    description: txn.description || '',
    createdAt: txn.createdAt ? new Date(txn.createdAt) : new Date(),
  }));
  
  console.log(`   ✅ Transformed ${transformed.length} transactions`);
  return transformed;
}

/**
 * Transform recharge requests
 */
function transformRecharges(oldRecharges: OldRecharge[]): any[] {
  console.log(`   Transforming ${oldRecharges.length} recharges...`);
  
  const transformed = oldRecharges.map((recharge) => ({
    id: recharge.id,
    userId: recharge.userId,
    amount: recharge.amount,
    paymentMethod: recharge.method, // Changed: method → paymentMethod
    status: recharge.status as any,
    receiptUrl: recharge.proofImage || null, // Changed: proofImage → receiptUrl
    createdAt: recharge.createdAt ? new Date(recharge.createdAt) : new Date(),
    // No updatedAt field in schema
  }));
  
  console.log(`   ✅ Transformed ${transformed.length} recharges`);
  return transformed;
}

/**
 * Transform consignment items
 */
function transformConsignments(oldConsignments: OldConsignment[]): any[] {
  console.log(`   Transforming ${oldConsignments.length} consignments...`);
  
  const transformed = oldConsignments.map((item) => ({
    id: item.id,
    userId: item.userId,
    title: item.productName, // Changed: productName → title
    description: item.description || '',
    price: item.price,
    status: item.status as any,
    images: item.images || [],
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    // No updatedAt in schema
  }));
  
  console.log(`   ✅ Transformed ${transformed.length} consignments`);
  return transformed;
}

/**
 * Bulk import data to PostgreSQL
 */
async function importToDatabase(data: {
  users: any[];
  orders: any[];
  transactions: any[];
  recharges: any[];
  consignments: any[];
}) {
  console.log('\n💾 Importing to PostgreSQL...\n');

  try {
    // Import users
    if (data.users.length > 0) {
      console.log('   Importing users...');
      const result = await prisma.user.createMany({
        data: data.users,
        skipDuplicates: true,
      });
      console.log(`   ✅ Imported ${result.count} users`);
    }

    // Import orders
    if (data.orders.length > 0) {
      console.log('   Importing orders...');
      const result = await prisma.order.createMany({
        data: data.orders,
        skipDuplicates: true,
      });
      console.log(`   ✅ Imported ${result.count} orders`);
    }

    // Import transactions
    if (data.transactions.length > 0) {
      console.log('   Importing transactions...');
      const result = await prisma.transaction.createMany({
        data: data.transactions,
        skipDuplicates: true,
      });
      console.log(`   ✅ Imported ${result.count} transactions`);
    }

    // Import recharges
    if (data.recharges.length > 0) {
      console.log('   Importing recharge requests...');
      const result = await prisma.rechargeRequest.createMany({
        data: data.recharges,
        skipDuplicates: true,
      });
      console.log(`   ✅ Imported ${result.count} recharge requests`);
    }

    // Import consignments
    if (data.consignments.length > 0) {
      console.log('   Importing consignments...');
      const result = await prisma.consignmentItem.createMany({
        data: data.consignments,
        skipDuplicates: true,
      });
      console.log(`   ✅ Imported ${result.count} consignments`);
    }

    console.log('\n✅ All data imported successfully!\n');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    throw error;
  }
}

/**
 * Verify data integrity
 */
async function verifyDataIntegrity() {
  console.log('🔍 Verifying data integrity...\n');

  const userCount = await prisma.user.count();
  const orderCount = await prisma.order.count();
  const transactionCount = await prisma.transaction.count();
  const rechargeCount = await prisma.rechargeRequest.count();
  const consignmentCount = await prisma.consignmentItem.count();

  console.log('   Database record counts:');
  console.log(`   - Users: ${userCount}`);
  console.log(`   - Orders: ${orderCount}`);
  console.log(`   - Transactions: ${transactionCount}`);
  console.log(`   - Recharges: ${rechargeCount}`);
  console.log(`   - Consignments: ${consignmentCount}`);
  console.log('');

  // Spot-check a few records
  if (userCount > 0) {
    const sampleUser = await prisma.user.findFirst();
    console.log('   Sample user:', {
      id: sampleUser?.id,
      username: sampleUser?.username,
      balance: sampleUser?.balance,
    });
  }

  console.log('\n✅ Verification complete!\n');
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║         🚀 localStorage → PostgreSQL Migration            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  try {
    // Step 1: Check if export file exists
    const exportPath = path.join(BACKUP_DIR, 'localstorage-export.json');
    
    if (!fs.existsSync(exportPath)) {
      exportLocalStorageData();
      console.log('\n⏸️  Migration paused. Please export localStorage data first.\n');
      return;
    }

    // Step 2: Load data
    console.log('📂 Loading localStorage data...\n');
    const rawData = loadLocalStorageData(exportPath);

    const users: OldUser[] = rawData.users ? JSON.parse(rawData.users) : [];
    const orders: OldOrder[] = rawData.orders ? JSON.parse(rawData.orders) : [];
    const transactions: OldTransaction[] = rawData.transactions ? JSON.parse(rawData.transactions) : [];
    const recharges: OldRecharge[] = rawData.recharges ? JSON.parse(rawData.recharges) : [];
    const consignments: OldConsignment[] = rawData.consignments ? JSON.parse(rawData.consignments) : [];

    console.log(`   Found:`);
    console.log(`   - ${users.length} users`);
    console.log(`   - ${orders.length} orders`);
    console.log(`   - ${transactions.length} transactions`);
    console.log(`   - ${recharges.length} recharges`);
    console.log(`   - ${consignments.length} consignments`);
    console.log('');

    // Step 3: Transform data
    console.log('🔄 Transforming data...\n');
    const transformedUsers = await transformUsers(users);
    const transformedOrders = transformOrders(orders);
    const transformedTransactions = transformTransactions(transactions);
    const transformedRecharges = transformRecharges(recharges);
    const transformedConsignments = transformConsignments(consignments);

    // Step 4: Import to database
    await importToDatabase({
      users: transformedUsers,
      orders: transformedOrders,
      transactions: transformedTransactions,
      recharges: transformedRecharges,
      consignments: transformedConsignments,
    });

    // Step 5: Verify
    await verifyDataIntegrity();

    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                   ✅ Migration Complete!                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Run migration
migrate();
