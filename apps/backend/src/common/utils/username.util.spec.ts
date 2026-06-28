import {
  isValidUsername,
  generateUsernameFromName,
  RESERVED_USERNAMES,
} from './username.util';

describe('Username Utilities', () => {
  describe('isValidUsername', () => {
    it('should accept valid usernames', () => {
      expect(isValidUsername('main-office')).toBe(true);
      expect(isValidUsername('branch1')).toBe(true);
      expect(isValidUsername('test-123')).toBe(true);
      expect(isValidUsername('a')).toBe(false); // Too short
      expect(isValidUsername('ab')).toBe(false); // Too short
      expect(isValidUsername('abc')).toBe(true); // Minimum length
    });

    it('should reject invalid usernames', () => {
      expect(
        isValidUsername('toolongusernameexceedingthirtycharacters123'),
      ).toBe(false); // Too long
      expect(isValidUsername('Branch-Name')).toBe(false); // Uppercase
      expect(isValidUsername('-start')).toBe(false); // Starts with hyphen
      expect(isValidUsername('end-')).toBe(false); // Ends with hyphen
      expect(isValidUsername('test@123')).toBe(false); // Special char
    });

    it('should accept usernames with numbers', () => {
      expect(isValidUsername('branch123')).toBe(true);
      expect(isValidUsername('123branch')).toBe(true);
      expect(isValidUsername('a1')).toBe(false); // Too short
    });
  });

  describe('generateUsernameFromName', () => {
    it('should convert branch name to valid username', () => {
      expect(generateUsernameFromName('Main Office')).toBe('main-office');
      expect(generateUsernameFromName('Branch 123!')).toBe('branch-123');
      expect(generateUsernameFromName('Test@Branch#123')).toBe('testbranch123');
      expect(generateUsernameFromName('  Multiple   Spaces  ')).toBe(
        'multiple-spaces',
      );
    });

    it('should handle empty or invalid names', () => {
      expect(generateUsernameFromName('')).toBe('');
      expect(generateUsernameFromName('---')).toBe('');
    });

    it('should truncate to 30 characters', () => {
      const longName =
        'This Is A Very Long Branch Name That Exceeds Thirty Characters';
      const result = generateUsernameFromName(longName);
      expect(result.length).toBeLessThanOrEqual(30);
    });
  });

  describe('RESERVED_USERNAMES', () => {
    it('should contain common reserved words', () => {
      expect(RESERVED_USERNAMES).toContain('admin');
      expect(RESERVED_USERNAMES).toContain('api');
      expect(RESERVED_USERNAMES).toContain('b');
    });
  });
});
