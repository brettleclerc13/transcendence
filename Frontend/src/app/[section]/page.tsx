import Hero from "../Hero/hero";
import HeaderComponent from "../Header/headerComponent";
import LoginForm from "@/app/User/loginForm";
import RegisterForm from "@/app/User/registerForm";
import AboutUsLayer from "../AboutUs/aboutUs";
import Profile from "../Profile/profile";
import Game from "../Game/game";
import LiveChat from "../LiveChat/liveChat";
import { redirect } from "next/navigation";


export default async function SectionPage(props: { params: Promise<{ section: string }> }) {
    const  existingSections = ["", "play", "aboutUs", "login", "register", "profile", "menu", "liveChat"];
	
	const params = await props.params;
    let section = await Promise.resolve(params.section);

	if (!existingSections.includes(section))
		redirect("/");

    return (
		<div className="app-container">
			<HeaderComponent section={section || "home"} />
			{section === "" && <Hero />}
			{section === "play" && <Game />}
			{section === "aboutUs" && <AboutUsLayer />}
			{section === "login" && <LoginForm />}
			{section === "register" && <RegisterForm />}
			{section === "profile" && <Profile />}
			{section === "liveChat" && <LiveChat />}
		</div>
	);
}
