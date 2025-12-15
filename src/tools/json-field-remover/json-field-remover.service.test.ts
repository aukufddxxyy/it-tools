import { describe, it, expect } from 'vitest';
import { parseJsonArray, detectFieldsFromArray, detectFieldsWithSamples, removeFieldsFromArray } from './json-field-remover.service';

describe('json-field-remover.service', () => {
  const input = `[
    { "id": 1, "name": "Alice", "age": 20 },
    { "id": 2, "name": "Bob", "city": "NY" }
  ]`;

  it('parses JSON array', () => {
    const arr = parseJsonArray(input);
    expect(Array.isArray(arr)).toBe(true);
    expect(arr.length).toBe(2);
  });

  it('detects fields', () => {
    const arr = parseJsonArray(input);
    const fields = detectFieldsFromArray(arr);
    expect(fields).toEqual(['age', 'city', 'id', 'name']);
  });

  it('detects nested fields with samples', () => {
    const nested = `[
      { "id": 1, "name": "Alice", "meta": { "a": 1 } },
      { "id": 2, "name": "Bob", "age": 30 }
    ]`;
    const arr2 = parseJsonArray(nested);
    const fs = detectFieldsWithSamples(arr2);
    const paths = fs.map(f => f.path);
    expect(paths).toContain('meta.a');
  });

  it('removes selected fields', () => {
    const arr = parseJsonArray(input);
    const out = removeFieldsFromArray(arr, ['age', 'city']);
    expect(out[0].age).toBeUndefined();
    expect(out[0].id).toBe(1);
    expect(out[1].city).toBeUndefined();
    expect(out[1].name).toBe('Bob');
  });
});
