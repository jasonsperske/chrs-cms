import { NextResponse } from "next/server"
import {
    deleteColumnConfig,
    getColumnConfig,
    saveColumnConfig,
} from "../../columns"
import {
    isDefaultColumnConfig,
    normalizeColumnConfig,
} from "@/lib/types/library/Columns"

export const dynamic = "force-dynamic"

/**
 * The section whose columns are being configured. Unlike the library routes a
 * missing param is not "all sections" — it means the unnamed section.
 */
function sectionOf(request: Request): string {
    const { searchParams } = new URL(request.url)
    return searchParams.get("section") ?? ""
}

export async function GET(request: Request) {
    const section = sectionOf(request)
    const columns = await getColumnConfig(section)
    return NextResponse.json({ success: true, section, columns })
}

export async function PUT(request: Request) {
    const section = sectionOf(request)

    let body: unknown
    try {
        body = await request.json()
    } catch {
        return NextResponse.json(
            { success: false, error: "Expected a JSON body." },
            { status: 400 }
        )
    }

    const columns = normalizeColumnConfig((body as { columns?: unknown })?.columns)
    if (!columns) {
        return NextResponse.json(
            { success: false, error: "No recognised columns in the request." },
            { status: 400 }
        )
    }

    if (!columns.some((column) => column.visible)) {
        return NextResponse.json(
            { success: false, error: "At least one column must be visible." },
            { status: 400 }
        )
    }

    // Saving the defaults is the same as having no customization at all; storing
    // nothing keeps the section following the defaults as they evolve.
    if (isDefaultColumnConfig(columns)) {
        await deleteColumnConfig(section)
        return NextResponse.json({ success: true, section, columns: null })
    }

    await saveColumnConfig(section, columns)
    return NextResponse.json({ success: true, section, columns })
}

export async function DELETE(request: Request) {
    const section = sectionOf(request)
    const deleted = await deleteColumnConfig(section)
    return NextResponse.json({ success: true, section, deleted, columns: null })
}
