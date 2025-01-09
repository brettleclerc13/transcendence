import Hero from "../Hero/hero";
import HeaderComponent from "../Header/headerComponent";
import LoginForm from "@/components/loginForm";
import RegisterForm from "@/components/registerForm";
import AboutUsLayer from "../AboutUs/aboutUs";
import Profile from "../Profile/profile";
import Game from "../Game/game";
import { redirect } from "next/navigation";


export default async function SectionPage(props: { params: Promise<{ section: string }> }) {
    const  existingSections = ["home", "play", "aboutUs", "login", "register", "profile", "menu"];
	
	const params = await props.params;
    let section = await Promise.resolve(params.section);

	if (!existingSections.includes(section))
		redirect("/");

    return (
		<div className="app-container">
			<HeaderComponent section={section || "home"} />
			{section === "home" && <Hero />}
			{section === "play" && <Game />}
			{section === "aboutUs" && <AboutUsLayer />}
			{section === "login" && <LoginForm />}
			{section === "register" && <RegisterForm />}
			{section === "profile" && <Profile />}
		</div>
	);
}
