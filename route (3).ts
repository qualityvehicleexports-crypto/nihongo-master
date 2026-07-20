import { NextResponse } from "next/server";
import { handleApiError, requireAccount } from "@/lib/api-helpers";
import { listLevels } from "@/lib/repo/content";

export async function GET() {
  try {
    await requireAccount();
    const levels = await listLevels();
    return NextResponse.json({ levels });
  } catch (error) {
    return handleApiError(error);
  }
}
