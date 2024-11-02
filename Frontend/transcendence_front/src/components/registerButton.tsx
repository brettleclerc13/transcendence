import { useRef, useEffect } from "react";

export default function RegisterButton() {
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		generateRegisterButton();
	}, []);

	function generateRegisterButton() {
		if (buttonRef.current) {

			const buttonText = `<span class="align-middle">Sign Up</span>`;

			buttonRef.current.innerHTML = buttonText;
			buttonRef.current.className = "text-white bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-teal-300 dark:focus:ring-teal-800 shadow-lg shadow-teal-500/50 dark:shadow-lg dark:shadow-teal-800/80 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2";
			buttonRef.current.addEventListener("click", handleClick, true)
		}
	};

	const handleClick = () => {
		console.log("Register button clicked!");
		
	};

	return <button ref={buttonRef} />;
}