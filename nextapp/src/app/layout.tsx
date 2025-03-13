import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./styles.css"; // Import AG Grid styles
import { AppProvider } from '@/context/AppContext';
import { DialogProvider } from '@/context/DialogContext';
import { InitProvider } from '@/context/InitContext';
import { AuthProvider } from '@/context/AuthContext';
import { ApiProvider } from '@/context/ApiContext';
import { ToastProvider } from '@/components/ui/toast';
import NodeSettingsDialog from '@/components/dialogs/NodeSettingsDialog';
import EventReplayDialog from '@/components/dialogs/EventReplayDialog';
import { ThemeProvider } from '@/components/ui/theme-provider';

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
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <InitProvider>
          <AuthProvider>
            <AppProvider>
              <ApiProvider>
                <DialogProvider>
                  <ThemeProvider>
                    {children}
                    <ToastProvider>
                      <NodeSettingsDialog />
                      <EventReplayDialog />
                    </ToastProvider>
                  </ThemeProvider>
                </DialogProvider>
              </ApiProvider>
            </AppProvider>
          </AuthProvider>
        </InitProvider>
      </body>
    </html>
  );
}
