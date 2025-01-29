'use client';

import React, { useState, useEffect } from 'react';
import "./liveChat.css";
import FriendList from './friendList';
import CurrentChat from './currentChat';
import MessageBar from './messageBar';
import SearchBar from './searchBar';

interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
}

interface Message {
	id: number;
	senderId: number;
	text: string;
	timestamp: string;
	senderPicture: string | null;
}

const LiveChatClient = () => {
	const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
	const [messages, setMessages] = useState<Message[]>([]);
	const [loading, setLoading] = useState<boolean>(false);

	const handleSendMessage = async (text: string) => {
		if (selectedFriend) {
			const newMessage = {
				senderId: 0, // A remplacer par l'id user actuel
				conversationId: selectedFriend.id, // ID basé sur l'ami sélectionné
				text,
				timestamp: new Date().toISOString(),
				senderPicture: './img/your-profile.png', // a remplacer par l'image de l'user actuel
			};
	
			try {
				const response = await fetch('/messages/', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(newMessage),
				});
	
				if (response.ok) {
					const savedMessage = await response.json();
					setMessages((prevMessages) => [...prevMessages, savedMessage]);
				} else {
					console.error('Erreur lors de l\'envoi du message :', response.statusText);
				}
			} catch (error) {
				console.error('Erreur réseau :', error);
			}
		}
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

	useEffect(() => {
		const fetchMessages = async () => {
			if (!selectedFriend) return;
			setLoading(true);
			try {
				const response = await fetch(`/messages/?conversation_id=${selectedFriend.id}`);
				if (response.ok) {
					const data = await response.json();
					setMessages(data);
				} else {
					console.error('Erreur lors du chargement des messages : ${response.statusText}');
				}
			} catch (error) {
				console.error('Erreur réseau :', error);
			} finally {
				setLoading(false);
			}
		};
	
		fetchMessages();
	}, [selectedFriend]);

	return (
		<div className="livechat-container">
			<div className="chat-wrapper">
				<div className="friend-section">
					<div className="search-bar-container">
						<SearchBar />
					</div>
					<FriendList onSelectFriend={setSelectedFriend} />
				</div>

				<div className="current-chat">
					{selectedFriend ? (
						<>
							{loading ? (
								<p className="text-center text-muted">Loading...</p>
							) : (
								<CurrentChat friend={selectedFriend} messages={messages} />
							)}
							<MessageBar
								onSendMessage={handleSendMessage}
								onProfileClick={handleProfileClick}
								onInviteClick={handleInviteClick}
							/>
						</>
					) : (
						<p className="text-muted">Select a friend to start chatting</p>
					)}
				</div>
			</div>
    	</div>
	);
};

export default LiveChatClient;