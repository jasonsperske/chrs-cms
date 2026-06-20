import { NextResponse } from "next/server";
import { apiGet, apiPost } from "../database";
import { saveEntryImages } from "../uploads";
import { Entry } from "@/lib/types/library/Entry";
import { formBody } from "@/lib/utils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sectionParam = searchParams.get("section")

    const baseQuery = "SELECT * FROM library"
    const orderBy = " ORDER BY section ASC, mediaType ASC, sortBy ASC, title ASC"

    let query = baseQuery
    const params: unknown[] = []

    if (sectionParam !== null) {
        const trimmed = sectionParam.trim()
        if (trimmed.length === 0) {
            query += " WHERE section IS NULL OR TRIM(section) = ''"
        } else {
            query += " WHERE section = ?"
            params.push(sectionParam)
        }
    }

    query += orderBy

    const results = await apiGet<Entry>(query, params)
    return NextResponse.json({ success: true, results })
}

export async function POST(request: Request) {
    const formData = await request.formData();
    const body = formBody(formData);

    const mediaType = body("mediaType")
    const title = body("title")
    const sortBy = body("sortBy")
    const author = body("author")
    const section = body("section")
    const publishedBy = body("publishedBy")
    const publishedOn = body("publishedOn")
    const publishedLocation = body("publishedLocation")
    const edition = body("edition")
    const editionYear = body("editionYear")
    const serialNumber = body("serialNumber")
    const catalogNumber = body("catalogNumber")
    const subCategory = body("subCategory")
    const status = body("status")
    const publishedSource = body("publishedSource")
    const pages = body("pages")

    const id = await apiPost(
        "INSERT INTO library(mediaType, title, sortBy, author, section, publishedBy, publishedOn, publishedLocation, edition, editionYear, serialNumber, catalogNumber, subCategory, status, publishedSource, pages) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
        [
            mediaType,
            title,
            sortBy,
            author,
            section,
            publishedBy,
            publishedOn,
            publishedLocation,
            edition,
            editionYear,
            serialNumber,
            catalogNumber,
            subCategory,
            status,
            publishedSource,
            pages
        ])

    // The images uploaded for scanning have no entry to belong to until the
    // record is created above. Now that an id is assigned, persist them under
    // uploads/<id>/.
    const images = formData
        .getAll("images")
        .filter((field): field is File => field instanceof File && field.size > 0)
    await saveEntryImages(id, images)

    return NextResponse.json(
        {
            success: true,
            id,
            mediaType,
            title,
            sortBy,
            author,
            section,
            publishedBy,
            publishedOn,
            publishedLocation,
            edition,
            editionYear,
            serialNumber,
            catalogNumber,
            subCategory,
            status,
            publishedSource,
            pages
        })
}