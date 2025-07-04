import { NextResponse } from "next/server";
import { apiExec, apiGetOne } from "../../database";
import { Entry } from "@/lib/types/library/Entry";

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
  const body = await request.formData();
  const mediaType = body.get("mediaType");
  const title = body.get("title");
  const author = body.get("author");
  const section = body.get("section");
  const publishedBy = body.get("publishedBy");
  const publishedOn = body.get("publishedOn");
  const publishedLocation = body.get("publishedLocation");
  const edition = body.get("edition");
  const editionYear = body.get("editionYear");
  const serialNumber = body.get("serialNumber");
  const catalogNumber = body.get("catalogNumber");

  const updated = await apiExec(
    "UPDATE library SET mediaType = ?, title = ?, author = ?, section = ?, publishedBy = ?, publishedOn = ?, publishedLocation = ?, edition = ?, editionYear = ?, serialNumber = ?, catalogNumber = ? WHERE id = ?",
    [
      mediaType?.valueOf(),
      title?.valueOf(),
      author?.valueOf(),
      section?.valueOf(),
      publishedBy?.valueOf(),
      publishedOn?.valueOf(),
      publishedLocation?.valueOf(),
      edition?.valueOf(),
      editionYear?.valueOf(),
      serialNumber?.valueOf(),
      catalogNumber?.valueOf(),
      params.id,
    ]
  );

  return NextResponse.json<EntryPutResponse>({
    success: updated === 1,
    id: parseInt(params.id, 10),
    mediaType: mediaType?.valueOf() as string,
    title: title?.valueOf() as string,
    author: author?.valueOf() as string,
    section: section?.valueOf() as string,
    publishedBy: publishedBy?.valueOf() as string,
    publishedOn: publishedOn?.valueOf() as string,
    publishedLocation: publishedLocation?.valueOf() as string,
    edition: edition?.valueOf() as string,
    editionYear: editionYear?.valueOf() as string,
    serialNumber: serialNumber?.valueOf() as string,
    catalogNumber: catalogNumber?.valueOf() as string
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const deleted = await apiExec("DELETE FROM library WHERE id = ?", [
    params.id,
  ]);

  return NextResponse.json<EntryDeletedResponse>({ success: true, deleted });
}
