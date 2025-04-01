"use client";

import Link from "next/link";
import React, { useState, useEffect, useRef } from "react";
import "./liveChat.css";
import { isUserLoggedIn } from "../utilities/userClientActions";
import FriendAndInvitationList from "./friendAndInvitationList";
import CurrentChat from "./currentChat";
import MessageBar from "./messageBar";
import SearchBar from "./searchBar";
import { getCookie } from "cookies-next/client";
import { createSimpleMatch } from "../utilities/matchActions";

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
	const [socket, setSocket] = useState<WebSocket | null>(null);

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				const accessToken = getCookie("accessToken");
				if (!accessToken) {
					console.warn("Access token missing!");
					return;
				}
				const response = await fetch("/api/profile/", {
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
				});
				if (!response.ok) {
					console.warn(
						"Erreur lors de la récupération de l'utilisateur :",
						response.statusText
					);
					return;
				}
				const data = await response.json();
				setCurrentUser(data);
			} catch (error) {
				console.warn(
					"Erreur réseau lors de la récupération de l'utilisateur :",
					error
				);
			}
		};

		fetchCurrentUser();
	}, []);

	useEffect(() => {
		const accessToken = getCookie("accessToken");

		if (!accessToken) {
			console.log("Access Token not retrieved in Game Canvas");
			return;
		}
		if (!selectedFriend || !currentUser) return;

		const fetchConversationId = async () => {
			try {
				const accessToken = getCookie("accessToken");
				if (!accessToken) {
					console.warn("Access token missing!");
					return;
				}

				const response = await fetch("/api/get_or_create_conversation/", {
					method: "POST",
					headers: {
						Authorization: `Bearer ${accessToken}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ user_id: selectedFriend.id }),
				});

				if (!response.ok) {
					console.warn("Erreur lors de la récupération de la conversation.");
					return;
				}

				const conversationData = await response.json();
				if (!conversationData.id) {
					console.warn("Aucune conversation trouvée ou créée.");
					return;
				}

				const messagesRetrieve = await fetch(
					`/api/messages/?conversation_id=${conversationData.id}`,
					{
						headers: {
							Authorization: `Bearer ${accessToken}`,
							"Content-Type": "application/json",
						},
					}
				);

				if (messagesRetrieve.ok) {
					const data = await messagesRetrieve.json();
					setMessages(data);
				} else {
					console.warn(
						`Erreur lors de la récupération des messages : ${response.statusText}`
					);
				}
				if (!messagesRetrieve.ok) {
					console.warn("Erreur lors de la récupération des messages.");
					return;
				}

				wsRef.current = new WebSocket(
					`wss://c2r5p8:8080/ws/chat/${conversationData.id}/?token=${accessToken}`
				);

				wsRef.current.onopen = () => {
					setSocket(wsRef.current);
				};

				wsRef.current.onmessage = (event: MessageEvent) => {
					const data = JSON.parse(event.data);

					if (!data.message || data.message.trim() === "") {
						console.warn("Message vide reçu, il ne sera pas affiché.");
						return;
					}

					setMessages((prevMessages: Message[]) => [
						...prevMessages,
						{
							sender: data.sender,
							conversation_id: conversationData.id,
							text: data.message,
							timestamp: new Date().toISOString(),
							senderPicture:
								selectedFriend.profile_picture || "./img/default.png",
						},
					]);
				};
				wsRef.current.onerror = (error: Event) => {
					console.warn("Erreur WebSocket :", error);
				};

				wsRef.current.onclose = (event: CloseEvent) => {
					console.warn("WebSocket fermé :", event.code, event.reason);
				};
			} catch (error) {
				console.warn("Erreur réseau :", error);
			}
		};

		fetchConversationId();
		return () => {
			wsRef.current?.close();
		};
	}, [selectedFriend, currentUser]);

	const handleSendMessage = (message: string) => {
		if (!wsRef.current) {
			console.warn("WebSocket non initialisé !");
			return;
		}

		if (wsRef.current.readyState === WebSocket.CONNECTING) {
			console.warn("WebSocket en cours de connexion... Attends un peu !");
			return;
		}

		if (wsRef.current.readyState !== WebSocket.OPEN) {
			console.warn("WebSocket fermé. Impossible d'envoyer un message.");
			return;
		}

		wsRef.current.send(
			JSON.stringify({
				message,
				sender: currentUser?.id,
			})
		);
	};

	const handleInviteClick = async () => {
		if (!selectedFriend || !wsRef.current) {
			console.warn("Aucun ami sélectionné ou WebSocket non initialisé.");
			return;
		}
		
		try {
			const response = await createSimpleMatch(true);
			if (response.matchID) {
				const inviteMessage = `Join me to play a Pong Game ! (Match ID: ${response.matchID})`;
				if (wsRef.current.readyState === WebSocket.OPEN) {
					wsRef.current.send(
						JSON.stringify({
							message: inviteMessage,
							sender: currentUser?.id,
						})
					);
				} else {
					console.warn(" WebSocket fermé. Impossible d'envoyer l'invitation.");
				}
			} else {
				console.warn("Invite game creation not possible");
			}
		} catch (error) {
			console.warn("Invite game creation not possible", error);
		}
	}


	return (
		<div className="livechat-container">
			{isUserLoggedIn() ? (
				<>
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
								selectedFriend={selectedFriend}
								onSendMessage={handleSendMessage}
								onInviteClick={handleInviteClick}
							/>
						</div>
					</div>
				</>
			) : (
				<div className="flex flex-col gap-4 justify-center items-center h-full w-full">
					<p className="text-lg">
						Please log in before chatting. It won't even take a
						minute!
					</p>
					<Link className="secondary-button" href="/login">
						Connect
					</Link>
				</div>
			)}
		</div>
	);
};

export default LiveChatClient;
