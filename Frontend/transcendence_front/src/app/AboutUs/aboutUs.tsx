export interface AboutUsProps {
	onBackClick: () => void;
}

export default function AboutUsLayer({ onBackClick }: AboutUsProps) {

	return (
		<div onClick={onBackClick} className="fixed inset-0 top-20 bg-teal-800 flex justify-center items-center z-50">

		</div>
	);
}