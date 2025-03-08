"use client";

import React, { useState, useEffect, useRef } from "react";
import "./liveChat.css";
import FriendAndInvitationList from "./friendAndInvitationList";
import CurrentChat from "./currentChat";
import MessageBar from "./messageBar";
import SearchBar from "./searchBar";

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
}

interface Message {
	sender: number;
	conversation_id: number;
	text: string;
	timestamp: string;
	senderPicture: string | null;
}

const LiveChatClient = () => {
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
	const [currentUser, setCurrentUser] = useState<User | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	// const [loading, setLoading] = useState<boolean>(false);
	// const [viewMode, setViewMode] = useState<"friends" | "invitations">(
		// "friends"
	// );
	const [socket, setSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const response = await fetch("/api/profile/", {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) {
					console.error(
						"Erreur lors de la récupération de l'utilisateur :",
						response.statusText
					);
					return;
				}
				const data = await response.json();
				setCurrentUser(data);
			} catch (error) {
				console.error(
					"Erreur réseau lors de la récupération de l'utilisateur :",
					error
				);
			}
		};

		fetchCurrentUser();
	}, []);

	// const handleSendMessage = async (text: string) => {
	// 	if (!selectedFriend || !currentUser) return;

	// 	const accessToken = localStorage.getItem("accessToken");
	// 	if (!accessToken) {
	// 		console.warn(
	// 			"Aucun token d'accès trouvé. L'utilisateur est peut-être déconnecté."
	// 		);
	// 		return;
	// 	}

	// 	try {
	// 		const blockedUsersResponse = await fetch(`/api/blocked-users/`, {
	// 			method: "GET",
	// 			headers: {
	// 				Authorization: `Bearer ${accessToken}`,
	// 			},
	// 		});

	// 		if (!blockedUsersResponse.ok) {
	// 			console.error(
	// 				"Erreur lors de la vérification des utilisateurs bloqués"
	// 			);
	// 			return;
	// 		}

	// 		const blockedUsers = await blockedUsersResponse.json();
	// 		if (blockedUsers.includes(selectedFriend.id)) {
	// 			console.warn(
	// 				"Vous avez bloqué cet utilisateur et ne pouvez pas lui envoyer de message."
	// 			);
	// 			return;
	// 		}

	// 		const conversationResponse = await fetch(
	// 			"/api/get_or_create_conversation/",
	// 			{
	// 				method: "POST",
	// 				headers: {
	// 					Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
	// 					"Content-Type": "application/json",
	// 				},
	// 				body: JSON.stringify({ user_id: selectedFriend.id }),
	// 			}
	// 		);

	// 		if (!conversationResponse.ok)
	// 			throw new Error("Erreur lors de la récupération de la conversation.");

	// 		const conversationData = await conversationResponse.json();
	// 		if (!conversationData.id) {
	// 			return;
	// 		}
	// 		const response = await fetch("/api/messages/", {
	// 			method: "POST",
	// 			headers: {
	// 				Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
	// 				"Content-Type": "application/json",
	// 			},
	// 			body: JSON.stringify({
	// 				sender: currentUser.id,
	// 				conversation: conversationData.id,
	// 				text,
	// 			}),
	// 		});

	// 		if (response.status === 403) {
	// 			console.warn(
	// 				"Vous avez été bloqué par cet utilisateur et ne pouvez pas lui envoyer de messages."
	// 			);
	// 			return;
	// 		}

	// 		if (response.ok) {
	// 			let savedMessage = await response.json();

	// 			savedMessage.senderPicture =
	// 				currentUser.profile_picture || "./img/default.png";
	// 			setMessages((prevMessages) => [...prevMessages, savedMessage]);
	// 		} else {
	// 			console.error(
	// 				"Erreur lors de l'envoi du message :",
	// 				response.statusText
	// 			);
	// 		}
	// 	} catch (error) {
	// 		console.error("Erreur réseau :", error);
	// 	}
	// };

	useEffect(() => {
		console.log("test select current : ", selectedFriend," ", currentUser);
		if (!selectedFriend || !currentUser) return;

		const fetchConversationId = async () => {
			try {
				const response = await fetch("/api/get_or_create_conversation/", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ user_id: selectedFriend.id }),
				});
	
				if (!response.ok) {
					console.error("Erreur lors de la récupération de la conversation.");
					return;
				}
	
				const conversationData = await response.json();
				console.log ("conversationData.id :", conversationData.id);
				if (!conversationData.id) {
					console.error("Aucune conversation trouvée ou créée.");
					return;
				}

				const messagesRetrieve = await fetch(`/api/messages/?conversation_id=${conversationData.id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
						"Content-Type": "application/json",
					},
				});

				if (messagesRetrieve.ok) {
					const data = await messagesRetrieve.json();
					console.log ("data : ", data);
					console.log ("data.text : ", data['0']['text']);
					console.log ("data.messages : ", data.messages);
					setMessages(data);
				} else {
					console.error(`Erreur lors de la récupération des messages : ${response.statusText}`);
				}
				if (!messagesRetrieve.ok) {
					console.error("Erreur lors de la récupération des messages.");
					return;
				}
				// const messagesData = await messagesRetrieve.json();
				// setMessages(messagesData.messages);

				wsRef.current = new WebSocket(
					`ws://127.0.0.1:8001/ws/chat/${conversationData.id}/` // ${conversationData.id}
				);

				wsRef.current.onopen = () => {
					setSocket(wsRef.current);
				};
	
				wsRef.current.onmessage = (event: MessageEvent) => {
					const data = JSON.parse(event.data);
					setMessages((prevMessages: Message[]) => [
						...prevMessages,
						{
							sender: data.sender,
							conversation_id: conversationData.id,
							text: data.message,
							timestamp: new Date().toISOString(),
							senderPicture: selectedFriend.profile_picture || "./img/default.png",
						},
					]);
				};
				wsRef.current.onerror = (error: Event) => {
					console.error("Erreur WebSocket :", error);
				};

				wsRef.current.onclose = (event: CloseEvent) => {
					console.warn("WebSocket fermé :", event.code, event.reason);
				};
			} catch (error) {
				console.error("Erreur réseau :", error);
			}
		};
	
		fetchConversationId();
		return () => {
			wsRef.current?.close();
		};
	}, [selectedFriend, currentUser]);


	const handleSendMessage = (message: string) => {
		if (!wsRef.current) {
			console.error("❌ WebSocket non initialisé !");
			return;
		}

		if (wsRef.current.readyState === WebSocket.CONNECTING) {
			console.warn("⌛ WebSocket en cours de connexion... Attends un peu !");
			return;
		}

		if (wsRef.current.readyState !== WebSocket.OPEN) {
			console.error("❌ WebSocket fermé. Impossible d'envoyer un message.");
			return;
		}

		// console.log("📤 Envoi du message WebSocket :", messageData);
		// socket.send(JSON.stringify({message: "Test", sender: 1 }));
		
		// console.log("📨 Envoi du message :", message);
		wsRef.current.send(JSON.stringify({ 
			message,
			sender: currentUser?.id
		}));
	};

	const handleProfileClick = () => {
		if (selectedFriend) {
			console.log(`Profil de ${selectedFriend.username}`);
			// Ajoutez ici la navigation ou autre logique pour afficher le profil.
		}
	};

	const handleInviteClick = () => {
		if (selectedFriend) {
			console.log(`Inviter ${selectedFriend.username} à une partie de Pong`);
			// Ajoutez ici la logique pour envoyer une invitation à une partie.
		}
	};

	// useEffect(() => {
	// 	if (!selectedFriend || !currentUser) {
	// 		return;
	// 	}

	// 	const fetchMessages = async () => {
	// 		setLoading(true);

	// 		try {
	// 			const conversationResponse = await fetch(
	// 				"/api/get_or_create_conversation/",
	// 				{
	// 					method: "POST",
	// 					headers: {
	// 						Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
	// 						"Content-Type": "application/json",
	// 					},
	// 					body: JSON.stringify({ user_id: selectedFriend.id }),
	// 				}
	// 			);

	// 			if (!conversationResponse.ok) {
	// 				console.error(
	// 					"Erreur lors de la récupération de la conversation :",
	// 					conversationResponse.statusText
	// 				);
	// 				return;
	// 			}

	// 			const conversationData = await conversationResponse.json();
	// 			const conversationId = conversationData.id;

	// 			const response = await fetch(
	// 				`/api/messages?conversation_id=${conversationId}`,
	// 				{
	// 					headers: {
	// 						Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
	// 					},
	// 				}
	// 			);

	// 			if (response.ok) {
	// 				const data = await response.json();
	// 				setMessages(data);
	// 			} else {
	// 				console.error(
	// 					`Erreur lors du chargement des messages : ${response.statusText}`
	// 				);
	// 			}
	// 		} catch (error) {
	// 			console.error("Erreur réseau :", error);
	// 		} finally {
	// 			setLoading(false);
	// 		}
	// 	};
	// 	fetchMessages();

	// 	// const interval = setInterval(fetchMessages, 3000);
	// 	// return () => clearInterval(interval);
	// }, [selectedFriend, currentUser]);

	return (
		<div className="livechat-container">
			<div className="chat-wrapper">
				<div className="friend-section">
					<div className="search-bar-container">
						<SearchBar />
					</div>
					<FriendAndInvitationList onSelectFriend={setSelectedFriend} />
				</div>

				<div className="current-chat">
					{currentUser && selectedFriend ? (
						<CurrentChat
							friend={selectedFriend}
							messages={messages}
							currentUser={currentUser}
						/>							
						) : (
							<p className="text-muted">Select a friend to start chatting</p>
						)}
						<MessageBar
							onSendMessage={handleSendMessage}
							onProfileClick={handleProfileClick}
							onInviteClick={handleInviteClick}
						/>
				</div>
			</div>
		</div>
	);
};

export default LiveChatClient;
