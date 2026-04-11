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
        subCategory TEXT,
        status TEXT,
        publishedSource TEXT,
        pages TEXT,
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
                        const newColumns = ["sortBy", "subCategory", "status", "publishedSource", "pages"];
                        newColumns.forEach((col) => {
                            const hasColumn = rows.some((r) => r.name === col);
                            if (!hasColumn) {
                                db.run(
                                    `ALTER TABLE library ADD COLUMN ${col} TEXT`,
                                    (alterErr: Error | null) => {
                                        if (alterErr) {
                                            console.error(alterErr.message);
                                        } else {
                                            console.log(
                                                `Migration: added ${col} column to library.`
                                            );
                                        }
                                    }
                                );
                            }
                        });
                    }
                );
            }
        );
    });
};

migrate();
