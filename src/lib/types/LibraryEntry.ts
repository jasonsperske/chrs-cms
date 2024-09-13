import { type BookVariation } from "./openai/BookVariation"

export type LibraryEntry = {
    id: number,
    mediaType: string,
    title: string,
    author?: string,
    publishedBy?: string,
    publishedOn?: string,
    serialNumber?: string,
    catalogNumber?: string
}

export function asLibraryEntry(id: number, variation: BookVariation) {
    const entry: LibraryEntry = {
        id,
        mediaType: variation.mediaType,
        title: variation.title
    }
    return entry
}