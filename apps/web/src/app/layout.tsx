import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const themeInitScript = `
  (function () {
    try {
      var savedTheme = window.localStorage.getItem("dramatv-theme-mode");
      var theme = savedTheme === "light" ? "light" : "dark";
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "dark";
    }
  })();
`;

export const metadata: Metadata = {
  title: "DramaTV 社区",
  description: "面向 AI 视频创作与工作流分享的社区。",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link href="https://d8j0ntlcm91z4.cloudfront.net" rel="dns-prefetch" />
        <link crossOrigin="" href="https://d8j0ntlcm91z4.cloudfront.net" rel="preconnect" />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
