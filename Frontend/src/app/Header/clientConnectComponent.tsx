"use client";

import dynamic from "next/dynamic";

const HeaderConnectButtons = dynamic(() => import("./headerConnectButtons"), {
	ssr: false, // disable server-side rendering for this component
});

export default function ClientConnectComponent() {
	return <HeaderConnectButtons />;
}
