import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { toast } from "react-toastify";

const quizSchema = z.object({
  question: z.string().min(1, "Question is required"),
  options: z.array(z.string().min(1, "Option is required")).length(4),
  correctIndex: z.preprocess(
    (val) => parseInt(val, 10),
    z.number().int().min(0).max(3)
  ),
});

const AdminQuiz = ({ streamId, socket }) => {
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      question: "",
      options: ["", "", "", ""],
      correctIndex: "0",
    },
  });

  useEffect(() => {
    if (!socket) return;

    const handleResults = (data) => {
      setResults((prev) => [...prev, data]);
    };

    socket.on("quiz_results", handleResults);

    return () => {
      socket.off("quiz_results", handleResults);
    };
  }, [socket]);

  const startQuiz = (data) => {
    socket.emit("start_quiz", {
      streamId,
      quiz: {
        question: data.question,
        options: data.options,
        correctIndex: parseInt(data.correctIndex, 10),
      },
    });

    reset();
    setResults([]);
    setIsOpen(false);
    toast.success("Quiz started successfully");
  };

  return (
    <div className="space-y-4">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button className="font-semibold">Start Quiz</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Start a New Quiz</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(startQuiz)} className="space-y-2">
            <Input
              placeholder="Enter quiz question"
              {...register("question")}
              className="mb-4"
            />
            {errors.question && (
              <p className="text-sm text-red-500">{errors.question.message}</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="space-y-1">
                  <Input
                    placeholder={`Option ${idx + 1}`}
                    {...register(`options.${idx}`)}
                  />
                  {errors.options?.[idx] && (
                    <p className="text-sm text-red-500">
                      {errors.options[idx]?.message}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <Label className="block mb-2">Select Correct Option:</Label>
              <Controller
                name="correctIndex"
                control={control}
                defaultValue="0"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="flex gap-4"
                  >
                    {["0", "1", "2", "3"].map((val) => (
                      <div key={val} className="flex items-center space-x-2">
                        <RadioGroupItem value={val} id={`r-${val}`} />
                        <Label htmlFor={`r-${val}`}>Option {+val + 1}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              />
              {errors.correctIndex && (
                <p className="text-sm text-red-500 mt-1">
                  {errors.correctIndex.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full mt-4 font-semibold">
              Launch Quiz
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {results.length > 0 && (
        <div>
          <h4 className="font-semibold">Quiz Results (Real-time):</h4>
          <ul className="list-disc pl-4">
            {results.map(({ userId, answer }, idx) => (
              <li key={idx}>
                User <b>{userId}</b> answered: {answer}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default AdminQuiz;
