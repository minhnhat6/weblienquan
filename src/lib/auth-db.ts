/**
 * Database-backed Authentication
 * Handles user registration, login, and account management with bcrypt
 */

import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { generateReferralCode } from './security';
import { invalidateUserSessions } from './user-session';

// ─── Constants ─────────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 10;
const REFERRAL_BONUS_AMOUNT = 5000;

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  referredBy?: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface SafeUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: number;
  referralCode: string;
  referredBy: string | null;
  discount: number;
  spinTickets: number;
  createdAt: Date;
}

/** Raw user data from Prisma (before transformation) */
interface RawUserData {
  id: string;
  username: string;
  email: string;
  role: string;
  balance: Prisma.Decimal;
  referralCode: string;
  referredBy: string | null;
  discount: number;
  spinTickets: number;
  createdAt: Date;
}

// ─── User Selection (excludes password) ────────────────────────────────────────

const SAFE_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  role: true,
  balance: true,
  referralCode: true,
  referredBy: true,
  discount: true,
  spinTickets: true,
  createdAt: true,
} as const;

// ─── Private Helpers ───────────────────────────────────────────────────────────

/** Transform raw Prisma data to SafeUserData (converts Decimal to number) */
function toSafeUserData(raw: RawUserData): SafeUserData {
  return {
    ...raw,
    balance: raw.balance.toNumber(),
  };
}

async function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

async function findExistingUser(username: string, email: string) {
  return prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });
}

async function giveReferralBonus(referrerCode: string, newUsername: string): Promise<void> {
  const referrer = await prisma.user.findUnique({
    where: { referralCode: referrerCode },
  });

  if (!referrer) return;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: referrer.id },
      data: { balance: { increment: REFERRAL_BONUS_AMOUNT } },
    }),
    prisma.transaction.create({
      data: {
        userId: referrer.id,
        type: 'referral',
        amount: REFERRAL_BONUS_AMOUNT,
        description: `Referral bonus from ${newUsername}`,
        status: 'success',
      },
    }),
  ]);
}

// ─── Public API ────────────────────────────────────────────────────────────────

/** Register a new user */
export async function registerUser(data: RegisterData): Promise<SafeUserData> {
  const { username, email, password, referredBy } = data;

  console.log('[REGISTER] Starting registration for:', { username, email });

  const existingUser = await findExistingUser(username, email);
  console.log('[REGISTER] Existing user check:', { found: !!existingUser });

  if (existingUser) {
    const field = existingUser.username === username ? 'Username' : 'Email';
    throw new Error(`${field} already exists`);
  }

  const passwordHash = await hashPassword(password);
  const referralCode = generateReferralCode(username);
  console.log('[REGISTER] Generated referral code:', referralCode);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        referralCode,
        referredBy: referredBy || null,
      },
      select: SAFE_USER_SELECT,
    });
    console.log('[REGISTER] User created:', { id: user.id, username: user.username });

    if (referredBy) {
      await giveReferralBonus(referredBy, username);
    }

    return toSafeUserData(user);
  } catch (dbError) {
    console.error('[REGISTER] Database error:', dbError);
    throw dbError;
  }
}

/** Authenticate user and return safe user data */
export async function loginUser(data: LoginData): Promise<SafeUserData> {
  const { username, password } = data;

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    throw new Error('Invalid username or password');
  }

  const isValidPassword = await verifyPassword(password, user.passwordHash);

  if (!isValidPassword) {
    throw new Error('Invalid username or password');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    balance: user.balance.toNumber(),
    referralCode: user.referralCode,
    referredBy: user.referredBy,
    discount: user.discount,
    spinTickets: user.spinTickets,
    createdAt: user.createdAt,
  };
}

/** Get user by ID (excludes password) */
export async function getUserById(userId: string): Promise<SafeUserData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: SAFE_USER_SELECT,
  });
  
  return user ? toSafeUserData(user) : null;
}

/** Update user balance with transaction record */
export async function updateUserBalance(
  userId: string,
  amount: number,
  description: string
): Promise<SafeUserData> {
  const transactionType = amount > 0 ? 'recharge' : 'purchase';

  const user = await prisma.$transaction(async (tx) => {
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
      select: SAFE_USER_SELECT,
    });

    await tx.transaction.create({
      data: {
        userId,
        type: transactionType,
        amount: Math.abs(amount),
        description,
        status: 'success',
      },
    });

    return updatedUser;
  });

  return toSafeUserData(user);
}

/** Change user password */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const isValidOldPassword = await verifyPassword(oldPassword, user.passwordHash);

  if (!isValidOldPassword) {
    throw new Error('Invalid old password');
  }

  const newPasswordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: newPasswordHash },
  });

  // Invalidate all existing sessions for this user
  // This forces re-login on all devices after password change
  invalidateUserSessions(userId);

  return true;
}
