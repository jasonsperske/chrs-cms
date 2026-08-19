import { apiExec, apiGet } from "./database"
import {
    ColumnConfig,
    normalizeColumnConfig,
    sortEntries,
} from "@/lib/types/library/Columns"
import type { EntryLike } from "@/lib/types/library/Import"

/**
 * Per section column layout. The section name is the key, with "" standing for
 * entries that have no section. A section with no row here uses the defaults.
 */
const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS section_columns (
    section TEXT PRIMARY KEY,
    columns TEXT NOT NULL,
    updatedAt TEXT
  );
`

let ensured: Promise<void> | undefined

/**
 * migrations.ts creates this table too, but it is run by hand (`npm run build:db`),
 * so create it on first use as well to keep an un-migrated database working.
 */
function ensureTable(): Promise<void> {
    if (!ensured) {
        ensured = apiExec(CREATE_TABLE)
            .then(() => undefined)
            .catch((err) => {
                // Let the next call retry rather than caching the failure.
                ensured = undefined
                throw err
            })
    }
    return ensured
}

/** Normalise a section name into the key used by the table. */
export function sectionKey(section: string | null | undefined): string {
    return (section ?? "").trim()
}

export async function getColumnConfig(
    section: string | null | undefined
): Promise<ColumnConfig | null> {
    await ensureTable()
    const rows = await apiGet<{ columns: string }>(
        "SELECT columns FROM section_columns WHERE section = ?",
        [sectionKey(section)]
    )
    if (!rows.length) return null

    try {
        return normalizeColumnConfig(JSON.parse(rows[0].columns))
    } catch {
        return null
    }
}

/** Every saved config, keyed by section — used by the all sections export. */
export async function getAllColumnConfigs(): Promise<Map<string, ColumnConfig>> {
    await ensureTable()
    const rows = await apiGet<{ section: string; columns: string }>(
        "SELECT section, columns FROM section_columns"
    )

    const configs = new Map<string, ColumnConfig>()
    for (const row of rows) {
        try {
            const config = normalizeColumnConfig(JSON.parse(row.columns))
            if (config) configs.set(row.section, config)
        } catch {
            // A corrupt row just falls back to the defaults.
        }
    }
    return configs
}

export async function saveColumnConfig(
    section: string | null | undefined,
    config: ColumnConfig
): Promise<void> {
    await ensureTable()
    await apiExec(
        `INSERT INTO section_columns(section, columns, updatedAt) VALUES (?, ?, ?)
         ON CONFLICT(section) DO UPDATE SET columns = excluded.columns, updatedAt = excluded.updatedAt`,
        [sectionKey(section), JSON.stringify(config), new Date().toISOString()]
    )
}

/** Drop a section's customization so it falls back to the default layout. */
export async function deleteColumnConfig(
    section: string | null | undefined
): Promise<number> {
    await ensureTable()
    return await apiExec("DELETE FROM section_columns WHERE section = ?", [
        sectionKey(section),
    ])
}

/**
 * Order rows within each section by that section's sort criteria, leaving the
 * sections themselves in the order they arrive (the query's ORDER BY). Rows must
 * already be grouped by section, which the library queries guarantee.
 */
export function sortBySection<T extends EntryLike>(
    rows: T[],
    configs: Map<string, ColumnConfig>
): T[] {
    const sections = new Map<string, T[]>()
    for (const row of rows) {
        const key = sectionKey(row.section)
        const group = sections.get(key)
        if (group) {
            group.push(row)
        } else {
            sections.set(key, [row])
        }
    }

    return [...sections].flatMap(([key, group]) =>
        sortEntries(group, configs.get(key) ?? null)
    )
}
