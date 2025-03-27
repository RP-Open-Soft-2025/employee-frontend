"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "@/components/toast";
import { SubmitButton } from "@/components/submit-button";
import DeloitteLogo from "../../login/deloitte-logo.svg"; // Adjust path for the nested folder structure

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const [isSuccessful, setIsSuccessful] = useState(false);
  const token = params?.token as string | undefined;

  if (!token) {
    router.push('/login');
    return null;
  }

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;

    if (password !== confirmPassword) {
      toast({
        type: "error",
        description: "Passwords do not match",
      });
      return;
    }

    if (!token) {
      toast({
        type: "error",
        description: "Invalid reset token",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_password: password }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsSuccessful(true);
        toast({
          type: "success",
          description: result.message || "Password reset successful",
        });
        // Redirect to login page after a delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else if (response.status === 400) {
        toast({
          type: "error",
          description: "New password cannot be the same as the old password",
        });
      } else if (response.status === 404) {
        toast({
          type: "error",
          description: "Invalid reset token",
        });
      } else {
        toast({
          type: "error",
          description: result.message || "Failed to reset password",
        });
      }
    } catch (error) {
      console.error("Reset password error:", error);
      toast({
        type: "error",
        description: (error instanceof Error ? error.message : String(error)) || "An error occurred",
      });
    }
  };

  return (
    <div className="w-full h-screen md:min-h-screen flex flex-col md:flex-row">
      {/* Left Section (Green) */}
      <div className="h-[50vh] md:h-auto w-full md:w-1/2 flex items-center justify-center bg-[#66872B] dark:bg-[#334016] relative">
        <div className="rounded-none md:rounded-l-2xl rounded-tl-0xl size-full md:size-[400px] bg-[#3B4F17] dark:bg-[#1E2B09] shadow-lg flex flex-col items-center justify-center text-center p-6 md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2 py-15">
          <h1 className="text-3xl font-bold text-white mb-2">Deloitte.</h1>
          <Image
            src={DeloitteLogo}
            alt="Deloitte Logo"
            width={150}
            height={150}
            className="rounded-lg shadow-[0_0_70px_25px_rgba(255,255,255,0.2)] dark:shadow-[0_0_70px_25px_rgba(255,255,255,0.15)]"
          />
        </div>
      </div>

      {/* Right Section (Black in dark mode) */}
      <div className="h-[50vh] md:h-auto w-full md:w-1/2 flex items-center justify-center bg-gray-200 dark:bg-black relative">
        <div className="rounded-none md:rounded-r-2xl size-full md:size-[400px] bg-[#D9D9D9] dark:bg-zinc-900 shadow-lg p-6 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2">
          <div className="flex flex-col items-center justify-center h-full md:mt-0 px-10">
            <div className="font-semibold text-2xl mb-3 text-black dark:text-white">
              Reset Password
            </div>
            <form action={handleSubmit} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="password"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  New Password
                </label>
                <input
                  id="password"
                  name="password"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700"
                  type="password"
                  placeholder="Enter new password"
                  required
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="confirm_password"
                  className="text-zinc-600 font-normal dark:text-zinc-400"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm_password"
                  name="confirm_password"
                  className="bg-muted text-md md:text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700"
                  type="password"
                  placeholder="Confirm new password"
                  required
                />
              </div>
              
              <SubmitButton isSuccessful={isSuccessful}>
                Save New Password
              </SubmitButton>
              
              <div className="flex flex-col items-center mt-4">
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer text-sm"
                >
                  Back to login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 