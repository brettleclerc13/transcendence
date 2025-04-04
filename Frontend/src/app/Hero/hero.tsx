import Title from "@/app/Hero/heroTitle";
import Grid from "@/components/grid";
import "./hero.css"

export default function Hero({ showFirstLayer }: { showFirstLayer: boolean }) {
	return (
		<>
			<Grid />
			{/* Layer to cover bottom half of grid elements with a smooth gradient teal to transparent effect */}
			<div className="gradient-overlay"></div>

			<div className={`hero-container ${!showFirstLayer ? 'hidden' : ''}`}>
				<h2 className="visually-hidden">Transcendence</h2>
				<Title />
			</div>
		</>
	);
}
