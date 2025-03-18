import Hero from "./Hero/hero";
import HeaderComponent from "./Header/headerComponent";
import "./page.css";

export default async function Home() {
	return (
		<div className="app-container">
			<HeaderComponent />
			<Hero />
		</div>
	);
}
