export type MediaType = "book" | "magazine" | string
type OptionalFields = {
    id?: number
    author?: string
    publishedBy?: string
    publishedOn?: string
    publishedLocation?: string
    edition?: string
    editionYear?: string
    serialNumber?: string
    catalogNumber?: string
    section?: string
}

export class Entry {
    id?: number
    mediaType: MediaType
    title: string
    author?: string
    publishedBy?: string
    publishedOn?: string
    publishedLocation?: string
    edition?: string
    editionYear?: string
    serialNumber?: string
    catalogNumber?: string
    section?: string

    constructor(title: string, mediaType: MediaType, rest = {} as OptionalFields) {
        this.title = title
        this.mediaType = mediaType

        this.id = rest.id
        this.author = rest.author
        this.publishedBy = rest.publishedBy
        this.publishedLocation = rest.publishedLocation
        this.publishedOn = rest.publishedOn
        this.edition = rest.edition
        this.editionYear = rest.editionYear
        this.serialNumber = rest.serialNumber
        this.catalogNumber = rest.catalogNumber
        this.section = rest.section
    }

    asFormData() {
        const data = new FormData()

        data.append("mediaType", this.mediaType);
        data.append("title", this.title);
        data.append("author", this.author ?? "");
        data.append("publishedBy", this.publishedBy ?? "");
        data.append("publishedOn", this.publishedOn ?? "");
        data.append("publishedLocation", this.publishedLocation ?? "");
        data.append("edition", this.edition ?? "");
        data.append("editionYear", this.editionYear ?? "");
        data.append("serialNumber", this.serialNumber ?? "");
        data.append("catalogNumber", this.catalogNumber ?? "");
        data.append("section", this.section ?? "")

        return data
    }

    static async fromResponse(res: Response) {
        return Entry.fromJSON(await res.json())
    }

    static fromJSON(data: any) {
        return new Entry(data.title, data.mediaType, { ...data })
    }

    withId(id: number): Entry {
        this.id = id
        return this
    }

    is(that: Entry) {
        return this.id === that.id
    }
}