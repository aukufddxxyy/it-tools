import { describe, expect, it } from 'vitest';
import { compressText } from './text-compressor.service';

describe('text-compressor', () => {
  describe('compressText', () => {
    it('joins lines separated by LF with a single space', () => {
      expect(compressText('hello\nworld')).toBe('hello world');
    });

    it('joins lines separated by CRLF with a single space', () => {
      expect(compressText('hello\r\nworld')).toBe('hello world');
    });

    it('joins lines separated by CR with a single space', () => {
      expect(compressText('hello\rworld')).toBe('hello world');
    });

    it('handles mixed newline variants', () => {
      expect(compressText('line1\nline2\r\nline3\rline4')).toBe('line1 line2 line3 line4');
    });

    it('trims leading and trailing spaces and tabs from each line', () => {
      expect(compressText('  hello  \n\tworld\t')).toBe('hello world');
    });

    it('preserves inner whitespace within a line', () => {
      expect(compressText('hello   world\nfoo  bar')).toBe('hello   world foo  bar');
    });

    it('returns empty string for empty input', () => {
      expect(compressText('')).toBe('');
    });

    it('returns empty string for whitespace-only input', () => {
      expect(compressText('   \n\t\n  ')).toBe('');
    });

    it('returns single line unchanged (after trim)', () => {
      expect(compressText('  single line  ')).toBe('single line');
    });

    it('handles consecutive empty lines gracefully (no extra spaces)', () => {
      expect(compressText('hello\n\n\nworld')).toBe('hello world');
    });
  });
});
