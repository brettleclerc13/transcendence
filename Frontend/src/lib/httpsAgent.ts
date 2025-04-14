// This file provides HTTPS agent functionality with conditional imports
// to support both Node.js and Edge Runtime environments

// Check if we're in a Node.js environment that's not Edge Runtime
// Using a safer approach to detect Edge Runtime
export let httpsAgent: import("https").Agent | null = null;

const isNode =
	typeof process !== "undefined" &&
	process.versions != null &&
	process.versions.node != null &&
	!(typeof globalThis !== "undefined" && "EdgeRuntime" in globalThis);

if (isNode) {
	(async () => {
		try {
			const https = await import("https");
			const fs = await import("fs/promises");

			const ca = await fs.readFile("/etc/nginx/ssl/transcendence.pem");

			httpsAgent = new https.Agent({
				rejectUnauthorized: true,
				ca,
			});
		} catch (error) {
			console.warn("HTTPS Agent creation failed:", error);
			httpsAgent = null;
		}
	})();
}
