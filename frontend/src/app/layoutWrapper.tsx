"use client"
import Footer from "@/components/layouts/Footer";
import Navbar from "@/components/layouts/Navbar";
import { usePathname } from "next/navigation";

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideLayout = pathname === "/signup" || pathname === "/login" || pathname.startsWith("/dashboard");
  return (
    <>
      {!hideLayout && <Navbar />}
      {children}
      {!hideLayout && <Footer />}
    </>
  );
}

export default LayoutWrapper;