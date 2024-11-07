'use client'

import { useState, useRef, useEffect } from "react";
import Grid from "../components/grid"
import Title from "../components/title"
import BackButton from "@/components/backButton";
import Header from "../components/header";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";
import AboutUsLayer from "../components/aboutUsLayer";

export default function Home() {
  const [showLoginLayer, setShowLoginLayer] = useState(false);
  const [showRegisterLayer, setShowRegisterLayer] = useState(false);
  const [showFirstLayer, setShowFirstLayer] = useState(true);
	const [showGameLayer, setShowGameLayer] = useState(false);
  const [showAboutUsLayer, setShowAboutUsLayer] = useState(false);
  const gridRef = useRef<any>(null);

  const handleLoginClick = () => {
    setShowLoginLayer(true);
    setShowRegisterLayer(false);
    setShowFirstLayer(false);
    setShowAboutUsLayer(false);
    setShowGameLayer(false);
    window.history.pushState({ layer: "login" }, "Login", "#login");
  };

  const handleRegisterClick = () => {
    setShowRegisterLayer(true);
    setShowLoginLayer(false)
    setShowFirstLayer(false);
    setShowAboutUsLayer(false);
    setShowGameLayer(false);
    window.history.pushState({ layer: "register" }, "Register", "#register");
  };

  const handleAboutUsClick = () => {
    setShowAboutUsLayer(true);
    setShowRegisterLayer(false);
    setShowLoginLayer(false)
    setShowFirstLayer(false);
    setShowGameLayer(false);
    window.history.pushState({ layer: "aboutUs" }, "AboutUs", "#aboutUs");
  }

  const handleGameLayer = () => {
    setShowGameLayer(true);
    setShowFirstLayer(false);
    setShowLoginLayer(false);
    setShowRegisterLayer(false);
    setShowAboutUsLayer(false);
    window.history.pushState({ layer: "game" }, "Game", "#game");
  };

  const handleHomeReappear = () => {
    setShowFirstLayer(true);
    setShowGameLayer(false);
    setShowLoginLayer(false);
    setShowRegisterLayer(false);
    setShowAboutUsLayer(false);
    window.history.pushState({ layer: "home" }, "Home", "#");
    if (gridRef.current) {
      gridRef.current.resetGrid();
    }
  };

  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state || {layer: "home" };

      switch (state.layer) {
        case "login":
          setShowLoginLayer(true);
          setShowAboutUsLayer(false);
          setShowRegisterLayer(false);
          setShowFirstLayer(false);
          setShowGameLayer(false);
          break;
        case "register":
          setShowRegisterLayer(true);
          setShowLoginLayer(false);
          setShowAboutUsLayer(false);
          setShowFirstLayer(false);
          setShowGameLayer(false);
          break;
        case "aboutUs":
          setShowAboutUsLayer(true);
          setShowLoginLayer(false);
          setShowRegisterLayer(false);
          setShowFirstLayer(false);
          setShowGameLayer(false);
          break;
        case "game":
          setShowGameLayer(true);
          setShowLoginLayer(false);
          setShowAboutUsLayer(false);
          setShowRegisterLayer(false);
          setShowFirstLayer(false);
          break;
        case "home":
        default:
          handleHomeReappear();
          break;
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  return (
    <div className="relative h-screen flex justify-center items-center bg-teal-600">
      <Header onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} onAboutUsClick={handleAboutUsClick}/>
		  {/* Layer to cover bottom half of grid elements with a smooth gradient teal to transparent effect */}
		  <div className="absolute inset-x-0 bottom-0 h-screen bg-gradient-to-t from-teal-600 from-30% pointer-events-none z-10"></div>
      <Grid ref={gridRef} onDisappear={handleGameLayer}/>
      {!showGameLayer && !showRegisterLayer && !showLoginLayer && showFirstLayer && (
        <div className="absolute shadow-lg shadow-gray-900 bg-gray-800 text-white rounded-full px-7 py-5 pointer-events-none transition-opacity duration-500 ${!showFirstLayer ? 'opacity-0' : 'opacity-100'} z-20">
          <Title />
        </div>
      )}
      {showAboutUsLayer && (
        <AboutUsLayer onBackClick={handleHomeReappear}/>
      )}
      {showGameLayer && (
			<div className="absolute top-20 inset-0 bg-teal-800 transition-opacity duration-500 opacity-100 z-30">
				<BackButton onReappear={handleHomeReappear}/>
			</div>
			)}
      {showLoginLayer && (
        <LoginForm onBackClick={handleHomeReappear} onFormSwitch={handleRegisterClick}/>
      )}
      {showRegisterLayer && (
        <RegisterForm onBackClick={handleHomeReappear} onFormSwitch={handleLoginClick}/>
      )}
    </div>
  );
}
