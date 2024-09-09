![Screenshot from 2024-09-08 22-39-32](https://github.com/user-attachments/assets/df99cc1b-8976-4fb1-8492-f6287a249569)


## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## OpenAI Assistant

This application uses an OpenAI assistant called `CHRS Archivist` with the following configuration:

Model: `gpt-4o-mini`
Instructions:
```
Your job is to take OCR extracted text from title pages of books and magazines and turn them into an array of JSON objects with fields named `title` (representing the title of the book), `author` (representing the author of the book), `publisher` (representing the publisher) and `yearPublished` (representing the year published). OCR might have produced extra meaningless characters, present multiple interpretations as an array with a confidence value between 0 and 1 for each option. One or more of the requested fields might also be missing.
```
Response format: `json_schema`
Schema:
```
{
  "name": "book_result",
  "strict": true,
  "schema": {
    "type": "object",
    "properties": {
      "variations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "title": {
              "type": "string"
            },
            "author": {
              "type": "string"
            },
            "publisher": {
              "type": "string"
            },
            "yearPublished": {
              "type": "number"
            },
            "confidence": {
              "type": "number"
            }
          },
          "required": [
            "title",
            "author",
            "publisher",
            "yearPublished",
            "confidence"
          ],
          "additionalProperties": false
        }
      }
    },
    "additionalProperties": false,
    "required": [
      "variations"
    ]
  }
}
```
