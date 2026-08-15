import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogClose,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import useStreamStore from "../store/streamStore";
import { toast } from "react-toastify";

// trigger: optional custom element to open the dialog (defaults to a
// destructive trash-icon button)
const DeleteStreamDialog = ({ stream, trigger }) => {
  const deleteStream = useStreamStore((state) => state.deleteStream);
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteStream(stream.streamId);
      toast.success("Stream deleted");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete stream");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="icon" variant="destructive" title="Delete stream">
            <Trash2 className="size-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            Delete "{stream.title}"?
          </DialogTitle>
          <DialogDescription>
            This permanently removes the stream and its viewer history.
            Anyone currently watching will be disconnected. This can't be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" className="font-semibold" type="button">
              Cancel
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            className="font-semibold"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Stream"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteStreamDialog;
