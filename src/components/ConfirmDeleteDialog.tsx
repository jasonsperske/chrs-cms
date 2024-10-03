import { Entry } from "@/lib/types/library/Entry";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader } from "./ui/dialog";

type Props = {
    entry: Entry;
    onClose: () => void;
    onDelete: (entry: Entry) => void;
};

export default function ConfirmDeleteDialog({ entry, onClose, onDelete }: Props) {
    return (<Dialog open={true} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-[400px] bg-white overflow-y-scroll max-h-screen">
            <DialogHeader>Confirm Delete</DialogHeader>
            <div>Are you sure?</div>
            <DialogFooter>
                <Button onClick={onClose}>No</Button>
                <Button
                    onClick={() => onDelete(entry)}
                    className="bg-red-700"
                >
                    Yes
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>)
}