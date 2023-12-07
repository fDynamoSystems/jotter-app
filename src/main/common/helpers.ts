export function isOsWindows(): boolean {
  const toReturn = process.platform == "win32";
  return toReturn;
}
