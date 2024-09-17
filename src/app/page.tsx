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
import { Entry } from "@/lib/types/library/Entry";
import { useEffect, useState } from "react";

export default function Home() {
  const [selected, setSelected] = useState<Entry | null>(null);
  const [data, setData] = useState<Entry[]>([]);
  useEffect(() => {
    fetch("/api/library")
      .then((res) => res.json())
      .then((data) => {
        setData(data.results);
      });
  }, []);
  function handleVariantSelection(variant: Entry): void {
    fetch("/api/library", {
      method: "POST",
      body: variant.asFormData(),
    })
      .then((res) => res.json())
      .then((newEntry) => {
        setData([variant.withId(newEntry.entry.id), ...data]);
      });
  }

  function handleEntryEdit(entry: Entry): void {
    fetch(`/api/library/${entry.id}`, {
      method: "PUT",
      body: entry.asFormData(),
    }).then(() => {
      setData(data.map((d) => (d.id === entry.id ? entry : d)));
      setSelected(null);
    });
  }

  function handleEntryDelete(entry: Entry): void {
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
