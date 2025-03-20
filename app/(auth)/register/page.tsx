"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";

import { toast } from "@/components/toast";

import { useDispatch, useSelector } from "react-redux";
import { checkAuth } from "@/redux/features/auth";
import type { RootState } from "@/redux/store";

interface RegisterState {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "invalid_data";
}

export default function Page() {
  const router = useRouter();

  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const error = useSelector((state: RootState) => state.auth.error);
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Check authentication status on component mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);


  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [status, setStatus] = useState<RegisterState["status"]>("idle");


  useEffect(() => {
    if (status === "user_exists") {
      toast({ type: "error", description: "Account already exists!" });
    } else if (status === "failed") {
      toast({ type: "error", description: "Failed to create account!" });
    } else if (status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (status === "success") {
      toast({ type: "success", description: "Account created successfully!" });
      setIsSuccessful(true);
      // router.refresh();
    }
  }, [status, router]);

  const handleSubmit = (formData: FormData) => {
    setEmail(formData.get("email") as string);
    setStatus("in_progress");

    const data = {
      // name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      // confirmPassword: formData.get("confirmPassword") as string,
    };

    console.log(data);

    // if (data.password !== data.confirmPassword) {
    //   setErrorMessage("Passwords do not match");
    //   return;
    // }

    // const user = await createUser(data);

    const user = {
      success: true,
      message: "Sign up successful",
      token: "JWTGENERATEDTOKEN",
    };

    if (user.success) {
      setStatus("success");
      // ref.current?.reset();
      router.push(`/login`);
    } else {
      setStatus("failed");
      console.error(user.message);
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl gap-12 flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign Up</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Create an account with your email and password
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmail={email}>
          <SubmitButton isSuccessful={isSuccessful}>Sign Up</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Already have an account? "}
            <Link
              href="/login"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign in
            </Link>
            {" instead."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
