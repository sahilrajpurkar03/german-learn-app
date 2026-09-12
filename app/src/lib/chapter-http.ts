export class ChapterHttpError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}

export async function readChapterRequest(request: Request): Promise<unknown> {
  const origin = request.headers.get("origin");
  const requestUrl = new URL(request.url);
  const expectedOrigin = `${requestUrl.protocol}//${request.headers.get("host") ?? requestUrl.host}`;
  if (!origin || origin !== expectedOrigin || request.headers.get("sec-fetch-site") === "cross-site")
    throw new ChapterHttpError(403, "Use this feature from Sprechen.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new ChapterHttpError(415, "Expected a JSON request.");
  const reader = request.body?.getReader();
  if (!reader) throw new ChapterHttpError(400, "The request is empty.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 18000) {
      await reader.cancel();
      throw new ChapterHttpError(413, "Select a shorter transcript.");
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { buffer.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(buffer)); }
  catch { throw new ChapterHttpError(400, "The request is not valid JSON."); }
}

export function privateJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store, max-age=0", ...(status === 429 ? { "Retry-After": "75" } : {}) } });
}