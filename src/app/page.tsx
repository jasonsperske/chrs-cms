"use client";
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
import {
  asFormData as LibraryEntryAsFormData,
  asLibraryEntry,
  LibraryEntry,
} from "@/lib/types/LibraryEntry";
import {
  asFormData as BookVariationAsFormData,
  BookVariation,
} from "@/lib/types/openai/BookVariation";
import { useEffect, useState } from "react";

export default function Home() {
  const [selected, setSelected] = useState<LibraryEntry | null>(null);
  const [data, setData] = useState<LibraryEntry[]>([]);
  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        setData(data.results);
      });
  }, []);
  function handleVariantSelection(variant: BookVariation): void {
    fetch("/api/library", {
      method: "POST",
      body: BookVariationAsFormData(variant),
    })
      .then((res) => res.json())
      .then((newEntry) => {
        setData([asLibraryEntry(newEntry.entry.id, variant), ...data]);
      });
  }

  function handleEntryEdit(entry: LibraryEntry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "PUT",
      body: LibraryEntryAsFormData(entry),
    }).then(() => {
      setData(data.map((d) => (d.id === entry.id ? entry : d)));
      setSelected(null);
    });
  }

  function handleEntryDelete(entry: LibraryEntry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "DELETE",
    }).then(() => {
      setData(data.filter((d) => d.id !== entry.id));
      setSelected(null);
    });
  }

  return (
    <div className="p-8 pb-20 font-[family-name:var(--font-geist-sans)]">
      <main>
        <div className="row">
          <MultipleImageInput onSelectVariant={handleVariantSelection} />
        </div>
        <div className="row">
          <Table>
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
            <TableBody>
              {data.map((d) => (
                <TableRow key={d.id} onClick={() => setSelected(d)}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.author}</TableCell>
                  <TableCell>{d.mediaType}</TableCell>
                  <TableCell>
                    {d.publishedBy} {d.publishedLocation} {d.publishedOn}
                  </TableCell>
                  <TableCell>
                    {d.edition} {d.editionYear ? `(${d.editionYear})` : ""}
                  </TableCell>
                  <TableCell>
                    {d.serialNumber ? `isbn:${d.serialNumber}` : ""}{" "}
                    {d.catalogNumber ? `catalog:${d.catalogNumber}` : ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {selected ? (
          <EditLibraryEntry
            entry={selected}
            onEdit={handleEntryEdit}
            onDelete={handleEntryDelete}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </main>
    </div>
  );
}
