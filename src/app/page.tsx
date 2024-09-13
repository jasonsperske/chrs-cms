'use client'
import MultipleImageInput from "@/components/MultipleImageInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { asLibraryEntry, LibraryEntry } from "@/lib/types/LibraryEntry";
import { BookVariation } from "@/lib/types/openai/BookVariation";
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
    const body = new FormData()
    body.set("mediaType", variant.mediaType)
    body.set("title", variant.title)
    body.set("author", variant.author)
    body.set("publishedBy", variant.publishedBy)
    body.set("publishedOn", `${variant.monthPublished ?? ''} ${variant.yearPublished ?? ''}`.trim())
    body.set("serialNumber", variant.serialNumber)
    body.set("catalogNumber", variant.catalogNumber)

    fetch('/api/library', {
      method: 'POST',
      body
    }).then(res => res.json())
      .then((newEntry) => {
        setData([...data, asLibraryEntry(newEntry.entry.id, variant)])
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
              {data.map((d, index) =>
                <TableRow key={`book-${index}`}>
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
