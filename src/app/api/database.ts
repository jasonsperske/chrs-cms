// Adapted from https://krimsonhart.medium.com/how-i-built-my-portfolio-using-next-js-and-sqlite-db-part-2-37595ca4dc40
import path from "path";
import sqlite3 from "sqlite3";

const dbPath = path.join(process.cwd(), "library.sqlite");
export const db = new sqlite3.Database(
    dbPath,
    sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
    (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log("Connected to the library database.");
    }
);

export async function apiGet<T>(query: string) {
    return await new Promise<T[]>((resolve, reject) => {
        db.all<T[]>(query, (err: Error, row: T[]) => {
            if (err) {
                console.log(err);
                return reject(err);
            }
            return resolve(row);
        });
    });
};

type Optional = string | object | undefined
export async function apiPost(query: string, values: Optional[]) {
    return await new Promise<number>((resolve, reject) => {
        db.run(query, values, function (err) {
            if (err) {
                console.log(err);
                reject(err);
            }
            resolve(this.lastID);
        });
    });
};