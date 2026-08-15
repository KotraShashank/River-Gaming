import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogClose,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CirclePlay, Pencil } from "lucide-react";
import useStreamStore from "../store/streamStore";
import { toast } from "react-toastify";
import { useRef, useEffect } from "react";

const streamCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  thumbnailUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtubeEmbedUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// mode: "create" | "edit"
// stream: existing stream object, required when mode is "edit"
// trigger: optional custom element to open the dialog (defaults to an
// "Add Stream" button in create mode, or an edit icon button in edit mode)
const StreamDialog = ({ mode = "create", stream = null, trigger }) => {
  const isEdit = mode === "edit";

  const addStream = useStreamStore((state) => state.addStream);
  const updateStream = useStreamStore((state) => state.updateStream);
  const fetchStreams = useStreamStore((state) => state.fetchStreams);
  const closeRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(streamCreateSchema),
    defaultValues: {
      title: stream?.title ?? "",
      thumbnailUrl: stream?.thumbnailUrl ?? "",
      youtubeEmbedUrl: stream?.youtubeEmbedUrl ?? "",
    },
  });

  // Keep the form in sync if the underlying stream data changes
  // (e.g. after a refetch) while the dialog is open.
  useEffect(() => {
    if (isEdit && stream) {
      form.reset({
        title: stream.title ?? "",
        thumbnailUrl: stream.thumbnailUrl ?? "",
        youtubeEmbedUrl: stream.youtubeEmbedUrl ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream]);

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await updateStream(stream.streamId, data);
        toast.success("Stream updated successfully");
      } else {
        await addStream(data);
        toast.success("Stream created successfully");
        form.reset();
      }
      await fetchStreams();
      closeRef.current?.click();
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Failed to update stream" : "Failed to create stream");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger ??
          (isEdit ? (
            <Button size="icon" variant="outline" title="Edit stream">
              <Pencil className="size-4" />
            </Button>
          ) : (
            <Button className="font-semibold">
              <CirclePlay /> Add Stream
            </Button>
          ))}
      </DialogTrigger>
      <DialogContent onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            {isEdit ? "Edit Stream Details" : "Enter Stream Details"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this stream's details. Changes take effect immediately for anyone currently viewing it."
              : "A new stream will be created with these details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Stream Title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thumbnailUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Thumbnail URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Thumbnail URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="youtubeEmbedUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>YouTube URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Paste any YouTube link" {...field} />
                  </FormControl>
                  <FormDescription>
                    Watch links and youtu.be links are converted to an embed
                    link automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  ref={closeRef}
                  variant={"outline"}
                  className={"font-semibold"}
                  type="button"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="font-semibold">
                {isEdit ? "Save Changes" : "Create Stream"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StreamDialog;
