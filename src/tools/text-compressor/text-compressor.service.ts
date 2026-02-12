export function compressText(text: string): string {
  return text
    .split(/\r\n|\r|\n/)
    .map((line) => line.replace(/^[\t ]+|[\t ]+$/g, ''))
    .filter((line) => line.length > 0)
    .join(' ');
}
