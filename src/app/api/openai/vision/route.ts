import { NextResponse } from "next/server";
import OpenAI from "openai";
import Sharp from "sharp";
import {
  saveTempBatch,
  saveTempBatchResponse,
  cleanupStaleTempBatches,
} from "../../uploads";

/** Abandoned scan batches are purged after this long. */
const TEMP_BATCH_TTL_MS = 60 * 60 * 1000;

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"],
});

export async function POST(request: Request) {
  const data = await request.formData();

  const section = data.get("section") as string | null;

  const files = Array.from(data.getAll("files")) as File[];

  const images = await Promise.all(
    files.map((file) =>
      file
        .arrayBuffer()
        .then((buffer) =>
          Sharp(buffer).resize(1024, 1024, { fit: "inside" }).jpeg().toBuffer()
        )
    )
  );

  // Stash the original scanned images now, before sending the resized copies to
  // OpenAI. If the user later selects a variant, the library endpoint just
  // promotes this batch to the new entry's folder instead of re-uploading.
  const uploadToken = await saveTempBatch(files);
  // Opportunistically sweep away scans that were never turned into entries.
  void cleanupStaleTempBatches(TEMP_BATCH_TTL_MS);

  function toDataURL(buffer: Buffer) {
    return "data:image/jpg;base64," + buffer.toString("base64");
  }

  const promptLines = [
    "I have pictures of a book, a manual or possibly a magazine. Respond in the",
    "form of a JSON. I would like you to tell me what type of media it",
    'is in a field called `mediaType` with "book" for a book and "magazine"',
    "for magazine. Tell me the title (if available) in field called `title`,",
    "the author (if available) in a field called `author`. If the media",
    "is a book tell me the year it was initially published if available.",
    "If the media is a magazine tell me the year it was issued in a field",
    "called `yearPublished` and the month in a field called `monthPublished`",
    "if it can be determined. If its possible tell me the name of the",
    "publisher in a field called `publishedBy`. If it is possible, tell me",
    "the place where the book was published in a field called `publishedLocation`.",
    "If it is possible tell me the edition of the book, magazine or catalog in a field",
    "called `edition`, if the edition is published in a later year tell me in",
    "a field called `editionYear`. If it is possible identify the ISBN number",
    '(also sometimes labeled "International Standard Book No.") in a field',
    'called `serialNumber`. If it is possible identify the "Library of Congress',
    'Catalog Card Number" number (also sometimes labeled "Library of Congress',
    'Catalog Number") in a field called `catalogNumber`. There may be more than',
    "one interpretation, give me these multiple interpretations with a confidence",
    "score between 0 and 1 for each.",
  ];

  if (section) {
    promptLines.push(
      `The user has categorized this item under the section "${section}".`,
      "Use this context to help inform your analysis of the media."
    );
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: promptLines.join(" "),
      },
      {
        role: "user",
        content: images.map((image) => ({
          type: "image_url",
          image_url: {
            url: toDataURL(image),
            detail: "auto",
          },
        })),
      },
    ],
    max_tokens: 10000,
  });

  // Keep the analysis next to the scanned images so it follows them into the
  // entry folder when a variant is selected.
  await saveTempBatchResponse(uploadToken, response);

  return NextResponse.json({
    success: response.choices.length > 0,
    uploadToken,
    response,
  });
}
