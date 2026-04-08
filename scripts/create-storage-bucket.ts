/**
 * Create Supabase Storage bucket for product images
 * Run once: npx tsx scripts/create-storage-bucket.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://svldhdhqgqojbwfleaqj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2bGRoZGhxZ3FvamJ3ZmxlYXFqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTYxMTY3NSwiZXhwIjoyMDg1MTg3Njc1fQ.6SCESqJga8mDG_1MOhkZvqb5hwTfuctLEbvP4nkYSxc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log('🪣 Creating storage bucket "products"...');
  
  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  
  if (listError) {
    console.error('❌ Failed to list buckets:', listError.message);
    process.exit(1);
  }

  const exists = buckets?.some(b => b.name === 'products');
  
  if (exists) {
    console.log('✅ Bucket "products" already exists!');
  } else {
    const { error } = await supabase.storage.createBucket('products', {
      public: true, // Images need to be publicly accessible
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    });

    if (error) {
      console.error('❌ Failed to create bucket:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Bucket "products" created successfully!');
  }

  // Verify
  const { data: files } = await supabase.storage.from('products').list();
  console.log(`📁 Bucket contains ${files?.length ?? 0} files`);
}

main();
