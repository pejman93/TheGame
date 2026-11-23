/** Drops trailing punctuation so a joke can be placed inside a sentence. */
export function clean(text: string): string {
  return text.trim().replace(/[.!?…\s]+$/u, "");
}
