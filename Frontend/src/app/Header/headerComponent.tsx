import "./headerComponent.css";
import Link from "next/link";
import ClientConnectComponent from "./clientConnectComponent";
import ClientMenuComponent from "./clientMenuComponent";

export default function HeaderComponent( { section } : { section : string } ) {

	return (
		<header>
			<ClientMenuComponent />
			<h1 className="header-title">DISCO PONG !</h1>
			<ClientConnectComponent />
		</header>
	);
}
