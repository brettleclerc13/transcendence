"use client";

import dynamic from 'next/dynamic';

const Menu = dynamic(() => import('./menu'), {
  ssr: false, // disable server-side rendering for this component
});

export default function ClientMenuComponent( { section } : { section : string } ) {
	return (
		<Menu section={section} />
	);
}
