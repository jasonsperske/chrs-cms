import { sortByValue } from "./Columns"
import type { EntryField, ImportedRecord, SerializedEntry } from "./Entry"

/** Anything with Entry's shape: a stored entry or an imported row. */
export type EntryLike = Partial<SerializedEntry>

/** Fields the database will not accept as empty, so an empty cell cannot clear them. */
export const REQUIRED_FIELDS: EntryField[] = ["title", "mediaType"]

/**
 * The value an import would actually store for a field. Blank cells clear a
 * field, except for the required ones, which keep what the entry already has.
 */
export function effectiveValue(
    original: EntryLike,
    imported: ImportedRecord,
    field: EntryField
): string {
    const raw = String(imported[field] ?? "").trim()
    if (!raw && REQUIRED_FIELDS.includes(field)) {
        return String(original[field] ?? "").trim()
    }
    return raw
}

/** The stored value a field is compared against when diffing an import. */
export function storedValue(original: EntryLike, field: EntryField): string {
    // The export writes sortBy as `sortBy || author || title`, so normalise the
    // original the same way before comparing to avoid false positives.
    return field === "sortBy"
        ? sortByValue(original).trim()
        : String(original[field] ?? "").trim()
}

/**
 * Which of the fields present in the sheet differ from the stored entry. Fields
 * the sheet left out are never compared — a column a section hides is simply not
 * part of the import, and keeps whatever the entry already holds.
 */
export function getChangedFields(
    original: EntryLike,
    imported: ImportedRecord,
    fields: EntryField[]
): Set<EntryField> {
    const changed = new Set<EntryField>()
    for (const field of fields) {
        if (storedValue(original, field) !== effectiveValue(original, imported, field)) {
            changed.add(field)
        }
    }
    return changed
}

/** The entry as it will look once the import is saved. */
export function mergedEntry(
    original: EntryLike,
    imported: ImportedRecord,
    fields: EntryField[]
): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...original }
    for (const field of fields) {
        merged[field] = effectiveValue(original, imported, field)
    }
    return merged
}
