import Hero from "./Hero/hero";
import HeaderComponent from "./Header/headerComponent";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";
import AboutUsLayer from "./AboutUs/aboutUs";
import Game from "./Game/game";
import { MenuProps } from "./types";
import "./page.css"
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

export default function Home({ searchParams } : {
	searchParams: { [key: string] : string | string [] | undefined };
}) {
	const selectedSection = (searchParams.section || 'home') as string;

	//const HeaderComponent = dynamic(import('./Header/headerComponent'), {ssr : false});

	return (
		<div className="app-container">
			<HeaderComponent section={selectedSection} />
			{selectedSection === 'home' && <Hero />}
			{selectedSection === 'game' && <Game />}
			{selectedSection === 'aboutUs' && <AboutUsLayer />}
			{selectedSection === 'login' && <LoginForm />}
			{selectedSection === 'register' && <RegisterForm />}
		</div>
  	);
}
