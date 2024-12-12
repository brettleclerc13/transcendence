import "./headerComponent.css";
import Link from "next/link";
//import { Button } from "bootstrap";
import ActionButtons from "./actionButtons";
 
//import "bootstrap/dist/css/bootstrap.min.css";
//import "bootstrap/dist/js/bootstrap.bundle.min.js";

//import { MenuProps } from "../types";

export default function HeaderComponent( { section } : { section : string } ) {

	return (
		<header>
			<Link href="?section=menu" className="menu-button">
				&#9776; {/* Icône de menu burger */}
			</Link>

			{section === "menu" && (
				<div className="menu-container">
					<Link href={"?section=home"} className="menu-button">Home</Link>
					<Link href={"?section=game"} className="menu-button">Game</Link>
					<Link href={"?section=aboutUs"} className="menu-button">About Us</Link>
				</div>
			)}
			<h1 className="header-title">DISCO PONG !</h1>
			<div className="action-buttons">
				<ActionButtons />
			</div>
		</header>
	);
}
