import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./globals.css";
import { AppProvider } from '@/context/AppContext';
import { DialogProvider } from '@/context/DialogContext';
import { InitProvider } from '@/context/InitContext';
import { AuthProvider } from '@/context/AuthContext';
import { ApiProvider } from '@/context/ApiContext';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Event Bus UI",
  description: "Management interface for the Event Bus system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <InitProvider>
          <AuthProvider>
            <AppProvider>
              <ApiProvider>
                <DialogProvider>
                  {children}
                </DialogProvider>
              </ApiProvider>
            </AppProvider>
          </AuthProvider>
        </InitProvider>
      </body>
    </html>
  );
}
