"use client";

import { useEffect, useRef } from 'react';

const GamePage = () => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Determine the correct protocol
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socketUrl = `${protocol}://${window.location.host}/ws/game/`;

    // Create a new WebSocket connection
    socketRef.current = new WebSocket(socketUrl);

    socketRef.current.onopen = () => {
      console.log('WebSocket connection established');
    };

    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // Handle incoming game data
      console.log('Received data:', data);
      // Update game state accordingly
    };

    socketRef.current.onclose = () => {
      console.log('WebSocket connection closed');
    };

    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div>
      <h1>Pong Game</h1>
      <canvas id="gameCanvas" width="800" height="600"></canvas>
    </div>
  );
};

export default GamePage;
