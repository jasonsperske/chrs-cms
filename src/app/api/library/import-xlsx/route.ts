import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import type { SerializedEntry, SpreadsheetWorksheetPayload } from "@/lib/types/library/Entry";

export async function POST(request: Request): Promise<Response> {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
        return NextResponse.json({ processingError: "No file provided." }, { status: 400 });
    }

    const isXlsx =
        file.name.toLowerCase().endsWith(".xlsx") ||
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    if (!isXlsx) {
        return NextResponse.json(
            { processingError: "Only XLSX files are accepted." },
            { status: 400 }
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    // cellStyles:false skips parsing the styles XML (borders/fills/fonts),
    // which Excel rewrites in full whenever a row is deleted — the main source of slowness.
    const workbook = XLSX.read(buffer, { type: "buffer", cellStyles: false });

    if (workbook.SheetNames.length !== 1) {
        return NextResponse.json(
            {
                processingError: `This XLSX contains ${workbook.SheetNames.length} worksheets. Import only accepts XLSX files with a single worksheet.`,
            },
            { status: 422 }
        );
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    // raw:true skips number-format rendering — we only need the stored values.
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
        header: 1,
        defval: null,
        raw: true,
    });

    if (rows.length < 2) {
        return NextResponse.json({ records: [] } satisfies SpreadsheetWorksheetPayload);
    }

    // Build a column-name → index map from the header row
    const headers = (rows[0] as unknown[]).map((h) => String(h ?? "").trim());
    const col = (name: string) => headers.indexOf(name);

    const idCol = col("ID");
    const mediaCol = col("Media");
    const sortByCol = col("Sort By");
    const authorCol = col("Author");
    const titleCol = col("Title");
    const publishedOnCol = col("Published On");
    const publishedLocationCol = col("Place Published");
    const publishedByCol = col("Publisher");
    const editionCol = col("Edition");
    const editionYearCol = col("Edition Year");
    const serialNumberCol = col("ISBN");
    const catalogNumberCol = col("LOC");
    const sectionCol = col("Section");

    function str(v: unknown): string | undefined {
        if (v === null || v === undefined || v === "") return undefined;
        return String(v).trim() || undefined;
    }

    const records: SerializedEntry[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as unknown[];
        const title = str(row[titleCol]);
        const mediaType = str(row[mediaCol]);
        if (!title || !mediaType) continue;

        const rawId = idCol >= 0 ? row[idCol] : undefined;
        const numId = rawId != null && rawId !== "" ? Number(rawId) : undefined;

        records.push({
            id: numId != null && !isNaN(numId) ? numId : undefined,
            mediaType,
            title,
            sortBy: sortByCol >= 0 ? str(row[sortByCol]) : undefined,
            author: authorCol >= 0 ? str(row[authorCol]) : undefined,
            publishedOn: publishedOnCol >= 0 ? str(row[publishedOnCol]) : undefined,
            publishedLocation: publishedLocationCol >= 0 ? str(row[publishedLocationCol]) : undefined,
            publishedBy: publishedByCol >= 0 ? str(row[publishedByCol]) : undefined,
            edition: editionCol >= 0 ? str(row[editionCol]) : undefined,
            editionYear: editionYearCol >= 0 ? str(row[editionYearCol]) : undefined,
            serialNumber: serialNumberCol >= 0 ? str(row[serialNumberCol]) : undefined,
            catalogNumber: catalogNumberCol >= 0 ? str(row[catalogNumberCol]) : undefined,
            section: sectionCol >= 0 ? str(row[sectionCol]) : undefined,
        });
    }

    return NextResponse.json({ records } satisfies SpreadsheetWorksheetPayload);
}
