"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "@/components/toast";
import { SubmitButton } from "@/components/submit-button";
import DeloitteLogo from "../login/deloitte-logo.svg"; // Reuse the logo from login page

// Use environment variable for API URL with fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSuccessful, setIsSuccessful] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    const email = formData.get("email") as string;
    setEmail(email);

    if (!email) {
      toast({
        type: "error",
        description: "Please enter your email address",
      });
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsSuccessful(true);
        setEmailSent(true);
        toast({
          type: "success",
          description: "Password reset link sent to your email",
        });
      } else if (response.status === 404) {
        toast({
          type: "error",
          description: "Email not registered",
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast({
          type: "error",
          description: errorData.message || "Failed to send password reset link",
        });
      }
    } catch (error) {
      console.error("Forgot password error:", error);
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
            {!emailSent ? (
              <>
                <div className="font-semibold text-2xl mb-3 text-black dark:text-white">
                  Forgot Password
                </div>
                <form action={handleSubmit} className="flex flex-col gap-4 w-full">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="email"
                      className="text-zinc-600 font-normal dark:text-zinc-400"
                    >
                      Email Address
                    </label>
                    <input
                      id="email"
                      name="email"
                      className="bg-muted text-md md:text-sm p-2 rounded-md border border-gray-300 dark:border-gray-700"
                      type="email"
                      placeholder="example@email.com"
                      autoComplete="email"
                      required
                      autoFocus
                      defaultValue={email}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-4">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                  </p>

                  <SubmitButton isSuccessful={isSuccessful}>
                    Reset Password
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
              </>
            ) : (
              <div className="flex flex-col items-center text-center">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="font-semibold text-2xl mb-3 text-black dark:text-white">
                  Check Your Email
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  We&apos;ve sent a password reset link to:
                </p>
                <p className="text-black dark:text-white font-medium mb-6 break-all">
                  {email}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                  Please check your email and click on the link to reset your password. 
                  The link will be valid for 5 minutes.
                </p>
                <div className="flex flex-col items-center mt-4">
                  <Link
                    href="/login"
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer text-sm"
                  >
                    Back to login
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 