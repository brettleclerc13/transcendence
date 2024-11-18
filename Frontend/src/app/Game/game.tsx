import BackButton from "@/components/backButton";

export interface GameProps {
	onBackClick: () => void;
}

export default function Game({onBackClick}:GameProps) {
	return (
		<>
			<div className="absolute top-20 inset-0 bg-teal-800 transition-opacity duration-500 opacity-100 z-30">
				<BackButton onReappear={onBackClick}/>
			</div>
		</>
	);
}
