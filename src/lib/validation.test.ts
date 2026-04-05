import { describe, it, expect } from 'vitest';
import { validateEmail, validateUsername, validatePassword } from './security';

describe('Input Validation', () => {
  describe('validateEmail', () => {
    it('accepts valid emails', () => {
      expect(validateEmail('user@example.com')).toBeNull();
      expect(validateEmail('test.user@domain.co.uk')).toBeNull();
      expect(validateEmail('user+tag@example.com')).toBeNull();
      expect(validateEmail('a@b.c')).toBeNull();
    });

    it('rejects empty email', () => {
      expect(validateEmail('')).toBe('Email không được để trống');
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('notanemail')).toBe('Email không hợp lệ');
      expect(validateEmail('@nodomain.com')).toBe('Email không hợp lệ');
      expect(validateEmail('noatsign.com')).toBe('Email không hợp lệ');
      expect(validateEmail('double@@domain.com')).toBe('Email không hợp lệ');
      expect(validateEmail('user@')).toBe('Email không hợp lệ');
      expect(validateEmail('user @domain.com')).toBe('Email không hợp lệ');
    });

    it('rejects email too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail)).toBe('Email quá dài (tối đa 254 ký tự)');
    });

    it('rejects local part too long', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      expect(validateEmail(longLocal)).toBe('Phần trước @ quá dài');
    });
  });

  describe('validateUsername', () => {
    it('accepts valid usernames', () => {
      expect(validateUsername('user123')).toBeNull();
      expect(validateUsername('test_user')).toBeNull();
      expect(validateUsername('ABC')).toBeNull();
    });

    it('rejects username too short', () => {
      expect(validateUsername('ab')).toBe('Tên đăng nhập tối thiểu 3 ký tự');
    });

    it('rejects username too long', () => {
      expect(validateUsername('a'.repeat(21))).toBe('Tên đăng nhập tối đa 20 ký tự');
    });

    it('rejects invalid characters', () => {
      expect(validateUsername('user@name')).toBe('Tên đăng nhập chỉ gồm chữ cái, số và dấu _');
      expect(validateUsername('user-name')).toBe('Tên đăng nhập chỉ gồm chữ cái, số và dấu _');
      expect(validateUsername('user name')).toBe('Tên đăng nhập chỉ gồm chữ cái, số và dấu _');
    });
  });

  describe('validatePassword', () => {
    it('accepts valid passwords', () => {
      // Updated to match new strong password requirements
      expect(validatePassword('MyP@ss1234')).toBeNull();
      expect(validatePassword('Str0ng!Pass')).toBeNull();
    });

    it('rejects password too short', () => {
      expect(validatePassword('Ab1!')).toBe('Mật khẩu tối thiểu 8 ký tự');
    });

    it('rejects password too long', () => {
      expect(validatePassword('Aa1!' + 'a'.repeat(61))).toBe('Mật khẩu tối đa 64 ký tự');
    });

    it('rejects password without uppercase', () => {
      expect(validatePassword('abcdefg1!')).toBe('Mật khẩu phải chứa chữ in hoa');
    });

    it('rejects password without number', () => {
      expect(validatePassword('Abcdefgh!')).toBe('Mật khẩu phải chứa số');
    });

    it('rejects password without special char', () => {
      expect(validatePassword('Abcdefgh1')).toBe('Mật khẩu phải chứa ký tự đặc biệt (!@#$%^&*...)');
    });
  });
});
