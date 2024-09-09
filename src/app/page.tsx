import ImageOCRInput from "@/components/ImageOCRInput";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Data = {
  id: number
  name: string
}

const data: [Data] = [
  {
    id: 1,
    name: 'IRE',
  }
]
export default function Home() {
  return (
    <div className="p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main>
        <div className="row">
          <ImageOCRInput />
        </div>
        <div className="row">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead key="name">Name</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((d) =>
                <TableRow key={d.id}>
                  <TableCell>{d.name}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
