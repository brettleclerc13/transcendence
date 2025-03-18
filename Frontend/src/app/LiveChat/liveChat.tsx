import "./liveChat.css";
import ClientChatComponents from "./clientChatComponents";

export default function LiveChat() {
	return (
		<div className="livechat-main">
			<h1>
				<span style={{ color: "#fff" }}>LIVE</span>
				<span style={{ color: "#319795" }}>CHAT</span>
			</h1>
			<ClientChatComponents />
		</div>
	);
}
