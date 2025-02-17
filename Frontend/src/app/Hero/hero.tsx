import Title from "@/app/Hero/heroTitle";
import Grid from "@/components/grid";

export default function Hero() {

	return (
		<>
			<Grid />
			{/* Layer to cover bottom half of grid elements with a smooth gradient teal to transparent effect */}
			<div className="absolute inset-x-0 bottom-0 h-screen bg-gradient-to-t from-teal-600 from-30% pointer-events-none z-1"></div>

			<div className="absolute shadow-lg shadow-gray-900 bg-gray-800 text-white rounded-full px-7 py-5 pointer-events-none transition-opacity duration-500 ${!showFirstLayer ? 'opacity-0' : 'opacity-100'} z-2">
				<h2 className="hidden">Transcendence</h2>
				<Title />
			</div>
		</>
	);
}
