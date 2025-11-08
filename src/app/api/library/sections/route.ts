import { NextResponse } from "next/server";
import { apiGet } from "../../database";

export async function GET() {
  const results = await apiGet<{ section: string | null }>(
    "SELECT DISTINCT COALESCE(TRIM(section), '') AS section FROM library ORDER BY section ASC"
  );

  const sections = results
    .map((row) => (row.section ?? ""));

  return NextResponse.json({ success: true, sections });
}
