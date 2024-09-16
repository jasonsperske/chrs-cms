import { type BookVariation } from "./openai/BookVariation";

export type LibraryEntry = {
  id: number;
  mediaType: string;
  title: string;
  author?: string;
  publishedBy?: string;
  publishedOn?: string;
  publishedLocation?: string;
  edition?: string;
  editionYear?: string;
  serialNumber?: string;
  catalogNumber?: string;
};

export function asLibraryEntry(id: number, variation: BookVariation) {
  const entry: LibraryEntry = {
    id,
    mediaType: variation.mediaType,
    title: variation.title,
    author: variation.author,
    publishedBy: variation.publishedBy,
    publishedOn: `${variation.monthPublished ?? ""} ${
      variation.yearPublished ?? ""
    }`.trim(),
    serialNumber: variation.serialNumber,
    catalogNumber: variation.catalogNumber,
  };
  return entry;
}

export function asFormData(entry: LibraryEntry) {
  const formData = new FormData();
  formData.append("mediaType", entry.mediaType);
  formData.append("title", entry.title);
  formData.append("author", entry.author ?? "");
  formData.append("publishedBy", entry.publishedBy ?? "");
  formData.append("publishedOn", entry.publishedOn ?? "");
  formData.append("publishedLocation", entry.publishedLocation ?? "");
  formData.append("edition", entry.edition ?? "");
  formData.append("editionYear", entry.editionYear ?? "");
  formData.append("serialNumber", entry.serialNumber ?? "");
  formData.append("catalogNumber", entry.catalogNumber ?? "");
  return formData;
}
