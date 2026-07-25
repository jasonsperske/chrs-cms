import { NextResponse } from "next/server";
import XlsxPopulate from "xlsx-populate";
import { getAllColumnConfigs, sectionKey } from "../columns";
import { apiGet } from "../database";
import { visibleColumns } from "@/lib/types/library/Columns";
import { Entry } from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";

const MAX_SHEET_NAME_LENGTH = 31;

function sanitizeName(name: string): string {
    return name?.replace(/[^a-z0-9\s]/gi, '-').substring(0, MAX_SHEET_NAME_LENGTH) ?? "Unknown";
}

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sectionParam = searchParams.get("section")

    let query = 'SELECT * FROM library'
    const params: unknown[] = []
    let librarySection: string | undefined = undefined
    let filenameSection: string | undefined = undefined

    if (sectionParam !== null) {
        const trimmed = sectionParam.trim()
        if (trimmed.length === 0) {
            query += " WHERE section IS NULL OR TRIM(section) = ''"
            librarySection = ""
            filenameSection = "Unknown"
        } else {
            query += ' WHERE section = ?'
            params.push(sectionParam)
            librarySection = sectionParam
            filenameSection = sectionParam
        }
    }

    query += ' ORDER BY section ASC, mediaType ASC, id ASC'

    const library = new Library(await apiGet<Entry>(query, params), librarySection)
    const columnConfigs = await getAllColumnConfigs()
    const workbook = await XlsxPopulate.fromBlankAsync();
    library.sections.forEach((section, i) => {
        let worksheet;
        if (!section.name) {
            worksheet = workbook.sheet(0);
            worksheet.name("Unknown");
        } else if (sectionParam) {
            worksheet = workbook.sheet(0);
            worksheet.name(sanitizeName(section.name));
        } else {
            worksheet = workbook.addSheet(sanitizeName(section.name), i);
        }

        // Column A always holds the ID (hidden), so the sheet can be imported back
        // no matter which columns the section chooses to show. Everything the
        // section has configured follows from column B.
        const columns = visibleColumns(columnConfigs.get(sectionKey(section.name)))
        const lastColumn = columns.length + 1

        worksheet.cell(1, 1).value("ID")
        columns.forEach((column, c) => {
            worksheet.cell(1, c + 2).value(column.label)
        })
        // set header styles
        const header = worksheet.range(1, 1, 1, lastColumn);
        header.style({ bold: true, fontSize: 11, fontColor: 'FFFFFF', fill: '156082' });
        worksheet.column(1).width(4);
        columns.forEach((column, c) => {
            worksheet.column(c + 2).width(column.width);
        });
        // freeze top row
        worksheet.freezePanes(0, 1);
        let lastMedia = "";
        section.entries.forEach((entry, j) => {
            const row = j + 2
            worksheet.cell(row, 1).value(entry.id);
            columns.forEach((column, c) => {
                const cell = worksheet.cell(row, c + 2)
                const value = column.value(entry)
                cell.value(value)
                // Only decorate cells that carry a value, so an empty Year keeps
                // the plain background it always had.
                if (column.cellStyle && value !== undefined && value !== "") {
                    cell.style(column.cellStyle)
                }
            });
            const style = { verticalAlignment: 'top', border: true, fontSize: 12 } as Record<string, unknown>;
            if (!lastMedia) {
                lastMedia = entry.mediaType;
            } else if (entry.mediaType !== lastMedia) {
                lastMedia = entry.mediaType;
                style['topBorder'] = 'double';
            }
            worksheet.range(row, 1, row, lastColumn).style(style);
        });
        worksheet.column(1).hidden(true);
    });

    const timestamp = new Date().toISOString()
    const filenameBase = filenameSection ? `library-${sanitizeName(filenameSection)}` : 'library'

    return new NextResponse(await workbook.outputAsync(), {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=${filenameBase}-${timestamp}.xlsx`
        }
    });
}
