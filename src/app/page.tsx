'use client'
import MultipleImageInput from "@/components/MultipleImageInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asLibraryEntry, LibraryEntry } from "@/lib/types/LibraryEntry";
import { asFormData, BookVariation } from "@/lib/types/openai/BookVariation";
import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<LibraryEntry[]>([])
  useEffect(() => {
    fetch('/api/library')
      .then(res => res.json())
      .then((data) => {
        setData(data.results)
      })
  }, [])
  function handleVariantSelection(variant: BookVariation): void {
    fetch('/api/library', {
      method: 'POST',
      body: asFormData(variant)
    }).then(res => res.json())
      .then((newEntry) => {
        setData([asLibraryEntry(newEntry.entry.id, variant), ...data])
      })
  }

  return (
    <div className="p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
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
                <TableHead key="publisher">Publisher</TableHead>
                <TableHead key="published">Published</TableHead>
                <TableHead key="serialNumbers">Serial Numbers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) =>
                <TableRow key={d.id}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.author}</TableCell>
                  <TableCell>{d.mediaType}</TableCell>
                  <TableCell>{d.publishedBy}</TableCell>
                  <TableCell>{d.publishedOn}</TableCell>
                  <TableCell>{d.serialNumber ? `isbn:${d.serialNumber}` : null} {d.catalogNumber ? `catalog:${d.catalogNumber}` : null}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
