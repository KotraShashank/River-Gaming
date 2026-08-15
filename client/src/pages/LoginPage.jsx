import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import LoginImage from "/register.avif";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { Slide, toast, ToastContainer } from "react-toastify";
import axios from "axios";

const formSchema = z.object({
  email: z.string().email("Invalid Email Address"),
  password: z.string().min(4, "Password must be at least 4 characters"),
});

const LoginPage = () => {
  const navigate = useNavigate();
  const [verify, setVerify] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setVerify(false);
          return;
        }

        const res = await axios.get("/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.status === 200) {
          navigate("/");
        }
      } catch (err) {
        localStorage.removeItem("token");
        toast.error("Token could not be verified or expired, please login");
        setVerify(false);
      }
    };

    verifyToken();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await axios.post("/api/auth/login", values);
      localStorage.setItem("token", res.data.token);

      navigate("/");
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0] || err.response?.data?.message
      );
    }
  };

  if (verify) return null;

  return (
    <div className="flex justify-center items-center h-[100vh] p-5">
      <Card className="flex flex-col lg:flex-row w-full max-w-5xl overflow-hidden shadow-xl rounded-2xl  p-0">
        <div className="hidden lg:block w-full lg:w-1/2">
          <img
            src={LoginImage}
            alt="Login Visual"
            className="object-cover w-full h-full"
          />
        </div>

        <div className="w-full lg:w-1/2 p-4">
          <CardHeader className="mb-5">
            <CardTitle className="text-xl">Login User</CardTitle>
            <CardDescription>Enter email and password to login</CardDescription>
          </CardHeader>

          <CardContent className="px-6 py-4 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="example@domain.com"
                          type="email"
                          className="focus-visible:ring-2 focus-visible:ring-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <div className="min-h-[1.5rem] text-sm text-red-500">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter Password"
                          type="password"
                          className="focus-visible:ring-2 focus-visible:ring-blue-400"
                          {...field}
                        />
                      </FormControl>
                      <div className="min-h-[1.5rem] text-sm text-red-500">
                        <FormMessage />
                      </div>
                    </FormItem>
                  )}
                />

                <Button type="submit" className="font-semibold w-full">
                  Login
                </Button>
                <Separator />
                <p className="text-center text-sm text-zinc-500">
                  Don't have an account?{" "}
                  <a
                    className="underline text-blue-400 hover:text-blue-500 active:text-blue-600"
                    href="/register"
                  >
                    Register
                  </a>
                </p>
              </form>
            </Form>
          </CardContent>
        </div>
      </Card>
      <ToastContainer
        limit={3}
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        theme="colored"
        transition={Slide}
      />
    </div>
  );
};

export default LoginPage;
