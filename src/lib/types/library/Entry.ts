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

        return data
    }

    withId(id: number): Entry {
        this.id = id
        return this
    }
}