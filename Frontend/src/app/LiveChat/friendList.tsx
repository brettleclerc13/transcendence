// 'use client'

// import React from "react";
// import { useState, useEffect } from "react";
// import { FetchFriends } from "../utilities/chatActions";

// interface Friend {
//     id: number;
//     username: string;
//     profile_picture: string | null;
// }

// interface FriendListProps {
// 	onSelectFriend: (friend: Friend) => void;
// }

// const FriendList: React.FC<FriendListProps> = ({ onSelectFriend }) => {
// 	const [friends, setFriends] = useState<Friend[]>([]);

// 	useEffect(() => {
// 		const fetchFriendsList = async () => {
//             try {
//                 const friendList = await FetchFriends();
//                 if (friendList)
//                     setFriends(friendList);

//             } catch (error) {
//                 console.error("Error while fetching user's friend list: ", error);
//             }
//         }
//         fetchFriendsList();
// 	}, []);

// 	return (
// 		<div className="friend-list" style={{ overflowY: 'scroll', height: 'calc(100vh - 50px)', flex: 1 }}>
// 			<ul className="list-group">
// 				{friends.length > 0 ? (
// 					friends.map((friend) => (
// 						<li
// 							key={friend.id}
// 							className="list-group-item d-flex align-items-center"
// 							style={{ cursor: "pointer" }}
// 							onClick={() => onSelectFriend(friend)}
// 						>
// 							<img
// 								src={friend.profile_picture || "./img/default.png"}
// 								alt={`${friend.username}'s avatar`}
// 								style={{ width: 40, height: 40, borderRadius: '50%', marginRight: 10 }}
// 							/>
// 							<span>{friend.username}</span>
// 						</li>
// 					))
// 				) : (
// 					<li className="list-group-item fst-italic">No friends found</li>
// 				)}
// 			</ul>
// 		</div>
// 	);
// }

// export default FriendList;
