import { httpsAgent } from "./httpsAgent";

export async function fetchWithAgent(url: string, options: RequestInit = {}) {
	try {
		// Check if we're in a Node.js environment where httpsAgent is available
		if (httpsAgent) {
			// For Node.js environments
			const nodeFetch = fetch as unknown as (
				url: string,
				init: RequestInit & { agent?: import("https").Agent },
			) => Promise<Response>;

			return nodeFetch(url, {
				...options,
				agent: httpsAgent,
			});
		} else {
			// For Edge Runtime or browser environments
			return fetch(url, options);
		}
	} catch (error) {
		// Fallback to regular fetch if there's any issue with the agent
		console.warn(
			"Error using httpsAgent, falling back to regular fetch:",
			error,
		);
		return fetch(url, options);
	}
}
