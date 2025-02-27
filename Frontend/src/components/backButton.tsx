import { useRef, useEffect, useCallback } from "react";

export default function BackButton({ onReappear }: { onReappear: () => void }) {
	const buttonRef = useRef<HTMLButtonElement>(null);

	const handleClick = useCallback(() => {
		console.log("Back button clicked!");
		onReappear();
	}, [onReappear]);

	const generateBackButton = useCallback(() => {
		if (buttonRef.current) {
			const svgHome = `
			<svg class="h-6 w-6 text-slate-100 inline-block mr-2" width="24" height="24" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
			<path stroke="none" d="M0 0h24v24H0z"/>  <polyline points="5 12 3 12 12 3 21 12 19 12" />
			<path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-7" />
			<path d="M9 21v-6a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v6" />
			</svg>
			`;

			const buttonText = `<span class="align-middle">Home</span>`;

			buttonRef.current.innerHTML = svgHome + buttonText;
			buttonRef.current.className =
				"text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2";
			buttonRef.current.addEventListener("click", handleClick, true);
		}
	}, [handleClick]);

	useEffect(() => {
		generateBackButton();
	}, [generateBackButton]);

	return <button ref={buttonRef} />;
}
