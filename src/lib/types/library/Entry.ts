export type MediaType = "book" | "magazine" | string

/** Plain-object shape for Entry fields in JSON (matches exported XLSX columns). */
export type SerializedEntry = {
    id?: number
    mediaType: MediaType
    title: string
    sortBy?: string
    author?: string
    publishedBy?: string
    publishedOn?: string
    publishedLocation?: string
    edition?: string
    editionYear?: string
    serialNumber?: string
    catalogNumber?: string
    section?: string
    subCategory?: string
    status?: string
    publishedSource?: string
    pages?: string
    /** True when the ID cell (column A) has strikethrough in the spreadsheet. */
    deleted?: boolean
}

/** The Entry fields an import can carry, in the order the UI compares them. */
export const ENTRY_FIELDS = [
    "title",
    "author",
    "mediaType",
    "sortBy",
    "publishedBy",
    "publishedOn",
    "publishedLocation",
    "edition",
    "editionYear",
    "serialNumber",
    "catalogNumber",
    "section",
    "subCategory",
    "status",
    "publishedSource",
    "pages",
] as const

export type EntryField = (typeof ENTRY_FIELDS)[number]

/**
 * A row read from a spreadsheet. Fields are optional because a section can hide
 * columns from its export — a missing field means "not in the sheet", not "empty".
 */
export type ImportedRecord = Partial<SerializedEntry>

/** Response body when parsing a library spreadsheet (first worksheet). */
export type SpreadsheetWorksheetPayload = {
    records: ImportedRecord[]
    /**
     * The Entry fields whose column was present in the sheet. Fields outside this
     * list were never in the file and must be left untouched on save.
     */
    fields: EntryField[]
}

type OptionalFields = {
    id?: number
    sortBy?: string
    author?: string
    publishedBy?: string
    publishedOn?: string
    publishedLocation?: string
    edition?: string
    editionYear?: string
    serialNumber?: string
    catalogNumber?: string
    section?: string
    subCategory?: string
    status?: string
    publishedSource?: string
    pages?: string
}

export class Entry {
    id?: number
    mediaType: MediaType
    title: string
    sortBy?: string
    author?: string
    publishedBy?: string
    publishedOn?: string
    publishedLocation?: string
    edition?: string
    editionYear?: string
    serialNumber?: string
    catalogNumber?: string
    section?: string
    subCategory?: string
    status?: string
    publishedSource?: string
    pages?: string

    constructor(title: string, mediaType: MediaType, rest = {} as OptionalFields) {
        this.title = title
        this.mediaType = mediaType

        this.id = rest.id
        this.sortBy = rest.sortBy
        this.author = rest.author
        this.publishedBy = rest.publishedBy
        this.publishedLocation = rest.publishedLocation
        this.publishedOn = rest.publishedOn
        this.edition = rest.edition
        this.editionYear = rest.editionYear
        this.serialNumber = rest.serialNumber
        this.catalogNumber = rest.catalogNumber
        this.section = rest.section
        this.subCategory = rest.subCategory
        this.status = rest.status
        this.publishedSource = rest.publishedSource
        this.pages = rest.pages
    }

    asFormData() {
        const data = new FormData()

        data.append("mediaType", this.mediaType);
        data.append("title", this.title);
        data.append("sortBy", this.sortBy ?? "");
        data.append("author", this.author ?? "");
        data.append("publishedBy", this.publishedBy ?? "");
        data.append("publishedOn", this.publishedOn ?? "");
        data.append("publishedLocation", this.publishedLocation ?? "");
        data.append("edition", this.edition ?? "");
        data.append("editionYear", this.editionYear ?? "");
        data.append("serialNumber", this.serialNumber ?? "");
        data.append("catalogNumber", this.catalogNumber ?? "");
        data.append("section", this.section ?? "");
        data.append("subCategory", this.subCategory ?? "");
        data.append("status", this.status ?? "");
        data.append("publishedSource", this.publishedSource ?? "");
        data.append("pages", this.pages ?? "");

        return data
    }

    static async fromResponse(res: Response) {
        return Entry.fromJSON(await res.json())
    }

    static fromJSON(data: Record<string, unknown>) {
        return new Entry(data.title as string, data.mediaType as string, { ...data })
    }

    withId(id: number): Entry {
        this.id = id
        return this
    }

    is(that: Entry) {
        return this.id === that.id
    }
}