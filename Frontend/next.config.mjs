/** @type {import('next').NextConfig} */
const nextConfig = {
	experimental: {
		serverActions: true,
	},
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [{ key: "X-Forwarded-Host", value: "transcendence.fr:8080" }],
			},
		];
	},
};

export default nextConfig;
