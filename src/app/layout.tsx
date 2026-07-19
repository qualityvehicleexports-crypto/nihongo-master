import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ニホンゴマスター | Nihongo Master",
  description: "N5からN1まで、AIが進捗を分析する日本語学習アプリ。1アカウントで最大20人まで受講可能。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
