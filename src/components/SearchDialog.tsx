"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Entry } from "@/lib/types/library/Entry";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectEntry: (entry: Entry) => void;
};

export default function SearchDialog({
  open,
  onClose,
  onSelectEntry,
}: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Entry[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSearch() {
    if (!searchTerm.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/library/search?q=${encodeURIComponent(searchTerm)}`
      );
      const data = await response.json();
      if (data.success) {
        setResults(
          data.results.map((entry: unknown) => Entry.fromJSON(entry as Record<string, unknown>))
        );
      } else {
        setResults([]);
      }
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSearch();
    }
  }

  function handleSelect(entry: Entry) {
    onSelectEntry(entry);
    setSearchTerm("");
    setResults([]);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-white overflow-y-auto max-h-[90vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>Search Library</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-4">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search by title, author, publisher, or edition..."
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        {results.length > 0 ? (
          <div className="border rounded-md">
            <Table>
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
                {results.map((entry) => (
                  <TableRow
                    key={entry.id ?? entry.title}
                    onClick={() => handleSelect(entry)}
                    className="cursor-pointer hover:bg-neutral-100"
                  >
                    <TableCell>{entry.title}</TableCell>
                    <TableCell>{entry.author}</TableCell>
                    <TableCell>{entry.mediaType}</TableCell>
                    <TableCell>
                      {entry.publishedBy} {entry.publishedLocation}{" "}
                      {entry.publishedOn}
                    </TableCell>
                    <TableCell>
                      {entry.edition} {entry.editionYear ? `(${entry.editionYear})` : null}
                    </TableCell>
                    <TableCell>
                      {entry.serialNumber ? `isbn:${entry.serialNumber}` : null}{" "}
                      {entry.catalogNumber
                        ? `catalog:${entry.catalogNumber}`
                        : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : searchTerm && !isSearching ? (
          <p className="text-sm text-neutral-500 text-center py-4">
            No results found.
          </p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

