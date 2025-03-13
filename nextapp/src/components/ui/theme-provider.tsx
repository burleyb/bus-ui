"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

export function ThemeProvider({ 
  children, 
  ...props 
}: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);
  
  // After mounting, we can render the children
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // This ensures we only render the provider client-side to avoid hydration mismatch
  return (
    <NextThemesProvider {...props} enableSystem={true} attribute="class">
      {/* Use div with suppressHydrationWarning to prevent the error */}
      <div suppressHydrationWarning>
        {mounted ? children : <div style={{ visibility: 'hidden' }}>{children}</div>}
      </div>
    </NextThemesProvider>
  );
} 