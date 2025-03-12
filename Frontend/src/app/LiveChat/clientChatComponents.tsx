"use client";

import dynamic from "next/dynamic";

const LiveChatClient = dynamic(() => import("./liveChatClient"), {
	ssr: false, // disable server-side rendering for this component
});

export default function ClientConnectComponent() {
	return <LiveChatClient />;
}
