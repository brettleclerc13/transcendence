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
import { useRouter } from "next/navigation";
import { fetchUserProfile } from "../utilities/profileActions";
import { GetOrCreateConversation } from "../utilities/chatActions";
import { FetchMessages } from "../utilities/chatActions";
import type { Friend, Message, ConversationResponse, MessagesResponse } from "../utilities/charTypes";
import type { UserProfileData } from "../utilities/profileActions";

// interface User {
// 	id: number;
// 	username: string;
// 	email: string;
// 	profile_picture: string | null;
// 	is_online: boolean;
// }

// interface Friend {
// 	id: number;
// 	username: string;
// 	profile_picture: string | null;
// }

// interface Message {
// 	sender: number;
// 	conversation_id: number;
// 	text: string;
// 	timestamp: string;
// 	senderPicture: string | null;
// }

const LiveChatClient = () => {
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
	const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const wsRef = useRef<WebSocket | null>(null);
	const router = useRouter();

	useEffect(() => {
		const fetchCurrentUser = async () => {
			try {
				if (!isUserLoggedIn()) return;
				const response = await fetchUserProfile();
				setCurrentUser(response);
			} catch (error) {
				console.warn(
					"Erreur réseau lors de la récupération de l'utilisateur :",
					error,
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
				const host = process.env.NEXT_PUBLIC_WS_HOST;
				const port = process.env.NEXT_PUBLIC_WS_PORT;

				const response = await GetOrCreateConversation(selectedFriend.id) as ConversationResponse;
				let conversationData: { id: string } | null = null;

				if (response && response.status && response.data) {
					conversationData = response.data;
				} else {
					console.warn("Erreur lors de la récupération de la conversation.");
					return;
				}
			
				if (!conversationData || !conversationData.id) {
					console.warn("Aucune conversation trouvée ou créée.");
					return;
				}

				const messagesRetrieve = await FetchMessages(conversationData.id) as MessagesResponse;

				if (messagesRetrieve.status && messagesRetrieve.data) {
					setMessages(messagesRetrieve.data);
				} else {
					const errorMessage =
						"message" in response
							? response.message
							: "Failed to fetch messages.";
					console.warn(
						`Erreur lors de la récupération des messages : ${errorMessage}`,
					);
				}
				if (!messagesRetrieve.status) {
					console.warn("Erreur lors de la récupération des messages.");
					return;
				}

				wsRef.current = new WebSocket(
					`wss://${host}:${port}/chat/${conversationData.id}/?token=${accessToken}`,
				);

				wsRef.current.onopen = () => {
					console.log("WebSocket connecté !");
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
							conversation_id: Number(conversationData.id),
							text: data.message,
							timestamp: new Date().toISOString(),
							senderPicture:
								selectedFriend.profile_picture || "/img/default.png",
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
			}),
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
						}),
					);
				} else {
					console.warn(" WebSocket fermé. Impossible d'envoyer l'invitation.");
				}
				router.push("/lobby");
			} else {
				console.warn("Invite game creation not possible");
			}
		} catch (error) {
			console.warn("Invite game creation not possible", error);
		}
	};


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
							{(() => {
								if (currentUser && selectedFriend) {
									return (
										<CurrentChat
											friend={selectedFriend}
											messages={messages}
											currentUser={currentUser}
										/>
									);
								} else {
									return <p className="text-muted">Select a friend to start chatting</p>;
								}
							})()}
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
						Please log in before chatting. It won&apos;t even take a minute!
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
