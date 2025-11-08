import { NextResponse } from "next/server";
import { apiGet, apiPost } from "../database";
import { Entry } from "@/lib/types/library/Entry";
import { formBody } from "@/lib/utils";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const sectionParam = searchParams.get("section")

    const baseQuery = "SELECT * FROM library"
    const orderBy = " ORDER BY section ASC, mediaType ASC, title ASC"

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
    const body = formBody(await request.formData());

    const mediaType = body("mediaType")
    const title = body("title")
    const author = body("author")
    const section = body("section")
    const publishedBy = body("publishedBy")
    const publishedOn = body("publishedOn")
    const publishedLocation = body("publishedLocation")
    const edition = body("edition")
    const editionYear = body("editionYear")
    const serialNumber = body("serialNumber")
    const catalogNumber = body("catalogNumber")

    const id = await apiPost(
        "INSERT INTO library(mediaType, title, author, section, publishedBy, publishedOn, publishedLocation, edition, editionYear, serialNumber, catalogNumber) VALUES (?, ?,?,?,?,?,?,?,?,?,?)",
        [
            mediaType,
            title,
            author,
            section,
            publishedBy,
            publishedOn,
            publishedLocation,
            edition,
            editionYear,
            serialNumber,
            catalogNumber
        ])

    return NextResponse.json(
        {
            success: true,
            id,
            mediaType,
            title,
            author,
            section,
            publishedBy,
            publishedOn,
            publishedLocation,
            edition,
            editionYear,
            serialNumber,
            catalogNumber
        })
}