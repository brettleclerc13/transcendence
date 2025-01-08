import Hero from "./Hero/hero";
import HeaderComponent from "./Header/headerComponent";
import "./page.css";
import { redirect } from "next/navigation";

export default async function Home() {

    return (
		<div className="app-container">
			<HeaderComponent section="" />
			<Hero />
		</div>
  	);
}
