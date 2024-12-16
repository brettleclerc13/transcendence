import Hero from "./Hero/hero";
import HeaderComponent from "./Header/headerComponent";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";
import AboutUsLayer from "./AboutUs/aboutUs";
import Profile from "./Profile/profile";
import dynamic from "next/dynamic";
import Game from "./Game/game";
import "./page.css"

export default function Home({ searchParams } : {
	searchParams: { [key: string] : string | string [] | undefined };
}) {
	const selectedSection = (searchParams.section || 'home') as string;

	const Profile = dynamic(import('./Profile/profile'), {ssr : false});

	return (
		<div className="app-container">
			<HeaderComponent section={selectedSection} />
			{selectedSection === 'home' && <Hero />}
			{selectedSection === 'game' && <Game />}
			{selectedSection === 'aboutUs' && <AboutUsLayer />}
			{selectedSection === 'login' && <LoginForm />}
			{selectedSection === 'register' && <RegisterForm />}
			{selectedSection === 'profile' && <Profile />}
		</div>
  	);
}
