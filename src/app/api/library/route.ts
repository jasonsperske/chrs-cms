import { NextResponse } from "next/server";
import { apiGet, apiPost } from "../database";
import { Entry } from "@/lib/types/library/Entry";

export async function GET() {
    const results = await apiGet<Entry>('SELECT * FROM library ORDER BY section ASC, title ASC')
    return NextResponse.json({ success: true, results })
}

export async function POST(request: Request) {
    const body = await request.formData();
    const mediaType = body.get("mediaType")
    const title = body.get("title")
    const author = body.get("author")
    const section = body.get("section")
    const publishedBy = body.get("publishedBy")
    const publishedOn = body.get("publishedOn")
    const publishedLocation = body.get("publishedLocation")
    const edition = body.get("edition")
    const editionYear = body.get("editionYear")
    const serialNumber = body.get("serialNumber")
    const catalogNumber = body.get("catalogNumber")

    const id = await apiPost(
        "INSERT INTO library(mediaType, title, author, section, publishedBy, publishedOn, publishedLocation, edition, editionYear, serialNumber, catalogNumber) VALUES (?, ?,?,?,?,?,?,?,?,?,?)",
        [
            mediaType?.valueOf(),
            title?.valueOf(),
            author?.valueOf(),
            section?.valueOf(),
            publishedBy?.valueOf(),
            publishedOn?.valueOf(),
            publishedLocation?.valueOf(),
            edition?.valueOf(),
            editionYear?.valueOf(),
            serialNumber?.valueOf(),
            catalogNumber?.valueOf()])

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