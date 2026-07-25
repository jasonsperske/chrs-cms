"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ColumnSettingsDialog from "@/components/ColumnSettingsDialog";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import EditLibraryEntry from "@/components/EditLibraryEntry";
import MultipleImageInput from "@/components/MultipleImageInput";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSubBody } from "@/components/ui/TableSubBody";
import Toast from "@/components/ui/Toast";
import {
  ColumnConfig,
  normalizeColumnConfig,
  visibleColumns,
} from "@/lib/types/library/Columns";
import {
  Entry,
  EntryField,
  ImportedRecord,
  SpreadsheetWorksheetPayload,
} from "@/lib/types/library/Entry";
import {
  EntryLike,
  effectiveValue,
  getChangedFields,
  mergedEntry,
  storedValue,
} from "@/lib/types/library/Import";
import { Library } from "@/lib/types/library/Library";

type SectionPageViewProps = {
  section: string;
};

/** A column as the table renders it — the composite defaults have no single field. */
type TableColumn = {
  key: string;
  header: string;
  render: (entry: EntryLike, changed: Set<EntryField>) => React.ReactNode;
};

function maybeBold(
  value: unknown,
  field: EntryField | undefined,
  changed: Set<EntryField>
): React.ReactNode {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value);
  return field && changed.has(field) ? <strong>{str}</strong> : str;
}

/**
 * The layout a section falls back to when its columns have not been customized:
 * the grouped view this table has always shown.
 */
const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  {
    key: "title",
    header: "Title",
    render: (e, changed) => maybeBold(e.title, "title", changed),
  },
  {
    key: "author",
    header: "Author",
    render: (e, changed) => maybeBold(e.author, "author", changed),
  },
  {
    key: "mediaType",
    header: "Type",
    render: (e, changed) => maybeBold(e.mediaType, "mediaType", changed),
  },
  {
    key: "published",
    header: "Published",
    render: (e, changed) => (
      <>
        {maybeBold(e.publishedBy, "publishedBy", changed)}{" "}
        {maybeBold(e.publishedLocation, "publishedLocation", changed)}{" "}
        {maybeBold(e.publishedOn, "publishedOn", changed)}
      </>
    ),
  },
  {
    key: "edition",
    header: "Edition",
    render: (e, changed) => (
      <>
        {maybeBold(e.edition, "edition", changed)}{" "}
        {e.editionYear
          ? maybeBold(`(${e.editionYear})`, "editionYear", changed)
          : null}
      </>
    ),
  },
  {
    key: "serialNumbers",
    header: "Serial Numbers",
    render: (e, changed) => (
      <>
        {e.serialNumber
          ? maybeBold(`isbn:${e.serialNumber}`, "serialNumber", changed)
          : null}{" "}
        {e.catalogNumber
          ? maybeBold(`catalog:${e.catalogNumber}`, "catalogNumber", changed)
          : null}
      </>
    ),
  },
];

/** One table column per configured column, in the configured order. */
function configuredTableColumns(config: ColumnConfig): TableColumn[] {
  return visibleColumns(config).map((def) => ({
    key: def.key,
    header: def.label,
    render: (entry: EntryLike, changed: Set<EntryField>) =>
      maybeBold(def.value(entry), def.field, changed),
  }));
}

