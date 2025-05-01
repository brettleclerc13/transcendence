/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: {},
	},
	allowedDevOrigins: process.env.NEXT_PUBLIC_WS_HOST
		? [
				`http://${process.env.NEXT_PUBLIC_WS_HOST}:${process.env.NEXT_PUBLIC_WS_PORT}`,
			]
		: [],
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
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "127.0.0.1",
				port: process.env.NEXT_PUBLIC_WS_PORT,
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
