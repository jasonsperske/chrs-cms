'use client'
import { BookVariation } from "@/components/ImageOCRInput";
import MultipleImageInput from "@/components/MultipleImageInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";

export default function Home() {
  const [data, setData] = useState<BookVariation[]>([])

  function handleVariantSelection(variant: BookVariation): void {
    setData([...data, variant])
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
                <TableHead key="publisher">Publisher</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d, index) =>
                <TableRow key={`book-${index}`}>
                  <TableCell>{d.title}</TableCell>
                  <TableCell>{d.author}</TableCell>
                  <TableCell>{d.publisher}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
