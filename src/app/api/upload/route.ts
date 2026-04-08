import { logger } from '@/lib/logger';
/**
 * File Upload API
 * Handles image uploads for products (admin only)
 * Storage: Supabase Storage (cloud) - compatible with Vercel serverless
 * Security: Validates magic bytes to prevent MIME spoofing
 */

import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/server-session';
import { uploadRateLimiter } from '@/lib/rate-limiter';
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase';

// ─── Constants ─────────────────────────────────────────────────────────────────

const MAX_FILE_COUNT = 10;
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

// Magic bytes signatures for image validation
// These are the first bytes that identify file types
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF],  // JPEG/JFIF
  ],
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],  // PNG
  ],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],  // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],  // GIF89a
  ],
  'image/webp': [
    // WebP starts with RIFF....WEBP
    // We check: 0x52 0x49 0x46 0x46 (RIFF) at offset 0
    // And: 0x57 0x45 0x42 0x50 (WEBP) at offset 8
  ],
};

// Map MIME types to file extensions
const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function normalizeFilename(original: string): string {
  // Remove path separators to prevent directory traversal
  const basename = original.split(/[/\\]/).pop() || 'upload-file';
  return basename
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-.]+$/g, '') || 'upload-file';
}

function generateUniqueFilename(originalName: string, mimeType: string): string {
  const uniqueSuffix = `${Date.now()}-${randomBytes(8).toString('hex')}`;
  const normalized = normalizeFilename(originalName);

  // Remove existing extension and add correct one based on MIME type
  const nameWithoutExt = normalized.replace(/\.[^.]+$/, '');
  const ext = MIME_TO_EXT[mimeType] || '.bin';

  // Final validation: ensure no path traversal
  if (nameWithoutExt.includes('..') || nameWithoutExt.includes('/') || nameWithoutExt.includes('\\')) {
    return `${uniqueSuffix}-upload-file${ext}`;
  }
  return `${uniqueSuffix}-${nameWithoutExt}${ext}`;
}

function extractSessionToken(cookieHeader: string): string {
  const sessionCookie = cookieHeader
    .split(';')
    .map(v => v.trim())
    .find(v => v.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!sessionCookie) return '';
  return decodeURIComponent(sessionCookie.split('=').slice(1).join('='));
}

function errorResponse(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

// ─── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate file by checking magic bytes (file signature)
 * This prevents MIME type spoofing attacks
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const bytes = Array.from(buffer.slice(0, 12));
  
  // Special handling for WebP (has signature at offset 0 and 8)
  if (mimeType === 'image/webp') {
    // Check RIFF at offset 0
    const isRiff = bytes[0] === 0x52 && bytes[1] === 0x49 && 
                   bytes[2] === 0x46 && bytes[3] === 0x46;
    // Check WEBP at offset 8
    const isWebp = bytes[8] === 0x57 && bytes[9] === 0x45 && 
                   bytes[10] === 0x42 && bytes[11] === 0x50;
    return isRiff && isWebp;
  }
  
  // Check against known signatures
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures || signatures.length === 0) {
    return false;
  }
  
  return signatures.some(signature => {
    return signature.every((byte, index) => bytes[index] === byte);
  });
}

function validateFile(file: File, buffer: Buffer): { valid: boolean; error?: string } {
  // Check MIME type first
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return { valid: false, error: 'Định dạng file không hợp lệ. Chỉ chấp nhận: JPEG, PNG, WebP, GIF' };
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File quá lớn (> ${MAX_FILE_SIZE_MB}MB)` };
  }
  
  // Validate magic bytes to prevent MIME spoofing
  if (!validateMagicBytes(buffer, file.type)) {
    return { 
      valid: false, 
      error: 'Nội dung file không khớp với định dạng khai báo (có thể file bị giả mạo)' 
    };
  }
  
  return { valid: true };
}

// ─── Main Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    // Verify admin session
    const cookieHeader = req.headers.get('cookie') || '';
    const token = extractSessionToken(cookieHeader);
    const session = await verifyAdminSessionToken(token);

    if (!session || session.role !== 'admin') {
      return errorResponse('Unauthorized: Valid admin session required', 401);
    }

    // Rate limiting - prevent DoS via excessive uploads
    const rateLimitKey = `upload:${session.username}`;
    const rateLimit = uploadRateLimiter.check(rateLimitKey);
    if (!rateLimit.allowed) {
      return errorResponse(`Quá nhiều upload. Vui lòng thử lại sau ${rateLimit.resetIn} giây`, 429);
    }

    // Parse form data
    const data = await req.formData();
    const files = data.getAll('file') as File[];

    if (!files || files.length === 0) {
      return errorResponse('Không tìm thấy file', 400);
    }

    if (files.length > MAX_FILE_COUNT) {
      return errorResponse(`Tối đa ${MAX_FILE_COUNT} file mỗi lần upload`, 400);
    }

    // Process files → upload to Supabase Storage
    const uploadedUrls: string[] = [];

    for (const file of files) {
      // Read file content first for magic bytes validation
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const validation = validateFile(file, buffer);
      if (!validation.valid) {
        return errorResponse(validation.error!, 400);
      }

      const filename = generateUniqueFilename(file.name, file.type);
      
      // Upload to Supabase Storage
      const { error: uploadError } = await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .upload(filename, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        logger.error('Supabase upload error', new Error(uploadError.message), { 
          action: 'file_upload',
          metadata: { filename },
        });
        return errorResponse('Lỗi khi tải file lên storage', 500);
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filename);

      uploadedUrls.push(urlData.publicUrl);
    }

    logger.info('File upload completed', { 
      username: session.username,
      metadata: { count: uploadedUrls.length },
    });

    return NextResponse.json({ success: true, urls: uploadedUrls });

  } catch (error) {
    logger.error('File upload error', error as Error, { action: 'file_upload' });
    return errorResponse('Đã có lỗi xảy ra khi upload file', 500);
  }
}
