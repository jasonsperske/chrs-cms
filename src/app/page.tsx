"use client";

import Link from "next/link";
import ConfirmDeleteDialog from "@/components/ConfirmDeleteDialog";
import EditLibraryEntry from "@/components/EditLibraryEntry";
import MultipleImageInput from "@/components/MultipleImageInput";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Entry } from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";
import { useCallback, useEffect, useState } from "react";

export default function Home() {
  const [selected, setSelected] = useState<Entry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [sections, setSections] = useState<string[]>([]);
  const [unknownEntries, setUnknownEntries] = useState<Entry[]>([]);

  const refreshSections = useCallback(() => {
    fetch("/api/library/sections")
      .then((res) => res.json())
      .then((payload) => {
        if (payload?.success && Array.isArray(payload.sections)) {
          setSections(payload.sections);
        } else {
          setSections([]);
        }
      })
      .catch(() => setSections([]));
  }, []);

  const refreshUnknownEntries = useCallback(() => {
    fetch("/api/library?section=")
      .then((res) => Library.fromResponse(res, ""))
      .then((library) => {
        const entries = library.sections.flatMap((section) => section.entries);
        setUnknownEntries(entries);
      })
      .catch(() => setUnknownEntries([]));
  }, []);

  useEffect(() => {
    refreshSections();
    refreshUnknownEntries();
  }, [refreshSections, refreshUnknownEntries]);

  function handleVariantSelection(entry: Entry): void {
    fetch("/api/library", {
      method: "POST",
      body: entry.asFormData(),
    })
      .then(Entry.fromResponse)
      .then(() => {
        refreshSections();
        refreshUnknownEntries();
      });
  }

  function handleAddManually(variant?: Entry): void {
    setSelected(variant || new Entry("New Entry", "book"));
  }

  function handleEntryEdit(entry: Entry): void {
    const url = entry.id ? `/api/library/${entry.id}` : "/api/library";
    const method = entry.id ? "PUT" : "POST";

    fetch(url, {
      method,
      body: entry.asFormData(),
    })
      .then(Entry.fromResponse)
      .then(() => {
        refreshSections();
        refreshUnknownEntries();
        setSelected(null);
      });
  }

  function handleEntryDelete(entry: Entry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "DELETE",
    }).then(() => {
      refreshSections();
      refreshUnknownEntries();
      setSelected(null);
      setConfirmDelete(false)
    });
  }

  return (
    <div className="p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <main>
        <div className="row">
          <MultipleImageInput
            onSelectVariant={handleVariantSelection}
            onAddManually={handleAddManually}
          />
        </div>
        <div className="row">
          <div className="flex w-full flex-col gap-3">
            <h2 className="text-xl font-semibold">Sections</h2>
            {sections.length ? (
              sections.map((section) => {
                const name = section ?? "";
                const isUnknown = name.trim().length === 0;
                const displayName = isUnknown ? "<unknown>" : name;

                if (isUnknown) {
                  return (
                    <div
                      key="section:__unknown__"
                      className="rounded border border-neutral-300 px-4 py-3 text-neutral-800"
                    >
                      <div className="text-lg font-medium text-neutral-500">
                        {displayName}
                      </div>
                      {unknownEntries.length ? (
                        <Table className="mt-3 text-sm">
                          <TableHeader>
                            <TableRow>
                              <TableHead>Title</TableHead>
                              <TableHead>Author</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Published</TableHead>
                              <TableHead>Edition</TableHead>
                              <TableHead>Serial Numbers</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {unknownEntries.map((entry) => (
                              <TableRow
                                key={`${entry.id ?? entry.title}-unknown`}
                                data-id={entry.id}
                                onClick={() => setSelected(entry)}
                                className="cursor-pointer"
                              >
                                <TableCell>{entry.title}</TableCell>
                                <TableCell>{entry.author}</TableCell>
                                <TableCell>{entry.mediaType}</TableCell>
                                <TableCell>
                                  {entry.publishedBy} {entry.publishedLocation} {entry.publishedOn}
                                </TableCell>
                                <TableCell>
                                  {entry.edition} {entry.editionYear ? `(${entry.editionYear})` : null}
                                </TableCell>
                                <TableCell>
                                  {entry.serialNumber ? `isbn:${entry.serialNumber}` : null}{" "}
                                  {entry.catalogNumber ? `catalog:${entry.catalogNumber}` : null}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="mt-2 text-sm text-neutral-500">
                          No entries without a section.
                        </p>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={name}
                    href={`/section/${encodeURIComponent(name)}`}
                    className="rounded border border-neutral-300 px-4 py-3 text-lg font-medium text-neutral-800 hover:border-neutral-500 hover:bg-neutral-100"
                  >
                    {displayName}
                  </Link>
                );
              })
            ) : (
              <p className="text-sm text-neutral-500">No sections yet.</p>
            )}
          </div>
        </div>
        <div className="row">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              <a href="/api/export">Download XLSX</a>
            </p>
          </div>
        </div>
        {selected ? (
          <EditLibraryEntry
            entry={selected}
            onEdit={handleEntryEdit}
            onDelete={() => setConfirmDelete(true)}
            onClose={() => setSelected(null)}
          />
        ) : null}
        {(confirmDelete && selected) ? (
          <ConfirmDeleteDialog entry={selected} onClose={() => setConfirmDelete(false)} onDelete={handleEntryDelete} />
        ) : null}
      </main>
    </div>
  );
}
