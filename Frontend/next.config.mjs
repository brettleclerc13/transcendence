/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {},
	},
	allowedDevOrigins: [process.env.NEXT_PUBLIC_WS_HOST],
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Forwarded-Host",
						value: `${process.env.NEXT_PUBLIC_WS_HOST}:${process.env.NEXT_PUBLIC_WS_PORT}`,
					},
				],
			},
		];
	},
};

export default nextConfig;
