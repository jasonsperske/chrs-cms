import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { COLUMN_DEFS } from "@/lib/types/library/Columns";
import type {
    EntryField,
    ImportedRecord,
    SpreadsheetWorksheetPayload,
} from "@/lib/types/library/Entry";

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
        return NextResponse.json({ records: [], fields: [] } satisfies SpreadsheetWorksheetPayload);
    }

    // Build a column-name → index map from the header row
    const headers = (rows[0] as unknown[]).map((h) => String(h ?? "").trim());
    const col = (name: string) => headers.indexOf(name);

    const idCol = col("ID");

    // Match the sheet against the known columns by header text. A section can
    // hide columns from its export, so whatever is missing here is simply not
    // part of this import — the fields it covers are left untouched on save.
    // Derived columns (Year) are display only and never read back.
    const sheetColumns = COLUMN_DEFS.flatMap((def) => {
        if (!def.field) return [];
        const index = col(def.label);
        return index >= 0 ? [{ field: def.field, index }] : [];
    });
    const fields: EntryField[] = sheetColumns.map((column) => column.field);

    function str(v: unknown): string | undefined {
        if (v === null || v === undefined || v === "") return undefined;
        return String(v).trim() || undefined;
    }

    const records: ImportedRecord[] = [];

    for (let i = 1; i < rows.length; i++) {
        const row = rows[i] as unknown[];

        const rawId = idCol >= 0 ? row[idCol] : undefined;
        const numId = rawId != null && rawId !== "" ? Number(rawId) : undefined;
        const id = numId != null && !isNaN(numId) ? numId : undefined;

        const values: Record<string, string | undefined> = {};
        for (const column of sheetColumns) {
            values[column.field] = str(row[column.index]);
        }

        // An existing row is identified by its ID, so it can be updated even when
        // the sheet leaves out Title or Media. A new row still needs a title;
        // without a Media column it becomes a book, matching the manual add form.
        if (id === undefined) {
            if (!values.title) continue;
            if (!values.mediaType) values.mediaType = "book";
        }

        records.push({ id, ...values } as ImportedRecord);
    }

    return NextResponse.json({ records, fields } satisfies SpreadsheetWorksheetPayload);
}
