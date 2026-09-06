export function normalizeGerman(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:"']/g, "")
    .replace(/\s+/g, " ");
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);

  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

/** Returns a similarity ratio between 0 and 1 for two strings (order/typo tolerant). */
export function similarity(a: string, b: string): number {
  const na = normalizeGerman(a);
  const nb = normalizeGerman(b);
  if (na === nb) return 1;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(na, nb) / maxLen;
}

export function isCloseEnough(spoken: string, target: string, threshold = 0.8): boolean {
  return similarity(spoken, target) >= threshold;
}
