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
        section TEXT,
        sortBy TEXT
      );
    `,
            (err: Error | null) => {
                if (err) {
                    console.error(err.message);
                } else {
                    console.log("library table ensured.");
                }

                db.all(
                    "PRAGMA table_info(library)",
                    [],
                    (
                        pragmaErr: Error | null,
                        rows: { name: string }[]
                    ) => {
                        if (pragmaErr) {
                            console.error(pragmaErr.message);
                            return;
                        }
                        const hasSortBy = rows.some((r) => r.name === "sortBy");
                        if (!hasSortBy) {
                            db.run(
                                "ALTER TABLE library ADD COLUMN sortBy TEXT",
                                (alterErr: Error | null) => {
                                    if (alterErr) {
                                        console.error(alterErr.message);
                                    } else {
                                        console.log(
                                            "Migration: added sortBy column to library."
                                        );
                                    }
                                }
                            );
                        }
                    }
                );
            }
        );
    });
};

migrate();
