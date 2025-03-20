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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlanet, planets, difficultyFactors, difficulty, targetSpeed]);

  // End game
  const endGame = useCallback(() => {
    setGameActive(false);
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (speedDecayRef.current) clearInterval(speedDecayRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current planet data
  const currentPlanet = planets.find(p => p.name === selectedPlanet);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-gray-900 text-white rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-center mb-6 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Sun Chaser: The Planetary Speed Challenge</h1>
      
      {/* Planet Selector - Enhanced with better visual styling */}
      <div className="flex justify-between items-center mb-8 bg-gray-800 p-4 rounded-xl shadow-md">
        <button 
          onClick={() => {
            const idx = planets.findIndex(p => p.name === selectedPlanet);
            const newIdx = (idx - 1 + planets.length) % planets.length;
            setSelectedPlanet(planets[newIdx].name);
          }}
          className="p-3 bg-gray-700 rounded-full hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
          disabled={gameActive}
          aria-label="Previous planet"
        >
          <ChevronLeft size={28} />
        </button>
        
        <div className="text-center transition-all duration-300">
          <h2 className="text-3xl font-bold mb-2" style={{ color: currentPlanet.color }}>
            {selectedPlanet}
          </h2>
          <p className="text-xl font-semibold text-yellow-300">
            Target: {currentPlanet.targetMph.toLocaleString()} mph
          </p>
        </div>
        
        <button 
          onClick={() => {
            const idx = planets.findIndex(p => p.name === selectedPlanet);
            const newIdx = (idx + 1) % planets.length;
            setSelectedPlanet(planets[newIdx].name);
          }}
          className="p-3 bg-gray-700 rounded-full hover:bg-indigo-700 transition-colors duration-300 shadow-lg"
          disabled={gameActive}
          aria-label="Next planet"
        >
          <ChevronRight size={28} />
        </button>
      </div>
      
      {/* Game Area - Enhanced with better visuals */}
      <div className="relative h-28 bg-gradient-to-b from-indigo-900 via-blue-800 to-blue-600 rounded-xl mb-6 overflow-hidden shadow-lg">
        {/* Sun - Added animation */}
        <div 
          className="absolute top-3 transition-all duration-300 animate-pulse"
          style={{ 
            left: `${sunPosition}%`, 
            transform: 'translateX(-50%)'
          }}
        >
          <Sun size={56} color="yellow" className="drop-shadow-glow" />
        </div>
        
        {/* Horizon Line */}
        <div className="absolute bottom-0 w-full h-12 bg-gradient-to-b from-transparent to-gray-800 rounded-b-xl">
          <div className="relative w-full h-1 bg-white opacity-70 top-0"></div>
        </div>
        
        {/* Planet surface */}
        <div 
          className="absolute bottom-0 w-full h-10 rounded-b-xl"
          style={{ backgroundColor: currentPlanet.color, opacity: 0.7 }}
        ></div>
      </div>
      
      {/* Controls - Improved visual hierarchy */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <span className="text-lg font-semibold text-gray-300">Current Speed:</span>
          <span className={`text-2xl font-bold transition-colors duration-300 ${
            Math.abs(currentSpeed / targetSpeed - 1) <= difficultyFactors[difficulty].tolerance
            ? "text-green-400"
            : "text-white"
          }`}>
            {Math.round(currentSpeed).toLocaleString()} mph
          </span>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-4 mb-6 overflow-hidden shadow-inner">
          <div 
            className="h-4 rounded-full transition-all duration-300"
            style={{ 
              width: `${Math.min(100, (currentSpeed / targetSpeed) * 100)}%`,
              backgroundColor: 
                Math.abs(currentSpeed / targetSpeed - 1) <= difficultyFactors[difficulty].tolerance
                ? '#22c55e' : '#3b82f6'
            }}
          ></div>
        </div>
        
        <div className="flex justify-between mb-6">
          <div className="flex flex-col bg-gray-800 rounded-lg p-3 shadow-md">
            <span className="text-lg font-bold">Score: <span className="text-indigo-300">{score}</span></span>
            <span className="text-lg font-bold">Time: <span className="text-indigo-300">{Math.round(timeLeft)}s</span></span>
          </div>
          
          <div className="flex gap-3">
            <select 
              className="bg-gray-800 rounded-lg text-sm p-2 border border-gray-700 shadow-md focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              disabled={gameActive}
              aria-label="Select difficulty"
            >
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
            
            <button 
              onClick={() => setShowInfo(!showInfo)}
              className="p-2 bg-gray-800 rounded-lg hover:bg-indigo-700 transition-colors duration-300 shadow-md"
              aria-label="Show information"
            >
              <Info size={20} />
            </button>
          </div>
        </div>
        
        {!gameActive ? (
          <button 
            onClick={startGame}
            className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-xl tracking-wide transition-all duration-300 shadow-lg hover:shadow-green-700/30 transform hover:scale-105"
            aria-label="Start game"
          >
            CHASE THE SUN!
          </button>
        ) : (
          <div className="flex gap-6">
            <button 
              onClick={increaseSpeed}
              onMouseDown={increaseSpeed}
              className="w-1/2 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-blue-700/30 transform hover:scale-105"
              aria-label="Increase speed left"
            >
              <ChevronLeft size={28} className="inline mr-2" />
              RUN!
            </button>
            
            <button 
              onClick={increaseSpeed}
              onMouseDown={increaseSpeed}
              className="w-1/2 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xl transition-all duration-300 shadow-lg hover:shadow-blue-700/30 transform hover:scale-105"
              aria-label="Increase speed right"
            >
              RUN!
              <ChevronRight size={28} className="inline ml-2" />
            </button>
          </div>
        )}
      </div>
      
      {/* Info Panel - Collapsible and better styled */}
      {showInfo && (
        <div className="bg-gray-800 p-5 rounded-xl mb-6 text-sm shadow-md border border-gray-700 animate-fadeIn">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-xl text-indigo-300">How to Play:</h3>
            <button 
              onClick={() => setShowInfo(false)}
              className="p-1 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white"
              aria-label="Close information"
            >
              ✕
            </button>
          </div>
          <p className="mb-3">Click the buttons or press arrow keys rapidly to run faster and keep the sun fixed in the sky!</p>
          <p className="mb-3">Each planet requires a different speed to chase the sun:</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {planets.map(planet => (
              <div key={planet.name} className="flex justify-between" style={{ color: planet.color }}>
                <span className="font-semibold">{planet.name}:</span>
                <span>{planet.targetMph.toLocaleString()} mph</span>
              </div>
            ))}
          </div>
          <p className="font-semibold text-green-400">Score points by maintaining the exact speed needed for your chosen planet!</p>
        </div>
      )}
      
      {/* Educational Content - Better styled and collapsible */}
      {!gameActive && (
        <div className="bg-gray-800 p-5 rounded-xl text-sm shadow-md border border-gray-700">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-xl text-indigo-300">Did You Know?</h3>
            <Info size={16} className="text-gray-400" />
          </div>
          <p className="mb-3">
            To keep the sun fixed in the sky (called "chasing the terminator"), you need to match the planet's rotation speed at the equator.
          </p>
          <p className="mb-3">
            On Earth, you'd need to run at 1,039 mph, while on Mars it's only 537 mph!
          </p>
          <p>
            Venus and Uranus rotate in the opposite direction (retrograde rotation), so you'd run west to east instead of east to west.
          </p>
        </div>
      )}

      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .drop-shadow-glow {
          filter: drop-shadow(0 0 10px rgba(255, 255, 0, 0.7));
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default SunChaserGame;