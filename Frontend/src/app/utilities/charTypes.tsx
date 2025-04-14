export type ConversationResponse = {
	status: boolean;
	data?: { id: string };
	message?: string;
};

// Définir un type pour la réponse des messages
export type MessagesResponse = {
	status: boolean;
	data?: Message[];
	message?: string;
};

export interface Friend {
	id: number;
	username: string;
	profile_picture: string | null;
	sender__username?: string;
}

export interface Invitation {
	id: number;
	username: string;
	profile_picture: string | null;
	sender__username?: string;
}

export interface Message {
	sender: number;
	conversation_id: number;
	text: string;
	timestamp: string;
	senderPicture: string | null;
}

export interface User {
	id: number;
	username: string;
	email: string;
	profile_picture: string | null;
	is_online: boolean;
}