export default function SectionPageView({ section }: SectionPageViewProps) {
  const activeSection = section;

  const [selected, setSelected] = useState<Entry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [data, setData] = useState<Library | undefined>(undefined);
  const [lastInsert, setLastInsert] = useState(Date.now());

  // Column layout state (null = follow the defaults)
  const [columnConfig, setColumnConfig] = useState<ColumnConfig | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);

  // Import state
  const [importRecords, setImportRecords] = useState<ImportedRecord[] | null>(
    null
  );
  const [importFields, setImportFields] = useState<EntryField[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tableColumns = useMemo(
    () => (columnConfig ? configuredTableColumns(columnConfig) : DEFAULT_TABLE_COLUMNS),
    [columnConfig]
  );

  const { importMap, newImportEntries } = useMemo(() => {
    if (!importRecords) return { importMap: null, newImportEntries: [] };
    const map = new Map<number, ImportedRecord>();
    const newEntries: ImportedRecord[] = [];
    for (const rec of importRecords) {
      if (rec.id != null) {
        map.set(rec.id, rec);
      } else {
        newEntries.push(rec);
      }
    }
    return { importMap: map, newImportEntries: newEntries };
  }, [importRecords]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development" || !importMap || !data) return;

    for (const section of data.sections) {
      for (const entry of section.entries) {
        if (!entry.id) continue;
        const imported = importMap.get(entry.id);
        if (!imported) continue;
        const changed = getChangedFields(entry, imported, importFields);
        if (changed.size === 0) continue;

        const diff = Object.fromEntries(
          [...changed].map((f) => [
            f,
            { from: storedValue(entry, f), to: effectiveValue(entry, imported, f) },
          ])
        );
        console.log(`[import diff] id=${entry.id} "${entry.title}"`, diff);
      }
    }
    // importMap is the meaningful trigger; data is stable when a new import loads
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importMap]);

  useEffect(() => {
    if (!activeSection) {
      setData(undefined);
      return;
    }

    fetch(`/api/library?section=${encodeURIComponent(activeSection)}`)
      .then((res) => Library.fromResponse(res, activeSection))
      .then((library) => {
        setData(library);
      });
  }, [activeSection]);

  const refreshColumns = useCallback(() => {
    fetch(`/api/library/columns?section=${encodeURIComponent(activeSection)}`)
      .then((res) => res.json())
      .then((payload) => setColumnConfig(normalizeColumnConfig(payload?.columns)))
      .catch(() => setColumnConfig(null));
  }, [activeSection]);

  useEffect(() => {
    refreshColumns();
  }, [refreshColumns]);

  function handleVariantSelection(entry: Entry, uploadToken: string | null): void {
    const payload = new Entry(entry.title, entry.mediaType, {
      ...entry,
      section: entry.section ?? activeSection,
    });
    const formData = payload.asFormData();
    if (uploadToken) {
      formData.append("uploadToken", uploadToken);
    }

    fetch("/api/library", {
      method: "POST",
      body: formData,
    })
      .then(Entry.fromResponse)
      .then((savedEntry) => {
        setData((prev) => prev?.update(savedEntry));
        setLastInsert(Date.now());
      });
  }

  function handleAddManually(variant?: Entry): void {
    setSelected(
      variant || new Entry("New Entry", "book", { section: activeSection })
    );
  }

  function handleEntryEdit(entry: Entry): void {
    const url = entry.id ? `/api/library/${entry.id}` : "/api/library";
    const method = entry.id ? "PUT" : "POST";

    fetch(url, {
      method,
      body: entry.asFormData(),
    })
      .then(Entry.fromResponse)
      .then((updatedEntry) => {
        setData((prev) => prev?.update(updatedEntry));
        setSelected(null);
        setLastInsert(Date.now());
      });
  }

  function handleEntryDelete(entry: Entry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "DELETE",
    }).then(() => {
      setData((prev) => prev?.remove(entry));
      setSelected(null);
      setConfirmDelete(false);
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    const formData = new FormData();
    formData.append("file", file);

    setIsImporting(true);
    try {
      const res = await fetch("/api/library/import-xlsx", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as
        | SpreadsheetWorksheetPayload
        | { processingError: string };

      if ("processingError" in json) {
        setImportError(json.processingError);
        return;
      }

      setImportFields(json.fields ?? []);
      setImportRecords(json.records.map((r) => ({ ...r, section: activeSection })));
      setImportError(null);
    } catch {
      setImportError("Failed to process the XLSX file. Please try again.");
    } finally {
      setIsImporting(false);
    }
  }

  function handleCancelImport() {
    setImportRecords(null);
    setImportFields([]);
    setImportError(null);
    setProcessingKeys(new Set());
  }

  async function handleSaveImport() {
    if (!importRecords || !data || !importMap) return;
    setIsSaving(true);

    const allEntries = [...data.sections.flatMap((s) => s.entries)];
    const importMapSnapshot = new Map(importMap);
    const newEntriesSnapshot = [...newImportEntries];

    // Process deletions: entries in the table but absent from the import
    for (const entry of allEntries) {
      if (!entry.id || importMapSnapshot.has(entry.id)) continue;
      setProcessingKeys((prev) => new Set([...prev, String(entry.id)]));
      await fetch(`/api/library/${entry.id}`, { method: "DELETE" });
      setData((prev) => prev?.remove(entry) ?? prev);
      setProcessingKeys((prev) => {
        const n = new Set(prev);
        n.delete(String(entry.id));
        return n;
      });
    }

    // Process modifications
    for (const entry of allEntries) {
      if (!entry.id) continue;
      const imported = importMapSnapshot.get(entry.id);
      if (!imported) continue;
      const changed = getChangedFields(entry, imported, importFields);
      if (changed.size === 0) continue;

      setProcessingKeys((prev) => new Set([...prev, String(entry.id)]));
      // Only the fields the sheet carried are taken from the import; the rest of
      // the entry is preserved, so hidden columns survive a round trip.
      const merged = mergedEntry(entry, imported, importFields);
      const updatedEntry = new Entry(
        String(merged.title ?? entry.title),
        String(merged.mediaType ?? entry.mediaType),
        { ...merged, section: activeSection }
      );
      const res = await fetch(`/api/library/${entry.id}`, {
        method: "PUT",
        body: updatedEntry.asFormData(),
      });
      const saved = await Entry.fromResponse(res);
      setData((prev) => prev?.update(saved) ?? prev);
      setProcessingKeys((prev) => {
        const n = new Set(prev);
        n.delete(String(entry.id));
        return n;
      });
    }

    // Process insertions
    for (let i = 0; i < newEntriesSnapshot.length; i++) {
      const imported = newEntriesSnapshot[i];
      const tempKey = `new-${i}`;
      setProcessingKeys((prev) => new Set([...prev, tempKey]));
      const newEntry = new Entry(
        String(imported.title ?? ""),
        String(imported.mediaType ?? "book"),
        {
          ...imported,
          section: activeSection,
        }
      );
      const res = await fetch("/api/library", {
        method: "POST",
        body: newEntry.asFormData(),
      });
      const saved = await Entry.fromResponse(res);
      setData((prev) => prev?.update(saved) ?? prev);
      // Remove this specific entry from importRecords by object identity
      setImportRecords((prev) => {
        if (!prev) return null;
        return prev.filter((r) => r !== imported);
      });
      setProcessingKeys((prev) => {
        const n = new Set(prev);
        n.delete(tempKey);
        return n;
      });
    }

    setIsSaving(false);
    setImportRecords(null);
    setImportFields([]);
    setProcessingKeys(new Set());
    setLastInsert(Date.now());
  }

  function renderCells(entry: EntryLike, changed: Set<EntryField>) {
    return tableColumns.map((column) => (
      <TableCell key={column.key}>{column.render(entry, changed)}</TableCell>
    ));
  }

  function renderEntryRow(d: Entry) {
    if (!importMap) {
      return (
        <TableRow
          key={`${d.id || d.title}`}
          data-id={d.id}
          onClick={() => setSelected(d)}
        >
          {renderCells(d, new Set<EntryField>())}
        </TableRow>
      );
    }

    const imported = d.id != null ? importMap.get(d.id) : undefined;
    const isDeleted = !imported;
    const changed = imported
      ? getChangedFields(d, imported, importFields)
      : new Set<EntryField>();
    const isModified = changed.size > 0;
    const isProcessing = d.id != null && processingKeys.has(String(d.id));

    // Show the entry as it will look after saving: imported values for the
    // fields the sheet carried, current values for everything else.
    const display: EntryLike = imported
      ? (mergedEntry(d, imported, importFields) as EntryLike)
      : d;

    let rowClass = "";
    if (isProcessing) rowClass = "opacity-60";
    else if (isDeleted) rowClass = "bg-red-100 dark:bg-red-950";
    else if (isModified) rowClass = "bg-gray-100 dark:bg-gray-800";

    return (
      <TableRow
        key={`${d.id || d.title}`}
        data-id={d.id}
        className={rowClass}
        style={isDeleted ? { textDecoration: "line-through" } : undefined}
      >
        {renderCells(display, changed)}
      </TableRow>
    );
  }

  return (
    <div className="p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <main>
        <div className="row mb-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Back to all sections"
              className="text-2xl font-semibold text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
              ←
            </Link>
            <h1 className="text-2xl font-semibold">Section: {activeSection}</h1>
          </div>
        </div>
        <div className="row">
          <MultipleImageInput
            onSelectVariant={handleVariantSelection}
            onAddManually={handleAddManually}
            defaultSection={activeSection}
          />
        </div>
        <div className="row">
          <Table className="sm:overflow-x-scroll" key={lastInsert}>
            <TableHeader>
              <TableRow>
                {tableColumns.map((column) => (
                  <TableHead key={column.key}>{column.header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            {data?.sections.map((section) => (
              <TableSubBody
                key={`section:${section.name}`}
                cols={tableColumns.length}
                sectionName={section.name ? section.name : <i>Unknown</i>}
              >
                {section.entries.map((d) => renderEntryRow(d))}
              </TableSubBody>
            ))}
            {importMap && newImportEntries.length > 0 && (
              <TableSubBody cols={tableColumns.length} sectionName="New Entries">
                {newImportEntries.map((imported, i) => {
                  const tempKey = `new-${i}`;
                  const isProcessing = processingKeys.has(tempKey);
                  return (
                    <TableRow
                      key={tempKey}
                      className={isProcessing ? "opacity-60" : "bg-green-100 dark:bg-green-950"}
                    >
                      {renderCells(imported, new Set<EntryField>())}
                    </TableRow>
                  );
                })}
              </TableSubBody>
            )}
          </Table>
        </div>
        <div className="row">
          <div className="text-center">
            {importError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-2">{importError}</p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              <a
                href={`/api/export?section=${encodeURIComponent(activeSection)}`}
              >
                Download XLSX
              </a>
              {activeSection && (
                <>
                  {" · "}
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }}
                  >
                    Import XLSX
                  </a>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </>
              )}
              {" · "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setShowColumnSettings(true);
                }}
              >
                Columns{columnConfig ? " (customized)" : ""}
              </a>
            </p>
            {importMap && (
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={handleSaveImport}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancelImport}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
            <div className="mt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
        {showColumnSettings ? (
          <ColumnSettingsDialog
            section={activeSection}
            config={columnConfig}
            onClose={() => setShowColumnSettings(false)}
            onSaved={(config) => {
              setColumnConfig(config);
              setShowColumnSettings(false);
            }}
          />
        ) : null}
        {!importMap && selected ? (
          <EditLibraryEntry
            entry={selected}
            onEdit={handleEntryEdit}
            onDelete={() => setConfirmDelete(true)}
            onClose={() => setSelected(null)}
          />
        ) : null}
        {!importMap && confirmDelete && selected ? (
          <ConfirmDeleteDialog
            entry={selected}
            onClose={() => setConfirmDelete(false)}
            onDelete={handleEntryDelete}
          />
        ) : null}
      </main>
      <Toast message="Importing XLSX…" visible={isImporting} />
    </div>
  );
}
