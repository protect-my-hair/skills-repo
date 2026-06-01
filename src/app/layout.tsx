import type { Metadata } from "next";

import "./globals.css";
import { AuthSessionProvider } from "@/components/AuthSessionProvider";
import { PRODUCT_NAME } from "@/lib/ui-copy";

export const metadata: Metadata = {
  title: PRODUCT_NAME,
  description: "公司内部 Skills 管理平台 MVP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
