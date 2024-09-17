import { ifDefined, notNull } from "@/lib/utils";
import { Entry } from "../library/Entry";

function stripAINoise(input: string | number | undefined, leadingNoise: string[] = []) {
    if (input == null) {
        return ''
    } else if (typeof input == 'string') {
        const EmptyValueAliases = ['null', 'undefined', 'not available', 'not specified']
        if (EmptyValueAliases.includes(input.toLowerCase()))
            return ''
        if (leadingNoise.length > 0) {
            for (const leading of leadingNoise) {
                if (input.startsWith(leading)) {
                    return input.substring(leading.length)
                }
            }
        }
    }
    return input.toString()
}

export class AnalyzeBookResponse {
    interpretations: Entry[] = []
    constructor(response: unknown) {
        if (Array.isArray(response)) {
            this.interpretations = AnalyzeBookResponse.parseArray(response)
        } else if (typeof response === 'object' && response != null) {
            if ('interpretations' in response && Array.isArray(response['interpretations'])) {
                this.interpretations = AnalyzeBookResponse.parseArray(response['interpretations'])
            } else if ('title' in response && 'mediaType' in response) {
                this.interpretations = [AnalyzeBookResponse.parse(response)].filter(notNull)
            } else {
                throw new Error('Unable to parse response:\n' + JSON.stringify(response, undefined, 2))
            }
        }
    }

    static parseArray(response: object[]) {
        return response.map(AnalyzeBookResponse.parse).filter(notNull) as Entry[]
    }

    static parse(response: object) {
        // response must contain required fields
        if (!('title' in response) || !('mediaType' in response)) {
            return null
        }

        const entry = new Entry(response['title'] as string, response['mediaType'] as string)
        entry.author = stripAINoise(ifDefined('author', response))
        entry.publishedBy = stripAINoise(ifDefined('publishedBy', response))
        entry.publishedLocation = stripAINoise(ifDefined('publishedLocation', response))
        entry.edition = stripAINoise(ifDefined('edition', response))
        entry.editionYear = stripAINoise(ifDefined('editionYear', response))
        entry.serialNumber = stripAINoise(ifDefined('serialNumber', response))
        entry.catalogNumber = stripAINoise(ifDefined('catalogNumber', response))

        const year = ifDefined('yearPublished', response)
        const month = ifDefined('monthPublished', response)
        if (year && month) {
            entry.publishedOn = stripAINoise(`${month} ${year}`)
        } else if (year) {
            entry.publishedOn = stripAINoise(year)
        } else if (month) {
            entry.publishedOn = stripAINoise(month)
        }
        return entry
    }
}
