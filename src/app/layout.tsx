import type { Metadata } from "next";
import { AppContextProvider } from "./providers";
import ClientLayout from "./client-layout";
import "../index.css";

export const metadata: Metadata = {
  title: "LostLink • Campus Finder Network",
  description: "Reclaim what is Yours. Return what is Found.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AppContextProvider>
          <ClientLayout>{children}</ClientLayout>
        </AppContextProvider>
      </body>
    </html>
  );
}
