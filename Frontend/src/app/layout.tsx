import type { Metadata } from "next";
import RefreshAccessToken from "@/app/utilities/JWTClientActions";
import "bootstrap/dist/css/bootstrap.min.css";
import BootstrapClient from "@/components/bootstrapClient";
import "./globals.css";

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
				{children}
				<RefreshAccessToken />
				<BootstrapClient />
			</body>
		</html>
	);
}
