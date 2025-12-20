import { NextResponse } from "next/server";
import { apiGet } from "../../database";
import { Entry } from "@/lib/types/library/Entry";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ success: true, results: [] });
  }

  const searchTerm = `%${query.trim()}%`;

  // Search prioritizing: title > author > publishedBy > edition
  // Using CASE statements to assign priority, then order by priority and relevance
  const sqlQuery = `
    SELECT *,
      CASE 
        WHEN title LIKE ? THEN 1
        WHEN author LIKE ? THEN 2
        WHEN publishedBy LIKE ? THEN 3
        WHEN edition LIKE ? THEN 4
        ELSE 5
      END as priority
    FROM library
    WHERE title LIKE ? 
       OR author LIKE ? 
       OR publishedBy LIKE ? 
       OR edition LIKE ?
    ORDER BY priority ASC, title ASC
    LIMIT 100
  `;

  const results = await apiGet<Entry & { priority?: number }>(
    sqlQuery,
    [
      searchTerm, // for CASE title
      searchTerm, // for CASE author
      searchTerm, // for CASE publishedBy
      searchTerm, // for CASE edition
      searchTerm, // for WHERE title
      searchTerm, // for WHERE author
      searchTerm, // for WHERE publishedBy
      searchTerm, // for WHERE edition
    ]
  );

  // Remove the priority field before returning
  const entries = results.map(({ priority, ...entry }) => entry);

  return NextResponse.json({ success: true, results: entries });
}

