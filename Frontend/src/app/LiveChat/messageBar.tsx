import React, { useState } from 'react';
import ProfileButton from './profileButton';
import InviteToGameButton from './inviteToGameButton';

interface MessageBarProps {
	onSendMessage: (text: string) => void;
	onProfileClick: () => void;
	onInviteClick: () => void;
}

const MessageBar: React.FC<MessageBarProps> = ({ onSendMessage, onProfileClick, onInviteClick }) => {
	const [message, setMessage] = useState('');

	const handleSend = () => {
		if (message.trim() !== '') {
			onSendMessage(message);
			setMessage('');
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'Enter') {
			handleSend();
		}
	};

	return (
		<div className="message-bar" style={{ display: 'flex', alignItems: 'center', padding: '10px', borderTop: '1px solid #ccc' }}>
			<input
				type="text"
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder="Type a message..."
				style={{
					flex: 1,
					padding: 10,
					borderRadius: 20,
					border: '1px solid #ccc',
					marginRight: 10,
				}}
			/>
			<button onClick={handleSend} style={{ padding: '0 20px', borderRadius: 20, background: '#0078ff', color: '#fff' }}>
				Send
			</button>
			<div style={{ display: 'flex', alignItems: 'center' }}>
                <ProfileButton onClick={onProfileClick} />
                <InviteToGameButton onClick={onInviteClick} />
            </div>
		</div>
	);
};

export default MessageBar;
