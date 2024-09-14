export type BookVariation = {
    title: string,
    author: string,
    publishedBy: string,
    publishedLocation: string,
    edition: string,
    editionYear: number,
    yearPublished: number,
    monthPublished: string,
    mediaType: string,
    serialNumber: string,
    catalogNumber: string,
    confidence: number
}

function stripAINoise(input: string, leadingNoise: string[] = []) {
    if (input == null) {
        return ''
    } else {
        const EmptyValueAliases = ['null', 'undefined', 'not available']
        if (EmptyValueAliases.includes(input.toLowerCase())) {
            return ''
        } else {
            if (leadingNoise.length > 0) {
                for (const leading of leadingNoise) {
                    if (input.startsWith(leading)) {
                        return input.substring(leading.length)
                    }
                }
            }
            return input
        }
    }
}

export function asFormData(book: BookVariation) {
    const data = new FormData()
    data.set("mediaType", book.mediaType)
    data.set("title", stripAINoise(book.title))
    data.set("author", stripAINoise(book.author))
    data.set("publishedBy", stripAINoise(book.publishedBy))
    data.set("publishedOn", `${stripAINoise(book.monthPublished)} ${stripAINoise(book.yearPublished?.toString() ?? '')}`.trim())
    data.set("publishedLocation", stripAINoise(book.publishedLocation))
    data.set("edition", stripAINoise(book.edition))
    data.set("editionYear", stripAINoise(book.editionYear?.toString()))
    data.set("serialNumber", stripAINoise(book.serialNumber))
    data.set("catalogNumber", stripAINoise(book.catalogNumber))
    return data
}