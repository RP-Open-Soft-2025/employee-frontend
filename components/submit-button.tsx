'use client';

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import { LoaderIcon } from '@/components/icons';

import { Button } from './ui/button';

interface SubmitButtonProps {
  isSuccessful?: boolean;
  children: ReactNode;
  className?: string;
}

export function SubmitButton({ isSuccessful, children, className = "" }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  
  return (
    <Button
      type={pending ? 'button' : 'submit'}
      aria-disabled={pending || isSuccessful}
      disabled={pending || isSuccessful}
      className={`
        w-full mt-4 py-2 px-4 rounded font-semibold
        ${pending ? "bg-gray-400 cursor-not-allowed" : 
          isSuccessful ? "bg-green-500 cursor-not-allowed" : 
          "bg-[#66872B] hover:bg-[#7FA034] dark:bg-[#3B4F17] dark:hover:bg-[#4A6420]"}
        text-white transition-colors
        ${className}
      `}
    >
      {pending ? "Processing..." : isSuccessful ? "Success!" : children}

      {(pending || isSuccessful) && (
        <span className="animate-spin left-4">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? 'Loading' : 'Submit form'}
      </output>
    </Button>
  );
}
