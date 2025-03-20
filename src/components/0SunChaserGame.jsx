import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sun, ChevronLeft, ChevronRight, Info } from 'lucide-react';

const SunChaserGame = () => {
  // Game state
  const [selectedPlanet, setSelectedPlanet] = useState("Earth");
  const [gameActive, setGameActive] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(0);
  const [targetSpeed, setTargetSpeed] = useState(1039);
  const [sunPosition, setSunPosition] = useState(50);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [showInfo, setShowInfo] = useState(false);
  const [difficulty, setDifficulty] = useState("normal");
  const clickCountRef = useRef(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const gameLoopRef = useRef(null);
  const speedDecayRef = useRef(null);

  // Planet data with calculated speeds
  const planets = [
    { name: "Mercury", targetMph: 7, relativeDifficulty: 0.01, color: "#A9A9A9" },
    { name: "Venus", targetMph: 4, relativeDifficulty: 0.004, color: "#E7CFAD" },
    { name: "Earth", targetMph: 1039, relativeDifficulty: 1, color: "#1E90FF" },
    { name: "Mars", targetMph: 537, relativeDifficulty: 0.52, color: "#CD5C5C" },
    { name: "Jupiter", targetMph: 27501, relativeDifficulty: 26.46, color: "#E8AE68" },
    { name: "Saturn", targetMph: 21335, relativeDifficulty: 20.53, color: "#F4E3B2" },
    { name: "Uranus", targetMph: 5744, relativeDifficulty: 5.53, color: "#B0E0E6" },
    { name: "Neptune", targetMph: 5967, relativeDifficulty: 5.74, color: "#4169E1" }
  ];

  // Update target speed when planet changes
  useEffect(() => {
    const planet = planets.find(p => p.name === selectedPlanet);
    setTargetSpeed(planet.targetMph);
  }, [selectedPlanet, planets]);

  // Set up difficulty factors
  const difficultyFactors = {
    easy: { speedDecay: 0.8, clickPower: 2.0, tolerance: 0.2 },
    normal: { speedDecay: 1.0, clickPower: 1.0, tolerance: 0.1 },
    hard: { speedDecay: 1.2, clickPower: 0.7, tolerance: 0.05 }
  };

  // Function to increase speed with clicks/key presses
  const increaseSpeed = useCallback(() => {
    if (!gameActive) return;
    clickCountRef.current += 1;
  }, [gameActive]);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameActive) return;
      
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        increaseSpeed();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameActive, increaseSpeed]);

  // Start game
  const startGame = useCallback(() => {
    setGameActive(true);
    setCurrentSpeed(0);
    setSunPosition(50);
    setScore(0);
    setTimeLeft(30);
    clickCountRef.current = 0;
    lastUpdateTimeRef.current = Date.now();
    
    // Clear any existing intervals
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (speedDecayRef.current) clearInterval(speedDecayRef.current);
    
    // Start game loop
    gameLoopRef.current = setInterval(updateGameState, 100);
    
    // Start speed decay
    speedDecayRef.current = setInterval(() => {
      setCurrentSpeed(prev => {
        const decayFactor = difficultyFactors[difficulty].speedDecay;
        return Math.max(0, prev - (prev * 0.05 * decayFactor));
      });
    }, 200);
  }, [difficulty, difficultyFactors]);

  // Update game state
  const updateGameState = useCallback(() => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
    lastUpdateTimeRef.current = now;
    
    // Calculate speed based on click count in this time frame
    if (clickCountRef.current > 0) {
      const planet = planets.find(p => p.name === selectedPlanet);
      const clickPower = difficultyFactors[difficulty].clickPower;
      
      // Adjust speed increase based on planet difficulty
      const speedIncrease = (clickCountRef.current * 10 * clickPower) / planet.relativeDifficulty;
      
      setCurrentSpeed(prev => prev + speedIncrease);
      clickCountRef.current = 0;
    }
    
    // Update sun position based on how close we are to target speed
    setCurrentSpeed(prev => {
      const speedRatio = prev / targetSpeed;
      const newPosition = 50 + (50 * (speedRatio - 1));
      setSunPosition(Math.max(0, Math.min(100, newPosition)));
      
      // Calculate score
      const tolerance = difficultyFactors[difficulty].tolerance;
      if (Math.abs(speedRatio - 1) <= tolerance) {
        setScore(s => s + 1);
      }
      
      return prev;
    });
    
    // Update time
    setTimeLeft(prev => {
      const newTime = prev - deltaTime;
      if (newTime <= 0) {
        endGame();
        return 0;
      }
      return newTime;
    });
  }, [selectedPlanet, planets, difficultyFactors, difficulty, targetSpeed]);

  // End game
  const endGame = useCallback(() => {
    setGameActive(false);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (speedDecayRef.current) clearInterval(speedDecayRef.current);
  }, []);

  // Get current planet data
  const currentPlanet = planets.find(p => p.name === selectedPlanet);

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-gray-900 text-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold text-center mb-4">Sun Chaser: The Planetary Speed Challenge</h1>
      
      {/* Planet Selector */}
      <div className="flex justify-between items-center mb-6 bg-gray-800 p-3 rounded-lg">
        <button 
          onClick={() => {
            const idx = planets.findIndex(p => p.name === selectedPlanet);
            const newIdx = (idx - 1 + planets.length) % planets.length;
            setSelectedPlanet(planets[newIdx].name);
          }}
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
          disabled={gameActive}
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-bold" style={{ color: currentPlanet.color }}>
            {selectedPlanet}
          </h2>
          <p className="text-sm text-gray-300">
            Target: {currentPlanet.targetMph} mph
          </p>
        </div>
        
        <button 
          onClick={() => {
            const idx = planets.findIndex(p => p.name === selectedPlanet);
            const newIdx = (idx + 1) % planets.length;
            setSelectedPlanet(planets[newIdx].name);
          }}
          className="p-2 bg-gray-700 rounded-full hover:bg-gray-600"
          disabled={gameActive}
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Game Area */}
      <div className="relative h-20 bg-gradient-to-b from-blue-900 to-blue-600 rounded-lg mb-4 overflow-hidden">
        {/* Sun */}
        <div 
          className="absolute top-2 transition-all duration-300"
          style={{ 
            left: `${sunPosition}%`, 
            transform: 'translateX(-50%)'
          }}
        >
          <Sun size={48} color="yellow" />
        </div>
        
        {/* Horizon Line */}
        <div className="absolute bottom-0 w-full h-10 bg-gradient-to-b from-transparent to-gray-800 rounded-b-lg">
          <div className="relative w-full h-1 bg-white opacity-70 top-0"></div>
        </div>
        
        {/* Planet surface */}
        <div 
          className="absolute bottom-0 w-full h-8 rounded-b-lg"
          style={{ backgroundColor: currentPlanet.color, opacity: 0.7 }}
        ></div>
      </div>
      
      {/* Controls */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span>Current Speed:</span>
          <span className={
            Math.abs(currentSpeed / targetSpeed - 1) <= difficultyFactors[difficulty].tolerance
            ? "text-green-400 font-bold"
            : "text-white"
          }>
            {Math.round(currentSpeed)} mph
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all"
            style={{ 
              width: `${Math.min(100, (currentSpeed / targetSpeed) * 100)}%`,
              backgroundColor: 
                Math.abs(currentSpeed / targetSpeed - 1) <= difficultyFactors[difficulty].tolerance
                ? '#22c55e' : '#3b82f6'
            }}
          ></div>
        </div>
        
        <div className="flex justify-between mb-4">
          <div>
            <span className="block text-sm">Score: {score}</span>
            <span className="block text-sm">Time: {Math.round(timeLeft)}s</span>
          </div>
          
          <div className="flex gap-2">
            <select 
              className="bg-gray-700 rounded text-sm p-1"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={gameActive}
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
            
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-1 bg-gray-700 rounded hover:bg-gray-600"
            >
              <Info size={16} />
            </button>
          </div>
        </div>
        
        {!gameActive ? (
          <button 
            onClick={startGame}
            className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-bold tracking-wide"
          >
            START
          </button>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={increaseSpeed}
              onMouseDown={increaseSpeed}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
            >
              <ChevronLeft size={24} className="inline" />
              CLICK
            </button>
            
            <button 
              onClick={increaseSpeed}
              onMouseDown={increaseSpeed}
              className="w-1/2 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-bold"
            >
              CLICK
              <ChevronRight size={24} className="inline" />
            </button>
          </div>
        )}
      </div>
      
      {/* Info Panel */}
      {showInfo && (
        <div className="bg-gray-800 p-4 rounded-lg mb-4 text-sm">
          <h3 className="font-bold mb-2">How to Play:</h3>
          <p className="mb-2">Click the buttons or press arrow keys rapidly to run faster and keep the sun fixed in the sky!</p>
          <p className="mb-2">Each planet requires a different speed to chase the sun:</p>
          <ul className="list-disc pl-5 mb-2">
            <li>Mercury: 7 mph</li>
            <li>Venus: 4 mph</li>
            <li>Earth: 1,039 mph</li>
            <li>Mars: 537 mph</li>
            <li>Jupiter: 27,501 mph</li>
            <li>Saturn: 21,335 mph</li>
            <li>Uranus: 5,744 mph</li>
            <li>Neptune: 5,967 mph</li>
          </ul>
          <p>Score points by maintaining the exact speed needed for your chosen planet!</p>
        </div>
      )}
      
      {/* Educational Content */}
      {!gameActive && (
        <div className="bg-gray-800 p-4 rounded-lg text-sm">
          <h3 className="font-bold mb-2">Did You Know?</h3>
          <p>
            To keep the sun fixed in the sky (called "chasing the terminator"), you need to match the planet's rotation speed at the equator.
          </p>
          <p className="mt-2">
            On Earth, you'd need to run at 1,039 mph, while on Mars it's only 537 mph!
          </p>
          <p className="mt-2">
            Venus and Uranus rotate in the opposite direction (retrograde rotation), so you'd run west to east instead of east to west.
          </p>
        </div>
      )}
    </div>
  );
};

export default SunChaserGame;