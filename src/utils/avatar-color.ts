export function stringToAvatarColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + hash * 31;
  }
  return `hsl(${Math.abs(hash) % 360}, 60%, 42%)`;
}
