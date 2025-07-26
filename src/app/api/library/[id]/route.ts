import { NextResponse } from "next/server";
import { apiExec, apiGetOne } from "../../database";
import { Entry } from "@/lib/types/library/Entry";
import { formBody } from "@/lib/utils";

type Params = {
  params: {
    id: string;
  };
};

type EntryGetResponse = {
  success: boolean;
  result: Entry;
};

type EntryDeletedResponse = {
  success: boolean;
  deleted: number;
};

type EntryPutResponse = {
  success: boolean
} & Omit<Entry, "asFormData" | "withId" | "is">

export async function GET(request: Request, { params }: Params) {
  const result = await apiGetOne<Entry>(
    "SELECT * FROM library WHERE id = ?",
    [params.id]
  );

  return NextResponse.json<EntryGetResponse>({ success: true, result });
}

export async function PUT(request: Request, { params }: Params) {
  const body = formBody(await request.formData());
  const mediaType = body("mediaType");
  const title = body("title");
  const author = body("author");
  const section = body("section");
  const publishedBy = body("publishedBy");
  const publishedOn = body("publishedOn");
  const publishedLocation = body("publishedLocation");
  const edition = body("edition");
  const editionYear = body("editionYear");
  const serialNumber = body("serialNumber");
  const catalogNumber = body("catalogNumber");

  const updated = await apiExec(
    "UPDATE library SET mediaType = ?, title = ?, author = ?, section = ?, publishedBy = ?, publishedOn = ?, publishedLocation = ?, edition = ?, editionYear = ?, serialNumber = ?, catalogNumber = ? WHERE id = ?",
    [
      mediaType,
      title,
      author,
      section,
      publishedBy,
      publishedOn,
      publishedLocation,
      edition,
      editionYear,
      serialNumber,
      catalogNumber,
      params.id,
    ]
  );

  return NextResponse.json<EntryPutResponse>({
    success: updated === 1,
    id: parseInt(params.id, 10),
    mediaType,
    title,
    author,
    section,
    publishedBy,
    publishedOn,
    publishedLocation,
    edition,
    editionYear,
    serialNumber,
    catalogNumber
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const deleted = await apiExec("DELETE FROM library WHERE id = ?", [
    params.id,
  ]);

  return NextResponse.json<EntryDeletedResponse>({ success: true, deleted });
}
