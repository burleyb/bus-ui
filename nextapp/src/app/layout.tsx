'use client'
import { Inter } from "next/font/google";
import "./globals.css";
import { DataProvider } from "@/context/DataContext";
import { AuthProvider } from "@/context/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import Layout from "@/components/layout/Layout";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Create a client in the component to ensure it's created on the client side
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        staleTime: 1000 * 60 * 5, // 5 minutes
      },
    },
  }));

  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <Layout>{children}</Layout>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
