import { NextResponse } from "next/server";
import XlsxPopulate from "xlsx-populate";
import { apiGet, apiPost } from "../database";
import { Entry } from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";

function sanatizeName(name: string): string {
    return name?.replace(/[^a-z0-9\s]/gi, '-') ?? "Unknown";
}

function sanatizeYear(entry: Entry): number | undefined {
    const years = [entry.publishedOn, entry.editionYear]
        .filter(Boolean)
        .map((date) => /(\d{4})/.exec(date ?? "")?.[1])
        .map(Number)
        .filter(Boolean);
    return years.length ? Math.max(...years) : undefined;
}

export async function GET() {
    const library = new Library(await apiGet<Entry>('SELECT * FROM library ORDER BY section ASC, mediaType ASC, id ASC'))
    const workbook = await XlsxPopulate.fromBlankAsync();
    library.sections.forEach((section, i) => {
        let worksheet;
        if (!section.name) {
            worksheet = workbook.sheet(0);
            worksheet.name("Unknown");
        } else {
            worksheet = workbook.addSheet(sanatizeName(section.name), i);
        }
        worksheet.cell("A1").value("Media");
        worksheet.cell("B1").value("Author");
        worksheet.cell("C1").value("Title");
        worksheet.cell("D1").value("Year");
        worksheet.cell("E1").value("Place Published");
        worksheet.cell("F1").value("Publisher");
        worksheet.cell("G1").value("Edition");
        worksheet.cell("H1").value("ISBN");
        worksheet.cell("I1").value("LOC");
        worksheet.cell("J1").value("Category");
        worksheet.cell("K1").value("Status");
        // set header styles
        const header = worksheet.range("A1:K1");
        header.style({ bold: true, fontSize: 11, fontColor: 'FFFFFF', fill: '156082' });
        worksheet.column("A").width(12);
        worksheet.column("B").width(25);
        worksheet.column("C").width(40);
        worksheet.column("D").width(6);
        worksheet.column("E").width(15);
        worksheet.column("F").width(21);
        worksheet.column("G").width(21);
        worksheet.column("H").width(15);
        worksheet.column("I").width(10);
        worksheet.column("J").width(10);
        worksheet.column("K").width(10);
        // freeze top row
        worksheet.freezePanes(0, 1);
        let lastMedia = "";
        section.entries.forEach((entry, j) => {
            worksheet.cell(`A${j + 2}`).value(entry.mediaType);
            worksheet.cell(`B${j + 2}`).value(entry.author).style('wrapText', true);
            worksheet.cell(`C${j + 2}`).value(entry.title).style({ 'wrapText': true, bold: true });
            const year = sanatizeYear(entry);
            if (year) worksheet.cell(`D${j + 2}`).value(year).style('horizontalAlignment', 'center');
            worksheet.cell(`E${j + 2}`).value(entry.publishedLocation).style('wrapText', true);
            worksheet.cell(`F${j + 2}`).value(entry.publishedBy).style('wrapText', true);
            worksheet.cell(`G${j + 2}`).value(entry.edition).style('wrapText', true);
            worksheet.cell(`H${j + 2}`).value(entry.serialNumber);
            worksheet.cell(`I${j + 2}`).value(entry.catalogNumber);
            const style = { verticalAlignment: 'top', border: true, fontSize: 12 } as Record<string, unknown>;
            if(!lastMedia) {
                lastMedia = entry.mediaType;
            } else if(entry.mediaType !== lastMedia) {
                lastMedia = entry.mediaType;
                style['topBorder'] = 'double';
            }
            worksheet.range(`A${j + 2}:K${j + 2}`).style(style);
        });
    });

    return new NextResponse(await workbook.outputAsync(), {
        status: 200,
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename=library-${(new Date().toISOString())}.xlsx`
        }
    });
}