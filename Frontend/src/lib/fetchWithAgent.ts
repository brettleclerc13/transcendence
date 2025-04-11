import { httpsAgent } from "./httpsAgent";

export async function fetchWithAgent(url:string, options: RequestInit = {}) {
    const nodeFetch = fetch as unknown as (url: string, init: RequestInit & {agent?: any}) => Promise<Response>;
    return nodeFetch(url, {
        ...options,
        agent: httpsAgent,
    });
}