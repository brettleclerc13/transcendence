'use client'

import { useState, useEffect } from "react";

export default function Title () {
	const [displayedText, setDisplayedText] = useState('');
	const [showCursor, setShowCursor] = useState(true);
	const fullText = "ft_transcendence";
	const typingSpeed = 150;
	let cursorBlinkSpeed = 500;

	useEffect(() => {
		let index = 0;

		const intervalId = setInterval(() => {
			if (index <= fullText.length) {
				setDisplayedText(fullText.slice(0, index + 1));
        		index++;
			} else {
				clearInterval(intervalId);
			}
		}, typingSpeed);

		return () => clearInterval(intervalId);
	}, []);
	
	useEffect(() => {
		if (showCursor) {}
		const blinkInterval = setInterval(() => {
			setShowCursor(prev => !prev);
		}, cursorBlinkSpeed);

		return () => clearInterval(blinkInterval);
	}, []);

	return (
		<h1 className="text-5xl text-white font-mono">
			{displayedText}
			{showCursor && <span className="inline-block w-1 h-9 bg-white animate-pulse" />}
		</h1>
	)
}

// 'use client'

// import { useState, useEffect } from "react";

// export default function Title() {
//   const [displayedText, setDisplayedText] = useState('');
//   const [isWriting, setIsWriting] = useState(true); // Suivre l'état d'écriture
//   const fullText = "ft_transcendence";
//   const typingSpeed = 100;
//   const cursorBlinkSpeed = 500; // Vitesse de clignotement du curseur

//   useEffect(() => {
//     let index = 0;

//     const intervalId = setInterval(() => {
//       if (index < fullText.length) {
//         setDisplayedText(fullText.slice(0, index + 1)); // Affiche le texte au fur et à mesure
//         index++;
//       } else {
//         clearInterval(intervalId); // Arrête l'écriture
//         setIsWriting(false); // L'écriture est terminée, on déclenche le clignotement
//       }
//     }, typingSpeed);

//     return () => clearInterval(intervalId); // Nettoyage
//   }, []);

//   useEffect(() => {
//     let blinkInterval: NodeJS.Timeout;

//     if (!isWriting) { // Démarre le clignotement après l'écriture
//       blinkInterval = setInterval(() => {
//         setDisplayedText(prev => prev.endsWith('|') ? prev.slice(0, -1) : prev + '|'); // Ajoute ou retire le curseur "|"
//       }, cursorBlinkSpeed);
//     } else {
//       setDisplayedText(prev => prev + '|'); // Affiche constamment la barre pendant l'écriture
//     }

//     return () => clearInterval(blinkInterval); // Nettoyage du clignotement
//   }, [isWriting]); // Se déclenche lorsque l'écriture est terminée

//   return (
//     <h1 className="text-5xl text-white relative">
//       {displayedText}
//     </h1>
//   );
// }