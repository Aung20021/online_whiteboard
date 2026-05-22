import { Inter } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/providers/modal-provider";
import { Loading } from "@/components/auth/loading";
import { SupabaseAuthProvider } from "@/providers/supabase-auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Online Whiteboard",
  description: "Collaborative whiteboard using Supabase and Liveblocks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Suspense fallback={<Loading />}>
          <SupabaseAuthProvider>
            <Toaster />
            <ModalProvider />
            {children}
          </SupabaseAuthProvider>
        </Suspense>
      </body>
    </html>
  );
}
