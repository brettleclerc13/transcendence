import HeaderComponent from "../Header/headerComponent";
import LoginForm from "@/app/User/loginForm";
import RegisterForm from "@/app/User/registerForm";
import AboutUsLayer from "../AboutUs/aboutUs";
import LiveChat from "../LiveChat/liveChat";
import Lobby from "../Game/lobby";
import { redirect } from "next/navigation";
import HeroWrapper from "../Hero/heroWrapper";

export default async function SectionPage(props: {
	params: Promise<{ section: string }>;
}) {
	const existingSections = [
		"",
		"lobby",
		"aboutUs",
		"login",
		"register",
		"menu",
		"liveChat",
	];

	const params = await props.params;
	const section = await Promise.resolve(params.section);

	if (!existingSections.includes(section)) redirect("/");

	return (
		<>
			<div className="app-container">
				<HeaderComponent />
				{section === "" && <HeroWrapper />}
				{section === "lobby" && <Lobby />}
				{section === "aboutUs" && <AboutUsLayer />}
				{section === "login" && <LoginForm />}
				{section === "register" && <RegisterForm />}
				{section === "liveChat" && <LiveChat />}
			</div>
		</>
	);
}
