import BackButton from "@/components/backButton";

export interface GameProps {
	onBackClick: () => void;
}

export default function Game({onBackClick}:GameProps) {
	const count = 0;
	return (
		<>
			<div className="absolute top-20 inset-0 bg-teal-800 transition-opacity duration-500 opacity-100 z-0">
				<BackButton onReappear={onBackClick}/>
			</div>
			<div className="w-full h-full flex justify-center align-middle items-center z-10">
				<button className="TEST-BUTTON w-fit h-fit px-10 py-2 rounded bg-teal-200 font-normal hover:bg-teal-400 active:bg-teal-200 text-gray-900">Count: {count}</button>
			</div>
		</>
	);
}