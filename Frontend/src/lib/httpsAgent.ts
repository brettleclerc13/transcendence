// This file provides HTTPS agent functionality with conditional imports
// to support both Node.js and Edge Runtime environments

// Check if we're in a Node.js environment that's not Edge Runtime
// Using a safer approach to detect Edge Runtime
const isNode =
	typeof process !== "undefined" &&
	process.versions != null &&
	process.versions.node != null &&
	!(typeof globalThis !== "undefined" && "EdgeRuntime" in globalThis);

// For Node.js environments only, using a safer approach with dynamic imports
export const httpsAgent = isNode
	? (() => {
			try {
				// Dynamic imports to avoid Edge Runtime errors
				// Using a safer approach that won't break in Edge Runtime
				const https = require("https");
				const fs = require("fs");

				return new https.Agent({
					rejectUnauthorized: true,
					ca: fs.readFileSync("/etc/nginx/ssl/transcendence.pem"),
				});
			} catch (error) {
				console.warn("HTTPS Agent creation failed:", error);
				return null;
			}
		})()
	: null; // null for Edge Runtime
