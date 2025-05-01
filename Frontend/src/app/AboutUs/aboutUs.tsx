import Carousel from "../../components/carouselBootStrap";
import AboutUsTitle from "./aboutUsTitle";
import "./aboutUs.css";

export default function AboutUsLayer() {
	return (
		<div className="aboutus-container">
			<AboutUsTitle />
			<h2 className="aboutus-description">
				This website is a project related to the 42 school, consisting of
				setting up a one-page and implementing the Pong game. Other aspects of
				development such as a database, a backend and others are integrated into
				our project. Hoping you will enjoy the visit!
			</h2>
			<div className="carousel-container">
				<Carousel />
			</div>
		</div>
	);
}
