"use client";

import dynamic from 'next/dynamic';

const ActionButtons = dynamic(() => import('./actionButtons'), {
  ssr: false, // disable server-side rendering for this component
});

export default function ClientConnectComponent() {
	return (
		<ActionButtons />
	);
}
