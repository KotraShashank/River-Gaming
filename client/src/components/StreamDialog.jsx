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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CirclePlay } from "lucide-react";
import useStreamStore from "../store/streamStore";
import { toast } from "react-toastify";
import { useRef, useState } from "react";

const streamCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  thumbnailUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtubeEmbedUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

const StreamDialog = () => {
  const addStream = useStreamStore((state) => state.addStream);
  const fetchStreams = useStreamStore((state) => state.fetchStreams);
  const closeRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(streamCreateSchema),
    defaultValues: {
      title: "",
      thumbnailUrl: "",
      youtubeEmbedUrl: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await addStream(data);
      toast.success("Stream created successfully");
      await fetchStreams();
      form.reset();
      closeRef.current?.click();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create stream");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="font-semibold">
          <CirclePlay /> Add Stream
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-semibold text-lg">
            Enter Stream Details
          </DialogTitle>
          <DialogDescription>
            A new stream will be created with these details.
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
                  <FormLabel>YouTube Embed URL (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="YouTube Embed URL" {...field} />
                  </FormControl>
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
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" className="font-semibold">
                Create Stream
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default StreamDialog;
