import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Media Pulse | Audio & Video Intelligence",
  description: "Best Practices für Audio und Video im digitalen Mediengeschäft",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
