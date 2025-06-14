"use client";
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
import { useEffect, useState } from "react";

export default function Home() {
  const [selected, setSelected] = useState<Entry | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [data, setData] = useState<Library | undefined>(undefined);
  const [lastInsert, setLastInsert] = useState(Date.now())

  useEffect(() => {
    fetch("/api/library")
      .then(Library.fromResponse)
      .then((data) => {
        setData(data);
      });
  }, []);

  function handleVariantSelection(entry: Entry): void {
    fetch("/api/library", {
      method: "POST",
      body: entry.asFormData(),
    })
      .then(Entry.fromResponse)
      .then(entry => {
        setData(data?.update(entry))
        setLastInsert(Date.now())
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
      .then(updatedEntry => {
        setData(data?.update(updatedEntry));
        setSelected(null);
        setLastInsert(Date.now());
      });
  }

  function handleEntryDelete(entry: Entry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "DELETE",
    }).then(() => {
      setData(data?.remove(entry))
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
              <TableSubBody key={`section:${section.name}`} cols={6} sectionName={section.name ? section.name : <i>Unknown</i>}>
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
                      {d.serialNumber ? `isbn:${d.serialNumber}` : null}
                      {" "}
                      {d.catalogNumber ? `catalog:${d.catalogNumber}` : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableSubBody>))}
          </Table>
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
