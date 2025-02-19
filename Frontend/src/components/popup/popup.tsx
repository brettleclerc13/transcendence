import React from "react";
import "./popup.css";

type PopupProps = {
	isOpen: boolean;
	onClose: () => void;
	children: React.ReactNode;
};

export default function Popup({ isOpen, onClose, children }: PopupProps) {
	if (!isOpen) return null;

	return (
		<div className="popup-overlay" onClick={onClose}>
			<div className="popup-box" onClick={(e) => e.stopPropagation()}>
				<button className="popup-close" onClick={onClose}>
					&times;
				</button>
				{children}
			</div>
		</div>
	);
}
