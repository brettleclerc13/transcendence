'use client'

import { useState, useEffect } from "react";
import Hero from "./Hero/hero";
import Header from "./header";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";
import AboutUsLayer from "./AboutUs/aboutUs";
import Game from "./Game/game"

export default function Home() {
	const [currentSection, setCurrentSection] = useState('home');

	const goToSection = (section:string) => {
		setCurrentSection(section);
		window.history.pushState({ layer: section }, section.charAt(0).toUpperCase() + section.slice(1), `#${section}`);
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
			<Header goToSection={goToSection}/>
			
			{currentSection == 'home' && (
				<Hero goToGame={() => goToSection('game')}/>
			)}
			
			{currentSection == 'game' && (
				<Game onBackClick={() => goToSection('home')}/>
			)}
			
			{currentSection == 'aboutUs' && (
				<AboutUsLayer onBackClick={() => goToSection('home')}/>
			)}
			
			{currentSection == 'login' && (
				<LoginForm onBackClick={() => goToSection('home')} onFormSwitch={() => goToSection('register')}/>
			)}
			
			{currentSection == 'register' && (
				<RegisterForm onBackClick={() => goToSection('home')} onFormSwitch={() => goToSection('login')}/>
			)}
		</div>
  	);
}
