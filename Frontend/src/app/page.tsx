import HeaderComponent from "./Header/headerComponent";
import "./page.css";
import HeroWrapper from "./Hero/heroWrapper";

export default async function Home() {
	return (
		<div className="app-container">
			<HeaderComponent />
			<HeroWrapper />
		</div>
	);
}
