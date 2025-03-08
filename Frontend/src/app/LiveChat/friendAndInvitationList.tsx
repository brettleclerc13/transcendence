"use client";

import React, { useState, useEffect, useRef } from "react";
import {
	FetchFriends,
	FetchInvitations,
	SendFriendRequest,
	AcceptInvitation,
	DeclineInvitation,
} from "../utilities/chatActions";
import {
	FetchBlockedUsers,
	BlockUser,
	UnblockUser,
} from "../utilities/blockActions";
import { data } from "framer-motion/client";

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
	sender__username?: string;
}

const FriendAndInvitationList: React.FC<{ onSelectFriend: (friend: Friend) => void }> = ({ onSelectFriend }) => {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [invitations, setInvitations] = useState<Friend[]>([]);
	const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
	const [isFriendsTab, setIsFriendsTab] = useState(true);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const friendList = await FetchFriends();
				if (friendList && friendList.length === 0) {
					console.log("No friends in the list.");
				}
				else if (friendList) setFriends(friendList || []);

				const invitationList = await FetchInvitations();
				if (invitationList && invitationList.length === 0) {
					console.log("No invitation pending.");
				}
				else if (invitationList) setInvitations(invitationList || []);

				const blockedList = await FetchBlockedUsers();
				if (blockedList)
					setBlockedUsers(blockedList.map((user: { id: number }) => user.id));
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();

		const wsProtocol = window.location.protocol === "https:" ? "wss" : "ws";
		wsRef.current = new WebSocket(`${wsProtocol}://127.0.0.1:8001/ws/contacts/`);

		wsRef.current.onopen = () => console.log("✅ WebSocket ouvert");
		wsRef.current.onerror = (err) => console.error("❌ Erreur WebSocket", err);
		wsRef.current.onclose = (event) => console.warn("⚠️ WebSocket fermé :", event.code, event.reason);

		wsRef.current.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.type === "friend_list_update") {
				setFriends(data.friends);
			}
			if (data.type === "invitation_list_update") {
				setInvitations(data.invitations);
			}
			if (data.action === "blocked") {
				setBlockedUsers((prev) => [...prev, { id: data.user_id, username: data.username || "Unknown", profile_picture: data.profile_picture || null }]);
			} else if (data.action === "unblocked") {
				setBlockedUsers((prev) => prev.filter(user => user.id !== data.user_id));
			}
		};

		return () => {
			wsRef.current?.close();
		};
	}, []);

	const handleAccept = async (id: number) => {
		await AcceptInvitation(id);
	};

	const handleDecline = async (id: number) => {
		await DeclineInvitation(id);
	};

	const handleBlockUser = async (user: Friend) => {
		await BlockUser(user.id);
		setBlockedUsers((prev) => [...prev, user]);
	};

	const handleUnblockUser = async (userId: number) => {
		await UnblockUser(userId);
		setBlockedUsers((prev) => prev.filter((user) => user.id !== userId));
	};

	return (
		<div className="friend-invitation-list">
			<div className="switch-buttons">
				<button onClick={() => setIsFriendsTab(true)} className={isFriendsTab ? "active" : ""}> Friends </button>
				<button onClick={() => setIsFriendsTab(false)} className={!isFriendsTab ? "active" : ""} > Invitations </button>
			</div>
			<div className="friend-list" style={{ overflowY: "scroll", height: "calc(60vh - 50px)", flex: 1 }} >
				<ul className="list-group">
					{isFriendsTab ? (
						friends.length > 0 ? (
							friends.map((friend) => (
								<li key={friend.id} className="list-group-item d-flex align-items-center justify-content-between">
									<div onClick={() => onSelectFriend(friend)} style={{ cursor: "pointer", display: "flex", alignItems: "center"}}>
										<img src={`${friend.profile_picture}` || "/img/default.png"} alt={`${friend.username}'s avatar`} style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10, }} />
										<span>{friend.username}</span>
									</div>
									<button className={`btn ${ blockedUsers.some((user) => user.id === friend.id) ? "btn-danger" : "btn-secondary" }`}
										onClick={() => blockedUsers.some((user) => user.id === friend.id) ? handleUnblockUser(friend.id) : handleBlockUser(friend) } >
											{blockedUsers.some((user) => user.id === friend.id) ? "Unblock": "Block"}
									</button>
								</li>
							))
						) : (
							<li className="list-group-item fst-italic">No friends found</li>
						)
					) : invitations.length > 0 ? (
						invitations.map((invite) => (
							<li key={invite.id} className="list-group-item d-flex align-items-center justify-content-between" >
								<div className="d-flex align-items-center">
									<img src={`${invite.profile_picture}` || "./img/default.png"} alt={`${invite.sender__username}'s avatar`} style={{ width: 40, height: 40, borderRadius: "50%", marginRight: 10 }} />
									<span>{invite.sender__username}</span>
								</div>
								<div>
									<button className="btn btn-success me-2" onClick={() => handleAccept(invite.id)} >
										O
									</button>
									<button className="btn btn-danger" onClick={() => handleDecline(invite.id)} >
										X
									</button>
								</div>
							</li>
						))
					) : (
						<li className="list-group-item fst-italic">
							No pending invitations
						</li>
					)}
				</ul>
			</div>
		</div>
	);
};

export default FriendAndInvitationList;
