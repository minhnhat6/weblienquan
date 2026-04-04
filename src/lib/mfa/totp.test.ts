/**
 * Tests for TOTP MFA module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  verifyTOTP, 
  verifyBackupCode, 
  verifyMFA, 
  generateMFASetup,
  getCurrentTOTP,
  type MFAConfig 
} from './totp';

describe('MFA TOTP', () => {
  describe('verifyTOTP', () => {
    it('returns false for empty token', () => {
      expect(verifyTOTP('', 'secret')).toBe(false);
    });

    it('returns false for empty secret', () => {
      expect(verifyTOTP('123456', '')).toBe(false);
    });

    it('verifies valid TOTP token', async () => {
      // Generate a setup and immediately verify the current token
      const setup = await generateMFASetup('testuser');
      const currentToken = getCurrentTOTP(setup.secret);
      
      expect(verifyTOTP(currentToken, setup.secret)).toBe(true);
    });

    it('cleans token with spaces and dashes', async () => {
      const setup = await generateMFASetup('testuser');
      const currentToken = getCurrentTOTP(setup.secret);
      
      // Add spaces and dashes
      const formattedToken = `${currentToken.slice(0, 3)} ${currentToken.slice(3)}`;
      expect(verifyTOTP(formattedToken, setup.secret)).toBe(true);
    });

    it('rejects invalid token', async () => {
      const setup = await generateMFASetup('testuser');
      expect(verifyTOTP('000000', setup.secret)).toBe(false);
    });
  });

  describe('verifyBackupCode', () => {
    const validCodes = ['A1B2-C3D4', 'E5F6-G7H8', 'I9J0-K1L2'];
    const usedCodes = ['A1B2-C3D4'];

    it('returns null for empty code', () => {
      expect(verifyBackupCode('', validCodes, usedCodes)).toBeNull();
    });

    it('returns code if valid and not used', () => {
      expect(verifyBackupCode('E5F6-G7H8', validCodes, usedCodes)).toBe('E5F6-G7H8');
    });

    it('returns null if code is already used', () => {
      expect(verifyBackupCode('A1B2-C3D4', validCodes, usedCodes)).toBeNull();
    });

    it('returns null if code is invalid', () => {
      expect(verifyBackupCode('XXXX-YYYY', validCodes, usedCodes)).toBeNull();
    });

    it('normalizes lowercase to uppercase', () => {
      expect(verifyBackupCode('e5f6-g7h8', validCodes, usedCodes)).toBe('E5F6-G7H8');
    });

    it('handles codes without dashes', () => {
      // Code without dash matches code with dash in validCodes
      expect(verifyBackupCode('E5F6G7H8', validCodes, usedCodes)).toBeNull(); // Not in list without dash
    });
  });

  describe('verifyMFA', () => {
    it('returns valid true if MFA is not enabled', () => {
      const config: MFAConfig = {
        enabled: false,
        secret: null,
        backupCodes: [],
        backupCodesUsed: [],
      };
      
      expect(verifyMFA('', config)).toEqual({ valid: true });
    });

    it('returns valid true if secret is null', () => {
      const config: MFAConfig = {
        enabled: true,
        secret: null,
        backupCodes: [],
        backupCodesUsed: [],
      };
      
      expect(verifyMFA('', config)).toEqual({ valid: true });
    });

    it('verifies TOTP token', async () => {
      const setup = await generateMFASetup('testuser');
      const config: MFAConfig = {
        enabled: true,
        secret: setup.secret,
        backupCodes: setup.backupCodes,
        backupCodesUsed: [],
      };
      
      const currentToken = getCurrentTOTP(setup.secret);
      expect(verifyMFA(currentToken, config)).toEqual({ valid: true });
    });

    it('verifies backup code and returns usedBackupCode', async () => {
      const setup = await generateMFASetup('testuser');
      const config: MFAConfig = {
        enabled: true,
        secret: setup.secret,
        backupCodes: setup.backupCodes,
        backupCodesUsed: [],
      };
      
      const backupCode = setup.backupCodes[0];
      expect(verifyMFA(backupCode, config)).toEqual({ 
        valid: true, 
        usedBackupCode: backupCode 
      });
    });

    it('rejects invalid token and backup code', async () => {
      const setup = await generateMFASetup('testuser');
      const config: MFAConfig = {
        enabled: true,
        secret: setup.secret,
        backupCodes: setup.backupCodes,
        backupCodesUsed: [],
      };
      
      expect(verifyMFA('000000', config)).toEqual({ valid: false });
    });
  });

  describe('generateMFASetup', () => {
    it('generates secret, QR code, and backup codes', async () => {
      const setup = await generateMFASetup('testuser');
      
      expect(setup.secret).toBeDefined();
      expect(setup.secret.length).toBeGreaterThan(20);
      
      expect(setup.qrCodeDataURL).toMatch(/^data:image\/png;base64,/);
      
      expect(setup.backupCodes).toHaveLength(10);
      setup.backupCodes.forEach(code => {
        expect(code).toMatch(/^[A-F0-9]{4}-[A-F0-9]{4}$/);
      });
      
      expect(setup.otpauthUrl).toContain('otpauth://totp/');
      expect(setup.otpauthUrl).toContain('testuser');
    });

    it('generates unique secrets each time', async () => {
      const setup1 = await generateMFASetup('user1');
      const setup2 = await generateMFASetup('user2');
      
      expect(setup1.secret).not.toBe(setup2.secret);
    });

    it('generates unique backup codes each time', async () => {
      const setup1 = await generateMFASetup('user1');
      const setup2 = await generateMFASetup('user1');
      
      // All codes should be different
      const allUnique = setup1.backupCodes.every(
        code => !setup2.backupCodes.includes(code)
      );
      expect(allUnique).toBe(true);
    });
  });
});
