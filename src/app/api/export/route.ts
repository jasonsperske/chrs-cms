import { NextResponse } from "next/server";
import XlsxPopulate from "xlsx-populate";
import { apiGet } from "../database";
import { Entry } from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";

const MAX_SHEET_NAME_LENGTH = 31;

function sanitizeName(name: string): string {
    return name?.replace(/[^a-z0-9\s]/gi, '-').substring(0, MAX_SHEET_NAME_LENGTH) ?? "Unknown";
}

function sanitizeYear(entry: Entry): number | undefined {
    const years = [entry.publishedOn, entry.editionYear]
        .filter(Boolean)
        .map((date) => /(\d{4})/.exec(date ?? "")?.[1])
        .map(Number)
        .filter(Boolean);
    return years.length ? Math.max(...years) : undefined;
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
        worksheet.cell("A1").value("ID")
        worksheet.cell("B1").value("Media");
        worksheet.cell("C1").value("Sort By");
        worksheet.cell("D1").value("Author");
        worksheet.cell("E1").value("Title");
        worksheet.cell("F1").value("Published On");
        worksheet.cell("G1").value("Year");
        worksheet.cell("H1").value("Place Published");
        worksheet.cell("I1").value("Publisher");
        worksheet.cell("J1").value("Edition");
        worksheet.cell("K1").value("Edition Year");
        worksheet.cell("L1").value("ISBN");
        worksheet.cell("M1").value("LOC");
        worksheet.cell("N1").value("Sub-Category");
        worksheet.cell("O1").value("Status");
        worksheet.cell("P1").value("Published Source");
        worksheet.cell("Q1").value("Pages");
        // set header styles
        const header = worksheet.range("A1:Q1");
        header.style({ bold: true, fontSize: 11, fontColor: 'FFFFFF', fill: '156082' });
        worksheet.column("A").width(4);
        worksheet.column("B").width(12);
        worksheet.column("C").width(25);
        worksheet.column("D").width(25);
        worksheet.column("E").width(40);
        worksheet.column("F").width(14);
        worksheet.column("G").width(6);
        worksheet.column("H").width(15);
        worksheet.column("I").width(21);
        worksheet.column("J").width(21);
        worksheet.column("K").width(14);
        worksheet.column("L").width(15);
        worksheet.column("M").width(10);
        worksheet.column("N").width(10);
        worksheet.column("O").width(10);
        worksheet.column("P").width(15);
        worksheet.column("Q").width(10);
        // freeze top row
        worksheet.freezePanes(0, 1);
        let lastMedia = "";
        section.entries.forEach((entry, j) => {
            worksheet.cell(`A${j + 2}`).value(entry.id);
            worksheet.cell(`B${j + 2}`).value(entry.mediaType);
            const sortBy = entry.sortBy ? entry.sortBy : entry.author ? entry.author : entry.title;
            worksheet.cell(`C${j + 2}`).value(sortBy).style('wrapText', true);
            worksheet.cell(`D${j + 2}`).value(entry.author).style('wrapText', true);
            worksheet.cell(`E${j + 2}`).value(entry.title).style({ 'wrapText': true, bold: true });
            worksheet.cell(`F${j + 2}`).value(entry.publishedOn);
            const year = sanitizeYear(entry);
            if (year) {
                worksheet.cell(`G${j + 2}`).value(year).style({ horizontalAlignment: 'center', fill: 'f0f0f0' });
            }
            worksheet.cell(`H${j + 2}`).value(entry.publishedLocation).style('wrapText', true);
            worksheet.cell(`I${j + 2}`).value(entry.publishedBy).style('wrapText', true);
            worksheet.cell(`J${j + 2}`).value(entry.edition).style('wrapText', true);
            worksheet.cell(`K${j + 2}`).value(entry.editionYear).style('wrapText', true);

            worksheet.cell(`L${j + 2}`).value(entry.serialNumber);
            worksheet.cell(`M${j + 2}`).value(entry.catalogNumber);
            const style = { verticalAlignment: 'top', border: true, fontSize: 12 } as Record<string, unknown>;
            if (!lastMedia) {
                lastMedia = entry.mediaType;
            } else if (entry.mediaType !== lastMedia) {
                lastMedia = entry.mediaType;
                style['topBorder'] = 'double';
            }
            worksheet.range(`A${j + 2}:Q${j + 2}`).style(style);
        });
        worksheet.column("A").hidden(true);
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