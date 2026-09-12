import { changePersonalLibrary, readPersonalLibrary } from "@/lib/personal-chapter-server";
import { ChapterHttpError, privateJson, readChapterRequest } from "@/lib/chapter-http";

export const runtime = "nodejs";
export const maxDuration = 90;

function failure(error: unknown) {
  return error instanceof ChapterHttpError
    ? privateJson({ error: error.message }, error.status)
    : privateJson({ error: "Personal chapters are temporarily unavailable. Please try again." }, 503);
}

export async function GET() {
  try { return privateJson(await readPersonalLibrary()); }
  catch (error) { return failure(error); }
}

export async function POST(request: Request) {
  try { return privateJson(await changePersonalLibrary(await readChapterRequest(request))); }
  catch (error) { return failure(error); }
}