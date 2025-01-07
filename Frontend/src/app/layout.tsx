import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/queryProvider";

export const metadata: Metadata = {
  title: "Transcendence",
  description: "A classic ping-pong game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<QueryProvider>{children}</QueryProvider>
			</body>
		</html>
  );
}
