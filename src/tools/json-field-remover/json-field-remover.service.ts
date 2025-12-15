import JSON5 from 'json5';

export function parseJsonArray(input: string): any[] {
  const value = JSON5.parse(input);
  if (!Array.isArray(value)) throw new Error('NOT_ARRAY');
  return value;
}

export function detectFieldsFromArray(arr: any[]): string[] {
  const set = new Set<string>();
  for (const el of arr) {
    if (el && typeof el === 'object' && !Array.isArray(el)) {
      Object.keys(el).forEach(k => set.add(k));
    }
  }
  return Array.from(set).sort();
}

export type FieldSample = { path: string; sample: any };

function collectPaths(obj: any, prefix: string | null, map: Map<string, any>) {
  if (obj && typeof obj === 'object') {
    if (Array.isArray(obj)) {
      for (const item of obj) {
        collectPaths(item, prefix, map);
      }
      return;
    }
    for (const k of Object.keys(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (!map.has(path) && obj[k] !== undefined) map.set(path, obj[k]);
      collectPaths(obj[k], path, map);
    }
  }
}

export function detectFieldsWithSamples(arr: any[]): FieldSample[] {
  const map = new Map<string, any>();
  for (const el of arr) {
    collectPaths(el, null, map);
  }
  const out: FieldSample[] = Array.from(map.entries()).map(([path, sample]) => ({ path, sample }));
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

function deletePath(obj: any, pathParts: string[]) {
  if (!obj || typeof obj !== 'object') return;
  const [first, ...rest] = pathParts;
  if (!(first in obj)) return;
  if (rest.length === 0) {
    delete obj[first];
    return;
  }
  deletePath(obj[first], rest);
  // cleanup empty objects
  if (obj[first] && typeof obj[first] === 'object' && Object.keys(obj[first]).length === 0) {
    delete obj[first];
  }
}
export function removeFieldsFromArray(arr: any[], fieldsToRemove: string[]): any[] {
  if (!fieldsToRemove || fieldsToRemove.length === 0) return arr;
  const paths = fieldsToRemove.map(f => f.split('.'));
  return arr.map(item => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    // deep clone to avoid mutating original
    const clone = JSON.parse(JSON.stringify(item));
    for (const p of paths) {
      deletePath(clone, p);
    }
    return clone;
  });
}
