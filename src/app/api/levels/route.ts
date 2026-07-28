import { NextResponse } from "next/server";
import { handleApiError, requireSession } from "@/lib/api-helpers";
import { listLevels } from "@/lib/repo/content";

export async function GET() {
  try {
    await requireSession();
    const levels = await listLevels();
    return NextResponse.json({ levels });
  } catch (error) {
    return handleApiError(error);
  }
}
