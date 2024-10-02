import { Entry } from "./Entry"

export class Section {
    name: string
    entries: Entry[]

    constructor(name: string | undefined, entries: Entry[] = []) {
        this.name = name || ""
        this.entries = entries
    }

    shouldInclude(entry: Entry) {
        return this.name === (entry.section || "")
    }

    includes(id: number | undefined) {
        return id ? this.entries.some(entry => entry.id === id) : false
    }

    update(update: Entry) {
        this.entries = this.entries.map(entry => entry.is(update) ? update : entry)
        return this
    }

    remove(id: number | undefined) {
        if (id) {
            this.entries = this.entries.filter(entry => entry.id !== id)
        }
        return this
    }
}