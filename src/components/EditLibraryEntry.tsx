import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { useState } from "react";
import { Entry } from "@/lib/types/library/Entry";
import { bindInput } from "@/lib/utils";

type Props = {
  entry: Entry;
  onClose: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

export default function EditLibraryEntry({
  entry,
  onClose,
  onEdit,
  onDelete,
}: Props) {
  const [title, setTitle] = useState(entry.title);
  const [author, setAuthor] = useState(entry.author);
  const [mediaType, setMediaType] = useState(entry.mediaType);
  const [publishedBy, setPublishedBy] = useState(entry.publishedBy);
  const [publishedOn, setPublishedOn] = useState(entry.publishedOn);
  const [publishedLocation, setPublishedLocation] = useState(
    entry.publishedLocation
  );
  const [edition, setEdition] = useState(entry.edition);
  const [editionYear, setEditionYear] = useState(entry.editionYear);
  const [serialNumber, setSerialNumber] = useState(entry.serialNumber);
  const [catalogNumber, setCatalogNumber] = useState(entry.catalogNumber);
  const [section, setSection] = useState(entry.section);

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[625px] bg-white overflow-y-scroll max-h-screen">
        <DialogHeader>Edit {entry.title}</DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onEdit(new Entry(title, mediaType, {
              id: entry.id,
              author,
              publishedBy,
              publishedOn,
              publishedLocation,
              edition,
              editionYear,
              serialNumber,
              catalogNumber,
              section
            }));
          }}
        >
          <div className="grid gap-4 py-4">
            <div className="grid sm:grid-cols-2 grid-cols-1 items-center gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Title</Label>
                <Input
                  value={title}
                  onChange={bindInput(setTitle)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Author</Label>
                <Input
                  value={author}
                  onChange={bindInput(setAuthor)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Type</Label>
                <Input
                  value={mediaType}
                  onChange={bindInput(setMediaType)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Section</Label>
                <Input
                  value={section}
                  onChange={bindInput(setSection)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Published By</Label>
                <Input
                  value={publishedBy}
                  onChange={bindInput(setPublishedBy)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Published On</Label>
                <Input
                  value={publishedOn}
                  onChange={bindInput(setPublishedOn)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Published Location</Label>
                <Input
                  value={publishedLocation}
                  onChange={bindInput(setPublishedLocation)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Edition</Label>
                <Input
                  value={edition}
                  onChange={bindInput(setEdition)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Edition Year</Label>
                <Input
                  value={editionYear}
                  onChange={bindInput(setEditionYear)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">ISBN</Label>
                <Input
                  value={serialNumber}
                  onChange={bindInput(setSerialNumber)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Catalog</Label>
                <Input
                  value={catalogNumber}
                  onChange={bindInput(setCatalogNumber)}
                  className="col-span-3"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Save</Button>
            <Button
              onClick={(event) => {
                event.preventDefault();
                onDelete(entry);
              }}
              className="bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
