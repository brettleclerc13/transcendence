// components/types.ts
export interface FormProps {
	onBackClick: () => void;
	onFormSwitch: () => void;
}

export interface HoverableDiv extends HTMLDivElement {
	hoverCount?: number;
	initColor?: { r: number; g: number; b: number };
}

export type MenuProps = {
	//goToSection: (section: string) => void;
	//isLoggedIn: boolean;
	userProfile?: {
		name: string;
		profilePicture: string;
		status: "Online" | "Invisible";
	};
};
