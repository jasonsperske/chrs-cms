import { Entry } from "./Entry";
import { Section } from "./Section";

export class Library {
    sections: Section[]

    constructor(entries: Entry[], section?: string) {
        this.sections = []

        const sourceEntries = section === undefined
            ? entries
            : entries.filter((entry) => (entry.section || "") === section)

        let currentSection: Section | undefined = undefined
        for (const result of sourceEntries) {
            if (!currentSection) {
                currentSection = new Section(result.section)
            } else if (!currentSection.shouldInclude(result)) {
                this.sections.push(currentSection)
                currentSection = new Section(result.section)
            }
            currentSection.entries.push(result)
        }
        if (currentSection) {
            this.sections.push(currentSection)
        }
    }

    static async fromResponse(res: Response, section?: string): Promise<Library> {
        const data = await res.json()
        return new Library(data.results.map(Entry.fromJSON), section)
    }

    update(entry: Entry) {
        let isNew = true
        let oldSection: Section | undefined = undefined

        // First pass: find and update the entry in its current section
        for (const section of this.sections) {
            if (section.includes(entry.id)) {
                oldSection = section
                section.update(entry)
                isNew = false
            }
        }
        // If the entry's section has changed, move it to the new section
        if (!isNew && oldSection && oldSection.name !== (entry.section || "")) {
            // Remove from old section
            oldSection.remove(entry.id)
            
            // Find or create the new section
            let newSection = this.sections.find(s => s.name === (entry.section || ""))
            if (!newSection) {
                newSection = new Section(entry.section)
                this.sections.push(newSection)
            }
            
            // Add to new section
            newSection.entries.push(entry)
        }

        // Handle new entries
        if (isNew) {
            // Find or create the "New Entries" section
            let newEntriesSection = this.sections.find(s => s.name === "New Entries")
            if (!newEntriesSection) {
                newEntriesSection = new Section("New Entries")
                this.sections.unshift(newEntriesSection) // Add at the beginning
            }
            newEntriesSection.entries.unshift(entry) // Add at the beginning of entries
        }

        // Sort sections by name, but keep "New Entries" at the top
        this.sections.sort((a, b) => {
            if (a.name === "New Entries") return -1;
            if (b.name === "New Entries") return 1;
            return a.name.localeCompare(b.name);
        });
        
        return this
    }

    remove(entry: Entry) {
        for (let i = 0; i < this.sections.length; i++) {
            this.sections[i].remove(entry.id)
        }
        return this
    }
}