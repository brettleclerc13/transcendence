"use client";

import React, { useState, useEffect, useRef } from "react";
import { fetchUserProfile } from "../utilities/profileActions"
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

interface User {
	id: number;
	username: string;
	email: string;
	profile_picture: string | null;
	is_online: boolean;
}

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
	sender__username?: string;
}

const FriendAndInvitationList: React.FC<{ onSelectFriend: (friend: Friend) => void }> = ({ onSelectFriend }) => {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [invitations, setInvitations] = useState<Friend[]>([]);
	const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
	const [isFriendsTab, setIsFriendsTab] = useState(true);
	const wsRef = useRef<WebSocket | null>(null);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const userProfile = await fetchUserProfile();
				if (userProfile) setCurrentUser(userProfile);

				const friendListResponse = await FetchFriends();
				if (friendListResponse.status === true && Array.isArray(friendListResponse.data)) {
					setFriends(friendListResponse.data);
				} else if (friendListResponse.status === "warning") {
					console.log("Warning:", friendListResponse.message);
					setFriends([]);
				} else if (friendListResponse.status === false) {
					console.log("Error:", friendListResponse.error);
					setFriends([]);
				}

				const invitationListResponse = await FetchInvitations();
				if (invitationListResponse.status === true && Array.isArray(invitationListResponse.data)) {
					setInvitations(invitationListResponse.data);
				} else if (invitationListResponse.status === "warning") {
					console.log("Warning:", invitationListResponse.message);
					setInvitations([]);
				} else if (invitationListResponse.status === false) {
					console.log("Error:", invitationListResponse.error);
					setInvitations([]);
				}

				const blockedList = await FetchBlockedUsers();
				if (blockedList)
					setBlockedUsers(blockedList.map((user: { id: number }) => user.id));
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, []);

	useEffect(() => {
		if (currentUser?.id) {

			wsRef.current = new WebSocket(`ws://127.0.0.1:8001/ws/contacts/${currentUser?.id}/`);
		
			wsRef.current.onmessage = (event) => {
			const data = JSON.parse(event.data);

				if (data.type === "friend_list_update") {
					setFriends(data.friends);
				}
			
				if (data.type === "invitation_list_update") {
					setInvitations(data.invitations);
				}

				if (data.type === "notify_update" && data.update_type === "friend_request") {
					FetchInvitations().then((invitationListResponse) => {
						if (invitationListResponse.status === true && Array.isArray(invitationListResponse.data)) {
							setInvitations(invitationListResponse.data);
						} else {
							setInvitations([]);
						}
					}).catch((error) => {
						console.error("Erreur lors de la mise à jour des invitations :", error);
					});
				}

				if (data.type === "notify_update" && data.update_type === "new_friend") {
					FetchFriends().then((friendsListResponse) => {
						if (friendsListResponse.status === true && Array.isArray(friendsListResponse.data)) {
							setFriends(friendsListResponse.data);
						} else {
							setFriends([]);
						}
					}).catch((error) => {
						console.error("Erreur lors de la mise à jour des amis :", error);
					});
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
		}
	}, [currentUser]);

	const handleAccept = async (id: number) => {
		try {
			await AcceptInvitation(id);
			setInvitations((prevInvitations) => prevInvitations.filter((invite) => invite.id !== id));
		} catch (error) {
			console.error("Erreur lors de l'acceptation de l'invitation :", error);
		}
	};

	const handleDecline = async (id: number) => {
		try {
			await DeclineInvitation(id);
			setInvitations((prevInvitations) => prevInvitations.filter((invite) => invite.id !== id));
		} catch (error) {
			console.error("Erreur lors du refus de l'invitation :", error);
		}
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
