'use client'

import { useState, useRef } from "react";
import Grid from "../components/grid"
import Title from "../components/title"
import BackButton from "@/components/backButton";
import Header from "../components/header";
import LoginForm from "@/components/loginForm";
import RegisterForm from "../components/registerForm";

export default function Home() {
  const [showLoginLayer, setShowLoginLayer] = useState(false);
  const [showRegisterLayer, setShowRegisterLayer] = useState(false);
  const [showFirstLayer, setShowFirstLayer] = useState(true);
	const [showGameLayer, setShowGameLayer] = useState(false);
  const gridRef = useRef<any>(null);

  const handleLoginClick = () => {
    setShowLoginLayer(true);
    setShowRegisterLayer(false);
    setShowFirstLayer(false);
  };

  const handleRegisterClick = () => {
    setShowRegisterLayer(true);
    setShowLoginLayer(false)
    setShowFirstLayer(false);
  };

  const handleDisappear = () => {
    setShowFirstLayer(false);

    setTimeout(() => {
      setShowGameLayer(true);
    }, 500);
  };

  const handleHomeReappear = () => {
    setShowGameLayer(false);
    setShowLoginLayer(false);
    setShowRegisterLayer(false);
    setShowFirstLayer(true);
    if (gridRef.current) {
      gridRef.current.resetGrid();
    }
  };

  return (
    <div className="relative h-screen flex justify-center items-center bg-teal-600">
      <Header onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick}/>
		{/* Layer to cover bottom half of grid elements with a smooth gradient teal to transparent effect */}
		<div className="absolute inset-x-0 bottom-0 h-screen bg-gradient-to-t from-teal-600 from-30% pointer-events-none z-10"></div>
        <Grid ref={gridRef} onDisappear={handleDisappear}/>
        {!showRegisterLayer && !showLoginLayer && showFirstLayer && (
          <div className="absolute shadow-lg shadow-gray-900 bg-gray-800 text-white rounded-full px-7 py-5 pointer-events-none transition-opacity duration-500 ${!showFirstLayer ? 'opacity-0' : 'opacity-100'} z-20">
            <Title />
          </div>
        )}
        {showGameLayer && (
				<div className="absolute inset-0 bg-teal-800 transition-opacity duration-500 opacity-100 z-30">
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
