import React, { useState } from 'react';
import './App.css';

function App() {
	const [count, setCount] = useState(0);

	const handleIncrement = () => {
		setCount(count + 1);
	};

	return (
		<div className="app-container">
			<h1 className="heading">Hello World</h1>
			<button className="counter-button" onClick={handleIncrement}>
				Count: {count}
			</button>
		</div>
	);
}

export default App;
