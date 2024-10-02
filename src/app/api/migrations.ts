import { db } from "./database";

const migrate = () => {
    db.serialize(() => {
        db.run(
            `
      CREATE TABLE IF NOT EXISTS library (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mediaType TEXT NOT NULL,
        title TEXT NOT NULL,
        author TEXT,
        publishedBy TEXT,
        publishedLocation TEXT,
        edition TEXT,
        editionYear TEXT,
        publishedOn TEXT,
        serialNumber TEXT,
        catalogNumber TEXT,
        section TEXT
      );
    `,
            (err: Error) => {
                if (err) {
                    console.error(err.message);
                }
                console.log("articles table created successfully.");
            }
        );
    });
}

migrate()