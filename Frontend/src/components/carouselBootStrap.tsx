"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import "./carouselBootStrap.css";

const MyCarousel = () => {
	const carouselRef = useRef<HTMLDivElement | null>(null);
	const [isBootstrapLoaded, setIsBootstrapLoaded] = useState(false);

	useEffect(() => {
		const loadBootstrap = async () => {
			if (typeof window !== "undefined" && !window.bootstrap) {
				await import("bootstrap/dist/js/bootstrap.bundle.min.js");
				console.log("Bootstrap chargé !");
				setIsBootstrapLoaded(true);
			}
		};
	
		loadBootstrap();
	}, []);

	useEffect(() => {
		if (carouselRef.current && isBootstrapLoaded) {
			// Vérification que Bootstrap est bien chargé
			if (typeof window.bootstrap !== "undefined") {
				const carouselInstance = new window.bootstrap.Carousel(
					carouselRef.current,
					{
						interval: 2000,
						touch: false,
					}
				);

				return () => {
					// Nettoyage de l'instance pour éviter les fuites de mémoire
					carouselInstance.dispose();
				};
			} else {
				console.warn("Bootstrap is not loaded");
			}
		}
	}, [isBootstrapLoaded]);

	return (
		<div className="carousel-container">
			<div
				id="myCarousel"
				ref={carouselRef}
				className="carousel slide carousel-container flex items-center justify-center"
			>
				<div className="carousel-indicators">
					<button
						type="button"
						data-bs-target="#myCarousel"
						data-bs-slide-to="0"
						className="active"
						aria-current="true"
						aria-label="Slide 1"
					></button>
					<button
						type="button"
						data-bs-target="#myCarousel"
						data-bs-slide-to="1"
						aria-label="Slide 2"
					></button>
					<button
						type="button"
						data-bs-target="#myCarousel"
						data-bs-slide-to="2"
						aria-label="Slide 3"
					></button>
				</div>
				<div className="carousel-inner">
					<div className="carousel-item active">
						<Image
							src="/img/ehouot.png"
							alt="Emilien Houot"
							width={800} 
							height={400}
							style={{ objectFit: "contain" }}
							className="d-block w-100"
						/>
						<div className="carousel-caption d-none d-md-block">
							<h5>Emilien Houot | ehouot</h5>
							<div className="social-icons">
								<a
									href="https://www.linkedin.com/in/emilien-houot/"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/linkedin32.png"
										alt="LinkedIn"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
								<a
									href="https://github.com/EmlHT"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/github32.png"
										alt="GitHub"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
							</div>
						</div>
					</div>
					<div className="carousel-item">
						<Image
							src="/img/bleclerc.png"
							alt="Brett Leclerc"
							width={800}
							height={400}
							style={{ objectFit: "contain" }}
							className="d-block w-100"
						/>
						<div className="carousel-caption d-none d-md-block">
							<h5>Brett Leclerc | bleclerc</h5>
							<div className="social-icons">
								<a
									href="https://www.linkedin.com/in/brett-leclerc/"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/linkedin32.png"
										alt="LinkedIn"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
								<a
									href="https://github.com/brettleclerc13"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/github32.png"
										alt="GitHub"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
							</div>
						</div>
					</div>
					<div className="carousel-item">
						<Image
							src="/img/lkukhale.png"
							alt="Levan Kukhaleishvili"
							width={800}
							height={400}
							style={{ objectFit: "contain" }}
							className="d-block w-100"
						/>
						<div className="carousel-caption d-none d-md-block">
							<h5>Levan Kukhaleishvili | lkukhale</h5>
							<div className="social-icons">
								<a
									href="https://www.linkedin.com/in/levan-kukhaleishvili-15a58020b/"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/linkedin32.png"
										alt="LinkedIn"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
								<a
									href="https://github.com/Manwe314"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Image
										src="/img/github32.png"
										alt="GitHub"
										width={32}
										height={32}
										className="social-icon"
									/>
								</a>
							</div>
						</div>
					</div>
				</div>
				<button
					className="carousel-control-prev"
					type="button"
					data-bs-target="#myCarousel"
					data-bs-slide="prev"
				>
					<span
						className="carousel-control-prev-icon"
						aria-hidden="true"
					></span>
					<span className="visually-hidden">Previous</span>
				</button>
				<button
					className="carousel-control-next"
					type="button"
					data-bs-target="#myCarousel"
					data-bs-slide="next"
				>
					<span
						className="carousel-control-next-icon"
						aria-hidden="true"
					></span>
					<span className="visually-hidden">Next</span>
				</button>
			</div>
		</div>
	);
};

export default MyCarousel;
