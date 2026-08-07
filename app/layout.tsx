/Users/bow/.zprofile:11: no such file or directory: /usr/local/bin/brew
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "粤考上岸计划",
  description: "广东省公务员考试错题消化与常识抽卡工具",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "粤考上岸",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8faf9",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
