import { cookies } from "next/headers";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import Script from "next/script";
import Image from "next/image";
import { Header } from "@/components/ui/header";
import logo from "@/public/images/deloitte-logo.svg";
import logoDark from "@/public/images/deloitte-logo-dark.svg";

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cookieStore] = await Promise.all([cookies()]);
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <div className="flex flex-col px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="w-full">
          <Header>
            <Image src={logo} alt="Logo" className="h-8 w-auto dark:hidden" />
            <Image src={logoDark} alt="Logo" className="h-8 w-auto hidden dark:block" />
          </Header>
        </div>

        <div
          id="sidebar-content-container"
          className="flex-1 relative overflow-hidden"
        >
          <SidebarProvider defaultOpen={!isCollapsed}>
            <AppSidebar />
            <SidebarInset>{children}</SidebarInset>
          </SidebarProvider>
        </div>
      </div>
    </>
  );
}
