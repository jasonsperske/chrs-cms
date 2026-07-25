import type { EntryField, SerializedEntry } from "./Entry"

/** Anything with Entry's shape — the class, a plain record, or an imported row. */
type EntryLike = Partial<SerializedEntry>

export type ColumnKey =
    | "mediaType"
    | "sortBy"
    | "author"
    | "title"
    | "publishedOn"
    | "year"
    | "publishedLocation"
    | "publishedBy"
    | "edition"
    | "editionYear"
    | "serialNumber"
    | "catalogNumber"
    | "subCategory"
    | "status"
    | "publishedSource"
    | "pages"

export type ColumnDef = {
    key: ColumnKey
    /** Header text, used both for the table and as the XLSX header (which import matches on). */
    label: string
    /** XLSX column width. */
    width: number
    /**
     * The Entry field this column reads and writes. Absent for derived columns,
     * which are computed for display only and never written back on import.
     */
    field?: EntryField
    /** Extra xlsx-populate cell styles applied to the column's body cells. */
    cellStyle?: Record<string, unknown>
    value: (entry: EntryLike) => string | number | undefined
}

/**
 * The year shown in the "Year" column: the latest four digit year found in the
 * publication or edition dates.
 */
export function sanitizeYear(entry: EntryLike): number | undefined {
    const years = [entry.publishedOn, entry.editionYear]
        .filter(Boolean)
        .map((date) => /(\d{4})/.exec(date ?? "")?.[1])
        .map(Number)
        .filter(Boolean)
    return years.length ? Math.max(...years) : undefined
}

/** The value the export writes for "Sort By", which falls back to author then title. */
export function sortByValue(entry: EntryLike): string {
    return entry.sortBy ? entry.sortBy : entry.author ? entry.author : entry.title ?? ""
}

/**
 * Every column a section can display, in the order used when nothing has been
 * customized. This order and these labels match the historic export exactly, so
 * an unconfigured section exports the same workbook it always did.
 */
export const COLUMN_DEFS: ColumnDef[] = [
    { key: "mediaType", label: "Media", width: 12, field: "mediaType", value: (e) => e.mediaType },
    { key: "sortBy", label: "Sort By", width: 25, field: "sortBy", cellStyle: { wrapText: true }, value: sortByValue },
    { key: "author", label: "Author", width: 25, field: "author", cellStyle: { wrapText: true }, value: (e) => e.author },
    { key: "title", label: "Title", width: 40, field: "title", cellStyle: { wrapText: true, bold: true }, value: (e) => e.title },
    { key: "publishedOn", label: "Published On", width: 14, field: "publishedOn", value: (e) => e.publishedOn },
    { key: "year", label: "Year", width: 6, cellStyle: { horizontalAlignment: "center", fill: "f0f0f0" }, value: sanitizeYear },
    { key: "publishedLocation", label: "Place Published", width: 15, field: "publishedLocation", cellStyle: { wrapText: true }, value: (e) => e.publishedLocation },
    { key: "publishedBy", label: "Publisher", width: 21, field: "publishedBy", cellStyle: { wrapText: true }, value: (e) => e.publishedBy },
    { key: "edition", label: "Edition", width: 21, field: "edition", cellStyle: { wrapText: true }, value: (e) => e.edition },
    { key: "editionYear", label: "Edition Year", width: 14, field: "editionYear", cellStyle: { wrapText: true }, value: (e) => e.editionYear },
    { key: "serialNumber", label: "ISBN", width: 15, field: "serialNumber", value: (e) => e.serialNumber },
    { key: "catalogNumber", label: "LOC", width: 10, field: "catalogNumber", value: (e) => e.catalogNumber },
    { key: "subCategory", label: "Sub-Category", width: 10, field: "subCategory", value: (e) => e.subCategory },
    { key: "status", label: "Status", width: 10, field: "status", value: (e) => e.status },
    { key: "publishedSource", label: "Published Source", width: 15, field: "publishedSource", value: (e) => e.publishedSource },
    { key: "pages", label: "Pages", width: 10, field: "pages", value: (e) => e.pages },
]

const COLUMNS_BY_KEY = new Map(COLUMN_DEFS.map((def) => [def.key, def]))

export function columnDef(key: ColumnKey): ColumnDef | undefined {
    return COLUMNS_BY_KEY.get(key)
}

/** A section's saved preference: every known column, in order, flagged shown or hidden. */
export type ColumnSetting = { key: ColumnKey; visible: boolean }
export type ColumnConfig = ColumnSetting[]

/** The starting point the editor offers: the historic export order, all shown. */
export function defaultColumnConfig(): ColumnConfig {
    return COLUMN_DEFS.map((def) => ({ key: def.key, visible: true }))
}

/**
 * Coerce stored or posted JSON into a usable config. Unknown and duplicated keys
 * are dropped; columns added to the app after the config was saved are appended
 * hidden, so a new column never silently changes an existing section's layout.
 * Returns null when the input isn't a usable config at all.
 */
export function normalizeColumnConfig(raw: unknown): ColumnConfig | null {
    if (!Array.isArray(raw)) return null

    const seen = new Set<ColumnKey>()
    const config: ColumnConfig = []

    for (const item of raw) {
        if (!item || typeof item !== "object") continue
        const { key, visible } = item as { key?: unknown; visible?: unknown }
        if (typeof key !== "string" || !COLUMNS_BY_KEY.has(key as ColumnKey)) continue
        if (seen.has(key as ColumnKey)) continue
        seen.add(key as ColumnKey)
        config.push({ key: key as ColumnKey, visible: visible !== false })
    }

    if (config.length === 0) return null

    for (const def of COLUMN_DEFS) {
        if (!seen.has(def.key)) config.push({ key: def.key, visible: false })
    }

    return config
}

/** True when the config is indistinguishable from the default (so it's worth discarding). */
export function isDefaultColumnConfig(config: ColumnConfig): boolean {
    if (config.length !== COLUMN_DEFS.length) return false
    return config.every((setting, i) => setting.key === COLUMN_DEFS[i].key && setting.visible)
}

/**
 * The columns to render or export, in order. A section with no config gets every
 * column in the default order.
 */
export function visibleColumns(config: ColumnConfig | null | undefined): ColumnDef[] {
    if (!config) return [...COLUMN_DEFS]
    return config
        .filter((setting) => setting.visible)
        .map((setting) => COLUMNS_BY_KEY.get(setting.key))
        .filter((def): def is ColumnDef => def !== undefined)
}
