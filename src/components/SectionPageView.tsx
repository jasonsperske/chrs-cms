"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import EditLibraryEntry from "@/components/EditLibraryEntry";
import MultipleImageInput from "@/components/MultipleImageInput";
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
  Entry,
  SerializedEntry,
  SpreadsheetWorksheetPayload,
} from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";

type SectionPageViewProps = {
  section: string;
};

const ENTRY_FIELDS = [
  "title",
  "author",
  "mediaType",
  "sortBy",
  "publishedBy",
  "publishedOn",
  "publishedLocation",
  "edition",
  "editionYear",
  "serialNumber",
  "catalogNumber",
  "section",
] as const;

type EntryField = (typeof ENTRY_FIELDS)[number];

function getChangedFields(
  original: Entry,
  imported: SerializedEntry
): Set<EntryField> {
  const changed = new Set<EntryField>();
  for (const f of ENTRY_FIELDS) {
    // The export writes sortBy as `sortBy || author || title`, so normalise
    // the original the same way before comparing to avoid false positives.
    const origVal =
      f === "sortBy"
        ? String(original.sortBy || original.author || original.title || "").trim()
        : String(original[f] ?? "").trim();
    const impVal = String(imported[f] ?? "").trim();
    if (origVal !== impVal) changed.add(f);
  }
  return changed;
}

function maybeBold(
  value: unknown,
  field: EntryField,
  changed: Set<EntryField>
): React.ReactNode {
  if (value === undefined || value === null || value === "") return null;
  const str = String(value);
  return changed.has(field) ? <strong>{str}</strong> : str;
}

