// Password hashing utilities using bcrypt
// This replaces the insecure XOR obfuscation
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a plain password using bcrypt
 * @param plainPassword - The plain text password
 * @returns Promise<string> - The hashed password
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

/**
 * Verify a plain password against a hashed password
 * @param plainPassword - The plain text password to verify
 * @param hashedPassword - The bcrypt hashed password
 * @returns Promise<boolean> - True if password matches
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Check if a password string is already bcrypt hashed
 * @param password - The password string to check
 * @returns boolean - True if it's a bcrypt hash
 */
export function isBcryptHash(password: string): boolean {
  // Bcrypt hashes start with $2a$, $2b$, or $2y$
  return /^\$2[aby]\$\d{2}\$/.test(password);
}
