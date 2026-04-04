/**
 * Test Migration Script - Generate Sample Data
 * 
 * This creates sample localStorage data for testing the migration script.
 * Usage: npx tsx scripts/generate-sample-data.ts
 */

import fs from 'fs';
import path from 'path';

const BACKUP_DIR = path.join(process.cwd(), 'data', 'backup');

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Sample data (simulating localStorage content)
const sampleData = {
  users: JSON.stringify([
    {
      id: 'user-001',
      username: 'testuser1',
      email: 'test1@example.com',
      password: 'password123', // Plain password (will be hashed)
      balance: 100000,
      discount: 5,
      role: 'user',
      referralCode: 'REF001',
      referredBy: null,
      createdAt: '2026-01-01T00:00:00.000Z'
    },
    {
      id: 'user-002',
      username: 'testuser2',
      email: 'test2@example.com',
      password: 'password456',
      balance: 50000,
      discount: 0,
      role: 'user',
      referralCode: 'REF002',
      referredBy: 'user-001',
      createdAt: '2026-01-15T00:00:00.000Z'
    },
    {
      id: 'admin-001',
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      balance: 0,
      discount: 0,
      role: 'admin',
      referralCode: null,
      referredBy: null,
      createdAt: '2026-01-01T00:00:00.000Z'
    }
  ]),

  orders: JSON.stringify([
    {
      id: 'order-001',
      userId: 'user-001',
      productId: 'prod-001',
      amount: 50000,
      status: 'completed',
      accountDetails: {
        username: 'gameacc1',
        password: 'gamepass1',
        server: 'VN1'
      },
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'order-002',
      userId: 'user-002',
      productId: 'prod-002',
      amount: 30000,
      status: 'completed',
      accountDetails: {
        username: 'gameacc2',
        password: 'gamepass2',
        server: 'VN2'
      },
      createdAt: '2026-02-15T14:30:00.000Z'
    }
  ]),

  transactions: JSON.stringify([
    {
      id: 'txn-001',
      userId: 'user-001',
      type: 'recharge',
      amount: 100000,
      description: 'Nạp tiền qua Momo',
      createdAt: '2026-01-20T09:00:00.000Z'
    },
    {
      id: 'txn-002',
      userId: 'user-001',
      type: 'purchase',
      amount: -50000,
      description: 'Mua tài khoản #order-001',
      createdAt: '2026-02-01T10:00:00.000Z'
    },
    {
      id: 'txn-003',
      userId: 'user-002',
      type: 'recharge',
      amount: 50000,
      description: 'Nạp tiền qua VNPay',
      createdAt: '2026-02-10T11:00:00.000Z'
    },
    {
      id: 'txn-004',
      userId: 'user-002',
      type: 'purchase',
      amount: -30000,
      description: 'Mua tài khoản #order-002',
      createdAt: '2026-02-15T14:30:00.000Z'
    }
  ]),

  recharges: JSON.stringify([
    {
      id: 'rch-001',
      userId: 'user-001',
      amount: 100000,
      method: 'momo',
      status: 'approved',
      proofImage: '/uploads/proof1.jpg',
      createdAt: '2026-01-20T08:00:00.000Z'
    },
    {
      id: 'rch-002',
      userId: 'user-002',
      amount: 50000,
      method: 'vnpay',
      status: 'approved',
      proofImage: '/uploads/proof2.jpg',
      createdAt: '2026-02-10T10:00:00.000Z'
    },
    {
      id: 'rch-003',
      userId: 'user-001',
      amount: 200000,
      method: 'bank_transfer',
      status: 'pending',
      proofImage: '/uploads/proof3.jpg',
      createdAt: '2026-03-01T15:00:00.000Z'
    }
  ]),

  consignments: JSON.stringify([
    {
      id: 'cons-001',
      userId: 'user-001',
      productName: 'Tài khoản Liên Quân - 100 tướng',
      description: 'Tài khoản đẹp, nhiều skin rare',
      price: 500000,
      status: 'pending',
      images: ['/uploads/cons1-1.jpg', '/uploads/cons1-2.jpg'],
      createdAt: '2026-03-10T12:00:00.000Z'
    }
  ])
};

// Write to file
const outputPath = path.join(BACKUP_DIR, 'localstorage-export.json');
fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));

console.log('✅ Sample data generated!');
console.log(`   File: ${outputPath}`);
console.log('');
console.log('📊 Sample data summary:');
console.log(`   - 3 users (2 regular + 1 admin)`);
console.log(`   - 2 orders`);
console.log(`   - 4 transactions`);
console.log(`   - 3 recharge requests`);
console.log(`   - 1 consignment`);
console.log('');
console.log('🚀 Next step: Run migration');
console.log('   npx tsx scripts/migrate-localstorage.ts');
