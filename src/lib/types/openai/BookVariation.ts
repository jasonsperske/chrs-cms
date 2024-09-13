export type BookVariation = {
    title: string,
    author: string,
    publishedBy: string,
    yearPublished: number,
    monthPublished: string,
    mediaType: string,
    serialNumber: string,
    catalogNumber: string,
    confidence: number
}

export function asFormData(book: BookVariation) {
    const data = new FormData()
    data.set("mediaType", book.mediaType)
    data.set("title", book.title)
    data.set("author", book.author)
    data.set("publishedBy", book.publishedBy)
    data.set("publishedOn", `${book.monthPublished ?? ''} ${book.yearPublished ?? ''}`.trim())
    data.set("serialNumber", book.serialNumber)
    data.set("catalogNumber", book.catalogNumber)
    return data
}