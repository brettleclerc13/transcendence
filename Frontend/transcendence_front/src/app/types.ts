// components/types.ts
export interface FormProps {
	onBackClick: () => void;
	onFormSwitch: () => void;
}

export interface HoverableDiv extends HTMLDivElement {
	hoverCount?: number;
	initColor?: { r: number; g: number; b: number };
}
