'use client'

import { useState, useEffect } from "react";
import Hero from "./Hero/hero";
import HeaderComponent from "./Header/headerComponent";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";
import AboutUsLayer from "./AboutUs/aboutUs";
import Game from "./Game/game"

export default function Home() {
	const [currentSection, setCurrentSection] = useState('home');

	const [isLoggedIn, setIsLoggedIn] = useState(false);
  	const [userProfile, setUserProfile] = useState<{ name: string; profilePicture: string; status: "Disponible" | "Invisible" } | null>(null);

	const goToSection = (section:string) => {
		setCurrentSection(section);
		window.history.pushState({ layer: section }, section.charAt(0).toUpperCase() + section.slice(1), `#${section}`);
	};

	const handleLoginSuccess = (userData: any) => {
		setIsLoggedIn(true);
		setUserProfile({
		  name: userData.name,
		  profilePicture: userData.profilePicture || "./img/default.png",
		  status: "Disponible",
		});
		goToSection("home");
	};

	useEffect(() => {
		const handlePopState = (event: PopStateEvent) => {
			const state = event.state || {layer: 'home' };

			switch (state.layer) {
				case 'login':
					setCurrentSection('login');
				break;
				case 'register':
					setCurrentSection('register');
				break;
				case 'aboutUs':
					setCurrentSection('aboutUs');
				break;
				case 'game':
					setCurrentSection('game');
				break;
				case 'home':
				default:
					setCurrentSection('home');
				break;
			}
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
		window.removeEventListener('popstate', handlePopState);
		};
	}, []);

	return (
		<div className="relative h-screen flex justify-center items-center bg-teal-600">
			<HeaderComponent goToSection={goToSection} isLoggedIn={isLoggedIn} userProfile={userProfile || undefined} />
			
			{currentSection == 'home' &&
				<Hero goToGame={() => goToSection('game')}/>
			}
			
			{currentSection == 'game' && 
				<Game onBackClick={() => goToSection('home')}/>
			}
			
			{currentSection == 'aboutUs' && 
				<AboutUsLayer onBackClick={() => goToSection('home')}/>
			}
			
			{currentSection == 'login' && (
				<LoginForm onBackClick={() => goToSection('home')} onFormSwitch={() => goToSection('register')} onLoginSuccess={handleLoginSuccess}/>
			)}
			
			{currentSection == 'register' && (
				<RegisterForm onBackClick={() => goToSection('home')} onFormSwitch={() => goToSection('login')}/>
			)}
		</div>
  	);
}
