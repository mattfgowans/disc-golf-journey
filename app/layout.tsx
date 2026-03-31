import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Disc Golf Journey",
  description: "Track your progress",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
