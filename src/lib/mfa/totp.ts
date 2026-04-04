/**
 * TOTP-based Multi-Factor Authentication for Admin Accounts
 * Uses RFC 6238 compliant TOTP with backup codes
 */

import { generateSync, verifySync, generateSecret as otpGenerateSecret } from 'otplib';
import * as QRCode from 'qrcode';
import { randomBytes } from 'crypto';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MFASetup {
  secret: string;
  qrCodeDataURL: string;
  backupCodes: string[];
  otpauthUrl: string;
}

export interface MFAConfig {
  enabled: boolean;
  secret: string | null;
  backupCodes: string[];
  backupCodesUsed: string[];
}

// ─── Configuration ─────────────────────────────────────────────────────────────

const APP_NAME = 'TapHoaACC Admin';
const BACKUP_CODE_COUNT = 10;
const BACKUP_CODE_LENGTH = 8;

// TOTP configuration
const TOTP_OPTIONS = {
  digits: 6,
  period: 30, // 30 seconds
};

// ─── MFA Setup ─────────────────────────────────────────────────────────────────

/**
 * Generate a new MFA setup for a user
 * Returns secret, QR code, and backup codes
 */
export async function generateMFASetup(username: string): Promise<MFASetup> {
  // Generate a cryptographically secure secret using otplib
  const secret = otpGenerateSecret({ length: 32 });
  
  // Generate otpauth URL for authenticator apps
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(APP_NAME)}:${encodeURIComponent(username)}?secret=${secret}&issuer=${encodeURIComponent(APP_NAME)}&digits=${TOTP_OPTIONS.digits}&period=${TOTP_OPTIONS.period}`;
  
  // Generate QR code as data URL
  const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl, {
    width: 256,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
  
  // Generate backup codes
  const backupCodes = generateBackupCodes(BACKUP_CODE_COUNT);
  
  return {
    secret,
    qrCodeDataURL,
    backupCodes,
    otpauthUrl,
  };
}

/**
 * Generate cryptographically secure backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const bytes = randomBytes(BACKUP_CODE_LENGTH / 2);
    const code = bytes.toString('hex').toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

// ─── MFA Verification ──────────────────────────────────────────────────────────

/**
 * Verify a TOTP token
 * @param token - 6-digit token from authenticator app
 * @param secret - User's MFA secret
 * @returns true if valid
 */
export function verifyTOTP(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  
  // Clean token - remove spaces and dashes
  const cleanToken = token.replace(/[\s-]/g, '');
  
  // TOTP tokens must be exactly 6 digits
  if (!/^\d{6}$/.test(cleanToken)) return false;
  
  try {
    // Verify with sync function
    const result = verifySync({ token: cleanToken, secret, ...TOTP_OPTIONS });
    return result.valid === true;
  } catch {
    return false;
  }
}

/**
 * Verify a backup code
 * @param code - Backup code (e.g., "A1B2-C3D4")
 * @param validCodes - List of valid backup codes
 * @param usedCodes - List of already used codes
 * @returns code if valid (to mark as used), null if invalid
 */
export function verifyBackupCode(
  code: string,
  validCodes: string[],
  usedCodes: string[]
): string | null {
  if (!code) return null;
  
  // Clean and normalize code
  const cleanCode = code.replace(/[\s]/g, '').toUpperCase();
  
  // Check if code is valid and not already used
  const isValid = validCodes.includes(cleanCode);
  const isUsed = usedCodes.includes(cleanCode);
  
  if (isValid && !isUsed) {
    return cleanCode;
  }
  
  return null;
}

/**
 * Verify MFA token (either TOTP or backup code)
 * @returns { valid: boolean, usedBackupCode?: string }
 */
export function verifyMFA(
  token: string,
  config: MFAConfig
): { valid: boolean; usedBackupCode?: string } {
  if (!config.enabled || !config.secret) {
    return { valid: true }; // MFA not enabled
  }
  
  // Try TOTP first
  if (verifyTOTP(token, config.secret)) {
    return { valid: true };
  }
  
  // Try backup code
  const usedCode = verifyBackupCode(
    token,
    config.backupCodes,
    config.backupCodesUsed
  );
  
  if (usedCode) {
    return { valid: true, usedBackupCode: usedCode };
  }
  
  return { valid: false };
}

// ─── MFA Status ────────────────────────────────────────────────────────────────

/**
 * Get current TOTP code for testing (development only)
 */
export function getCurrentTOTP(secret: string): string {
  return generateSync({ secret, ...TOTP_OPTIONS });
}

/**
 * Get remaining seconds until next TOTP code
 */
export function getTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000);
  return TOTP_OPTIONS.period - (now % TOTP_OPTIONS.period);
}

/**
 * Check if MFA is required based on environment
 */
export function isMFARequired(): boolean {
  // MFA required in production if secret is configured
  return process.env.NODE_ENV === 'production' && 
         !!process.env.ADMIN_MFA_SECRET;
}

/**
 * Get MFA configuration from environment
 */
export function getMFAConfig(): MFAConfig {
  const secret = process.env.ADMIN_MFA_SECRET || null;
  const backupCodesEnv = process.env.ADMIN_MFA_BACKUP_CODES || '';
  const usedCodesEnv = process.env.ADMIN_MFA_USED_CODES || '';
  
  return {
    enabled: !!secret,
    secret,
    backupCodes: backupCodesEnv ? backupCodesEnv.split(',') : [],
    backupCodesUsed: usedCodesEnv ? usedCodesEnv.split(',') : [],
  };
}

// ─── Exports ───────────────────────────────────────────────────────────────────

export default {
  generateMFASetup,
  verifyTOTP,
  verifyBackupCode,
  verifyMFA,
  getCurrentTOTP,
  getTimeRemaining,
  isMFARequired,
  getMFAConfig,
};