export default function SectionPageView({ section }: SectionPageViewProps) {
  const activeSection = section;

  const [selected, setSelected] = useState<Entry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [data, setData] = useState<Library | undefined>(undefined);
  const [lastInsert, setLastInsert] = useState(Date.now());

  // Import state
  const [importRecords, setImportRecords] = useState<SerializedEntry[] | null>(
    null
  );
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingKeys, setProcessingKeys] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { importMap, newImportEntries } = useMemo(() => {
    if (!importRecords) return { importMap: null, newImportEntries: [] };
    const map = new Map<number, SerializedEntry>();
    const newEntries: SerializedEntry[] = [];
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
        const changed = getChangedFields(entry, imported);
        if (changed.size === 0) continue;

        const diff = Object.fromEntries(
          [...changed].map((f) => {
            const from =
              f === "sortBy"
                ? String(entry.sortBy || entry.author || entry.title || "").trim()
                : String(entry[f] ?? "").trim();
            return [f, { from, to: String(imported[f] ?? "").trim() }];
          })
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

  function handleVariantSelection(entry: Entry): void {
    const payload = new Entry(entry.title, entry.mediaType, {
      ...entry,
      section: entry.section ?? activeSection,
    });

    fetch("/api/library", {
      method: "POST",
      body: payload.asFormData(),
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
      const changed = getChangedFields(entry, imported);
      if (changed.size === 0) continue;

      setProcessingKeys((prev) => new Set([...prev, String(entry.id)]));
      const updatedEntry = new Entry(imported.title, imported.mediaType, {
        ...imported,
        section: activeSection,
      });
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
      const newEntry = new Entry(imported.title, imported.mediaType, {
        ...imported,
        section: activeSection,
      });
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
    setProcessingKeys(new Set());
    setLastInsert(Date.now());
  }

  function renderEntryRow(d: Entry) {
    if (!importMap) {
      return (
        <TableRow
          key={`${d.id || d.title}`}
          data-id={d.id}
          onClick={() => setSelected(d)}
        >
          <TableCell>{d.title}</TableCell>
          <TableCell>{d.author}</TableCell>
          <TableCell>{d.mediaType}</TableCell>
          <TableCell>
            {d.publishedBy} {d.publishedLocation} {d.publishedOn}
          </TableCell>
          <TableCell>
            {d.edition} {d.editionYear ? `(${d.editionYear})` : null}
          </TableCell>
          <TableCell>
            {d.serialNumber ? `isbn:${d.serialNumber}` : null}{" "}
            {d.catalogNumber ? `catalog:${d.catalogNumber}` : null}
          </TableCell>
        </TableRow>
      );
    }

    const imported = d.id != null ? importMap.get(d.id) : undefined;
    const isDeleted = !imported;
    const changed = imported
      ? getChangedFields(d, imported)
      : new Set<EntryField>();
    const isModified = changed.size > 0;
    const isProcessing = d.id != null && processingKeys.has(String(d.id));

    // Show imported (new) values for modified rows; original for deleted/unchanged
    const display: Entry | SerializedEntry = imported ?? d;

    let rowClass = "";
    if (isProcessing) rowClass = "opacity-60";
    else if (isDeleted) rowClass = "bg-red-100";
    else if (isModified) rowClass = "bg-gray-100";

    return (
      <TableRow
        key={`${d.id || d.title}`}
        data-id={d.id}
        className={rowClass}
        style={isDeleted ? { textDecoration: "line-through" } : undefined}
      >
        <TableCell>{maybeBold(display.title, "title", changed)}</TableCell>
        <TableCell>{maybeBold(display.author, "author", changed)}</TableCell>
        <TableCell>
          {maybeBold(display.mediaType, "mediaType", changed)}
        </TableCell>
        <TableCell>
          {maybeBold(display.publishedBy, "publishedBy", changed)}{" "}
          {maybeBold(
            display.publishedLocation,
            "publishedLocation",
            changed
          )}{" "}
          {maybeBold(display.publishedOn, "publishedOn", changed)}
        </TableCell>
        <TableCell>
          {maybeBold(display.edition, "edition", changed)}{" "}
          {display.editionYear
            ? maybeBold(`(${display.editionYear})`, "editionYear", changed)
            : null}
        </TableCell>
        <TableCell>
          {display.serialNumber
            ? maybeBold(`isbn:${display.serialNumber}`, "serialNumber", changed)
            : null}{" "}
          {display.catalogNumber
            ? maybeBold(
                `catalog:${display.catalogNumber}`,
                "catalogNumber",
                changed
              )
            : null}
        </TableCell>
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
              className="text-2xl font-semibold text-neutral-600 hover:text-neutral-900"
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
                <TableHead key="title">Title</TableHead>
                <TableHead key="author">Author</TableHead>
                <TableHead key="mediaType">Type</TableHead>
                <TableHead key="published">Published</TableHead>
                <TableHead key="edition">Edition</TableHead>
                <TableHead key="serialNumbers">Serial Numbers</TableHead>
              </TableRow>
            </TableHeader>
            {data?.sections.map((section) => (
              <TableSubBody
                key={`section:${section.name}`}
                cols={6}
                sectionName={section.name ? section.name : <i>Unknown</i>}
              >
                {section.entries.map((d) => renderEntryRow(d))}
              </TableSubBody>
            ))}
            {importMap && newImportEntries.length > 0 && (
              <TableSubBody cols={6} sectionName="New Entries">
                {newImportEntries.map((imported, i) => {
                  const tempKey = `new-${i}`;
                  const isProcessing = processingKeys.has(tempKey);
                  return (
                    <TableRow
                      key={tempKey}
                      className={isProcessing ? "opacity-60" : "bg-green-100"}
                    >
                      <TableCell>{imported.title}</TableCell>
                      <TableCell>{imported.author}</TableCell>
                      <TableCell>{imported.mediaType}</TableCell>
                      <TableCell>
                        {imported.publishedBy} {imported.publishedLocation}{" "}
                        {imported.publishedOn}
                      </TableCell>
                      <TableCell>
                        {imported.edition}{" "}
                        {imported.editionYear
                          ? `(${imported.editionYear})`
                          : null}
                      </TableCell>
                      <TableCell>
                        {imported.serialNumber
                          ? `isbn:${imported.serialNumber}`
                          : null}{" "}
                        {imported.catalogNumber
                          ? `catalog:${imported.catalogNumber}`
                          : null}
                      </TableCell>
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
              <p className="text-sm text-red-600 mb-2">{importError}</p>
            )}
            <p className="text-sm text-gray-500">
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
                  className="px-4 py-2 bg-gray-200 text-gray-800 text-sm rounded hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
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
