"use client";

import React, { useState, useEffect } from "react";
import {
	FetchFriends,
	FetchInvitations,
	AcceptInvitation,
	DeclineInvitation,
} from "../utilities/chatActions";
import {
	FetchBlockedUsers,
	BlockUser,
	UnblockUser,
} from "../utilities/blockActions";

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
	sender__username?: string;
}

const FriendAndInvitationList: React.FC<{
	onSelectFriend: (friend: Friend) => void;
}> = ({ onSelectFriend }) => {
	const [friends, setFriends] = useState<Friend[]>([]);
	const [invitations, setInvitations] = useState<Friend[]>([]);
	const [blockedUsers, setBlockedUsers] = useState<Friend[]>([]);
	const [isFriendsTab, setIsFriendsTab] = useState(true);

	useEffect(() => {
		const fetchData = async () => {
			try {
				const friendList = await FetchFriends();
				if (friendList) setFriends(friendList);

				const invitationList = await FetchInvitations();
				if (invitationList) setInvitations(invitationList);

				const blockedList = await FetchBlockedUsers();
				if (blockedList)
					setBlockedUsers(blockedList.map((user: { id: number }) => user.id));
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, []);

	const handleAccept = async (id: number) => {
		try {
			await AcceptInvitation(id);
			setInvitations((prevInvites) =>
				prevInvites.filter((invite) => invite.id !== id)
			);
		} catch (error) {
			console.error("Error accepting invitation:", error);
		}
	};

	const handleDecline = async (id: number) => {
		try {
			await DeclineInvitation(id);
			setInvitations((prevInvites) =>
				prevInvites.filter((invite) => invite.id !== id)
			);
		} catch (error) {
			console.error("Error declining invitation:", error);
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
				<button
					onClick={() => setIsFriendsTab(true)}
					className={isFriendsTab ? "active" : ""}
				>
					Friends
				</button>
				<button
					onClick={() => setIsFriendsTab(false)}
					className={!isFriendsTab ? "active" : ""}
				>
					Invitations
				</button>
			</div>
			<div
				className="friend-list"
				style={{ overflowY: "scroll", height: "calc(60vh - 50px)", flex: 1 }}
			>
				<ul className="list-group">
					{isFriendsTab ? (
						friends.length > 0 ? (
							friends.map((friend) => (
								<li
									key={friend.id}
									className="list-group-item d-flex align-items-center justify-content-between"
								>
									<div
										onClick={() => onSelectFriend(friend)}
										style={{
											cursor: "pointer",
											display: "flex",
											alignItems: "center",
										}}
									>
										<img
											src={friend.profile_picture || "./img/default.png"}
											alt={`${friend.username}'s avatar`}
											style={{
												width: 40,
												height: 40,
												borderRadius: "50%",
												marginRight: 10,
											}}
										/>
										<span>{friend.username}</span>
									</div>
									<button
										className={`btn ${
											blockedUsers.some((user) => user.id === friend.id)
												? "btn-danger"
												: "btn-secondary"
										}`}
										onClick={() =>
											blockedUsers.some((user) => user.id === friend.id)
												? handleUnblockUser(friend.id)
												: handleBlockUser(friend)
										}
									>
										{blockedUsers.some((user) => user.id === friend.id)
											? "Unblock"
											: "Block"}
									</button>
								</li>
							))
						) : (
							<li className="list-group-item fst-italic">No friends found</li>
						)
					) : invitations.length > 0 ? (
						invitations.map((invite) => (
							<li
								key={invite.id}
								className="list-group-item d-flex align-items-center justify-content-between"
							>
								<div className="d-flex align-items-center">
									<img
										src={invite.profile_picture || "./img/default.png"}
										alt={`${invite.sender__username}'s avatar`}
										style={{
											width: 40,
											height: 40,
											borderRadius: "50%",
											marginRight: 10,
										}}
									/>
									<span>{invite.sender__username}</span>
								</div>
								<div>
									<button
										className="btn btn-success me-2"
										onClick={() => handleAccept(invite.id)}
									>
										O
									</button>
									<button
										className="btn btn-danger"
										onClick={() => handleDecline(invite.id)}
									>
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
