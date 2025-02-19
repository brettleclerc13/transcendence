import "./headerComponent.css";
import ClientConnectComponent from "./clientConnectComponent";
import ClientMenuComponent from "./clientMenuComponent";

export default function HeaderComponent() {
	return (
		<header>
			<ClientMenuComponent />
			<h1 className="header-title">DISCO PONG !</h1>
			<ClientConnectComponent />
		</header>
	);
}
