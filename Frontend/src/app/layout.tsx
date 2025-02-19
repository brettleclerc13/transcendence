import type { Metadata } from "next";
import { AuthProvider } from "@/app/utilities/JWTActions";
import "bootstrap/dist/css/bootstrap.min.css";
import BootstrapClient from "@/components/bootstrapClient";
import "./globals.css";
import { Bungee_Shade } from "next/font/google";

const bungee_shade = Bungee_Shade({
	weight: "400",
	style: ["normal"],
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Transcendence",
	description: "A classic ping-pong game",
	other: {
		link: "https://fonts.googleapis.com/css2?family=Bungee+Shade&display=swap",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body>
				<AuthProvider>
					{children}
					<BootstrapClient />
				</AuthProvider>
			</body>
		</html>
	);
}
