import "./headerComponent.css";
import Link from "next/link";
import ClientConnectComponent from "./clientConnectComponent";
import ClientMenuComponent from "./clientMenuComponent";
 
//import "bootstrap/dist/css/bootstrap.min.css";
//import "bootstrap/dist/js/bootstrap.bundle.min.js";

//import { MenuProps } from "../types";

export default function HeaderComponent( { section } : { section : string } ) {

	return (
		<header>
			<ClientMenuComponent section={section} />
			<h1 className="header-title">DISCO PONG !</h1>
			<ClientConnectComponent />
		</header>
	);
}
