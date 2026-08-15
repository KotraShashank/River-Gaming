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
import RegisterImage from "/login.avif";
import { Separator } from "@/components/ui/separator";
import axios from "axios";
import { Slide, toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";

const formSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(50, "Username can be at max 50 characters"),
    email: z.string().email("Invalid Email Address"),
    password: z.string().min(4, "Password must be at least 4 characters"),
    cnfpass: z.string().min(4, "Confirm Password is required"),
  })
  .refine((data) => data.password === data.cnfpass, {
    path: ["cnfpass"],
    message: "Passwords don't match",
  });

const RegisterPage = () => {
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
        toast.error("Token could not be verified or expired, please login");
        setVerify(false);
      }
    };

    verifyToken();
  }, []);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      cnfpass: "",
    },
  });

  const onSubmit = async (values) => {
    try {
      const res = await axios.post(
        "/api/auth/register",
        values
      );

      navigate("/login");
    } catch (err) {
      toast.error(
        err.response?.data?.errors?.[0] || err.response?.data?.message
      );
    }
  };

  if(verify) return null;

  return (
    <div className="flex justify-center items-center h-[100vh] p-5 -50">
      <Card className="flex flex-col lg:flex-row w-full max-w-5xl overflow-hidden shadow-xl rounded-2xl p-0">
        <div className="w-full lg:w-1/2 p-4">
          <CardHeader className={"mb-5"}>
            <CardTitle className={"text-xl"}>Registration Form</CardTitle>
            <CardDescription>
              Enter your credentials to create a new account
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-4 space-y-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Micheal Jam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                            {...field}
                          />
                        </FormControl>
                        <div className="min-h-[40px]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cnfpass"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Re-enter Password"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <div className="min-h-[40px]">
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="font-semibold w-full">
                  Register
                </Button>
                <Separator />
                <p className="text-center text-sm text-zinc-500">
                  Already have an account?{" "}
                  <a
                    className="underline text-blue-400 hover:text-blue-500 active:text-blue-600"
                    href="/login"
                  >
                    Login
                  </a>
                </p>
              </form>
            </Form>
          </CardContent>
        </div>

        <div className="hidden lg:block w-full lg:w-1/2">
          <img
            src={RegisterImage}
            alt="Register Visual"
            className="object-cover w-full h-full"
          />
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

export default RegisterPage;
