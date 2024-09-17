import { NextResponse } from "next/server";
import { apiExec, apiGetOne } from "../../database";
import { Entry } from "@/lib/types/library/Entry";

type Params = {
  params: {
    id: number;
  };
};

export async function GET(request: Request, { params }: Params) {
  const result = await apiGetOne<Entry>(
    "SELECT * FROM library WHERE id = ?",
    [params.id]
  );

  return NextResponse.json({ success: true, result });
}

export async function PUT(request: Request, { params }: Params) {
  const body = await request.formData();
  const mediaType = body.get("mediaType");
  const title = body.get("title");
  const author = body.get("author");
  const publishedBy = body.get("publishedBy");
  const publishedOn = body.get("publishedOn");
  const publishedLocation = body.get("publishedLocation");
  const edition = body.get("edition");
  const editionYear = body.get("editionYear");
  const serialNumber = body.get("serialNumber");
  const catalogNumber = body.get("catalogNumber");

  const updated = await apiExec(
    "UPDATE library SET mediaType = ?, title = ?, author = ?, publishedBy = ?, publishedOn = ?, publishedLocation = ?, edition = ?, editionYear = ?, serialNumber = ?, catalogNumber = ? WHERE id = ?",
    [
      mediaType?.valueOf(),
      title?.valueOf(),
      author?.valueOf(),
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

  return NextResponse.json({ success: true, updated });
}

export async function DELETE(request: Request, { params }: Params) {
  const deleted = await apiExec("DELETE FROM library WHERE id = ?", [
    params.id,
  ]);

  return NextResponse.json({ success: true, deleted });
}
