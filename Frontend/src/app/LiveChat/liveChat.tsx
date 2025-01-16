import "./liveChat.css"
import SearchBar from "./searchBar"
import ConvList from "./convList"
import MessageBar from "./messageBar"
import ProfileButton from "./profileButton"
import InviteToGameButton from "./inviteToGameButton"

export default function liveChat() {
    return (
        <div className="livechat-container">
            <div className="search-bar">
                <SearchBar/>
            </div>
            {/* <div className="conv-list">
                <ConvList/>
            </div>
            <div className="current-chat">
                <MessageBar/>
                <ProfileButton/>
                <InviteToGameButton/>
            </div> */}
        </div>
    );
}
