"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
import { Entry } from "@/lib/types/library/Entry";
import { Library } from "@/lib/types/library/Library";

type SectionPageViewProps = {
  section: string;
};

export default function SectionPageView({ section }: SectionPageViewProps) {
  const activeSection = section;

  const [selected, setSelected] = useState<Entry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [data, setData] = useState<Library | undefined>(undefined);
  const [lastInsert, setLastInsert] = useState(Date.now());

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
                {section.entries.map((d) => (
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
                ))}
              </TableSubBody>
            ))}
          </Table>
        </div>
        <div className="row">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              <a href={`/api/export?section=${encodeURIComponent(activeSection)}`}>
                Download XLSX
              </a>
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
        {confirmDelete && selected ? (
          <ConfirmDeleteDialog
            entry={selected}
            onClose={() => setConfirmDelete(false)}
            onDelete={handleEntryDelete}
          />
        ) : null}
      </main>
    </div>
  );
}
