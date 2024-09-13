import { NextResponse } from "next/server";
import { apiGet, apiPost } from "../database";

export type Entry = {}

export async function GET(request: Request) {
    const results = await apiGet<Entry[]>('SELECT * FROM library ORDER BY title ASC')
    return NextResponse.json({ success: true, results })
}

export async function POST(request: Request) {
    const body = await request.formData();
    const mediaType = body.get("mediaType")
    const title = body.get("title")
    const author = body.get("author")
    const publishedBy = body.get("publishedBy")
    const publishedOn = body.get("publishedOn")
    const serialNumber = body.get("serialNumber")
    const catalogNumber = body.get("catalogNumber")

    const id = await apiPost(
        "INSERT INTO library(mediaType, title, author, publishedBy, publishedOn, serialNumber, catalogNumber) VALUES (?,?,?,?,?,?,?)",
        [
            mediaType?.valueOf(),
            title?.valueOf(),
            author?.valueOf(),
            publishedBy?.valueOf(),
            publishedOn?.valueOf(),
            serialNumber?.valueOf(),
            catalogNumber?.valueOf()])

    return NextResponse.json({ success: true, entry: { id, mediaType, title, author, publishedBy, publishedOn, serialNumber, catalogNumber } })
}