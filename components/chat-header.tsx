"use client";

import { useRouter } from "next/navigation";
import { useWindowSize } from "usehooks-ts";
import { ChevronDown, LayoutDashboard, UserCircle } from "lucide-react";
import { useTheme } from "next-themes";
import { useDispatch, useSelector } from "react-redux";
import { logout, checkAuth } from "@/redux/features/auth";
import type { RootState } from "@/redux/store";
import { memo, useEffect } from "react";

import { SidebarToggle } from "@/components/sidebar-toggle";
import { Button } from "@/components/ui/button";
import { useSidebar } from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HeaderUserNav() {
  const { setTheme, theme } = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated
  );

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const handleLogOut = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        console.error("Logout failed:", response.statusText);
      }

      const result = await response.json();
      console.log(result);
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      // Proceed with local logout even if API call fails
      dispatch(logout());
      router.push("/login");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-white dark:bg-[hsl(var(--deep-blue-dark))] hover:bg-gray-100 dark:hover:bg-[hsl(var(--deep-blue))] text-black dark:text-white flex py-1.5 px-4 order-4 md:ml-auto gap-2 border-gray-200 dark:border-[hsl(var(--deep-blue))]"
        >
          <UserCircle className="size-5" />
          <span className="truncate hidden md:block">{user?.employee_id}</span>
          <ChevronDown className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[--radix-popper-anchor-width] min-w-fit whitespace-nowrap notification-dropdown-content"
      >
        <DropdownMenuItem
          className="cursor-pointer notification-item"
          onSelect={() => router.push("/")}
        >
        <LayoutDashboard className="mr-2 size-4" />
          Dashboard
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          className="cursor-pointer"
          onSelect={() => {
            router.push("/session");
          }}
        >
          <MessageSquare className="mr-2 size-4" />
          View Session
        </DropdownMenuItem> */}
        <DropdownMenuItem
          className="cursor-pointer notification-item"
          onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          {`Toggle ${theme === "light" ? "dark" : "light"} mode`}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button
            type="button"
            className="w-full cursor-pointer notification-item"
            onClick={handleLogOut}
          >
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PureChatHeader({
  chatId,
  isReadonly,
}: {
  chatId: string;
  isReadonly: boolean;
}) {
  const router = useRouter();
  const { open } = useSidebar();

  const { width: windowWidth } = useWindowSize();

  return (
    <header className="flex sticky top-0 py-1.5 items-center px-2 md:px-2 gap-2">
      <SidebarToggle />
    </header>
  );
}

export const ChatHeader = memo(PureChatHeader, (prevProps, nextProps) => {
  return true;
});
