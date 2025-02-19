import "./liveChat.css";
import LiveChatClient from "./liveChatClient";

export default function LiveChat() {
	return (
		<div className="livechat-main">
			<h1>
				<span style={{ color: "#fff" }}>LIVE</span>
				<span style={{ color: "#319795" }}>CHAT</span>
			</h1>
			<LiveChatClient />
		</div>
	);
}
