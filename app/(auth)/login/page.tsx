"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "@/components/toast";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";

import { useDispatch, useSelector } from "react-redux";
import { loginSuccess, loginFailure, checkAuth } from "@/redux/features/auth";
import type { RootState } from "@/redux/store";

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface LoginState {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_credentials" | "invalid_data" | "server_error";
}

export default function Page() {
  const router = useRouter();

  const dispatch = useDispatch();
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );
  const error = useSelector((state: RootState) => state.auth.error);
  
  // Check authentication status on component mount
  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);
  
  // If already authenticated, redirect to home
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const [employeeId, setEmployeeId] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);

  const [status, setStatus] = useState<LoginState["status"]>("idle");

  useEffect(() => {
    console.log("status", status);
    if (status === "invalid_credentials") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (status === "server_error") {
      toast({
        type: "error",
        description: error || "An error occurred during login",
      });
    } else if (status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (status === "success") {
      setIsSuccessful(true);
      // Don't need to call router.push here as the isAuthenticated effect will handle it
    }
  }, [status, error]);

  const handleSubmit = async (formData: FormData) => {
    setEmployeeId(formData.get("employee_id") as string);
    setStatus("in_progress");

    const data = {
      employee_id: formData.get("employee_id") as string,
      password: formData.get("password") as string,
    };

    console.log(data);

    // Temporary bypass of API integration - accept any credentials
    try {
      // Simulate a successful login with any credentials
      const mockToken = "mock-jwt-token";
      
      // Dispatch success with the employee ID from the form
      dispatch(loginSuccess({ token: mockToken, user: { employee_id: data.employee_id } }));
      console.log("Logged in successfully");
      setStatus("success");
      // The isAuthenticated effect will handle redirecting
    } catch (error) {
      console.error("Login error:", error);
      setStatus("server_error");
      dispatch(loginFailure({ error: "An unexpected error occurred" }));
    }
  };

  return (
    <div className="flex h-dvh w-screen items-start pt-12 md:pt-0 md:items-center justify-center bg-background">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">Sign In</h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Use your employee ID and password to sign in
          </p>
        </div>
        <AuthForm action={handleSubmit} defaultEmployeeId={employeeId}>
          <SubmitButton isSuccessful={isSuccessful}>Sign in</SubmitButton>
          <p className="text-center text-sm text-gray-600 mt-4 dark:text-zinc-400">
            {"Don't have an account? "}
            <Link
              href="/register"
              className="font-semibold text-gray-800 hover:underline dark:text-zinc-200"
            >
              Sign up
            </Link>
            {" for free."}
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
