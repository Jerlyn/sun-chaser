import React from 'react';
import './App.css';
import './additional-styles.css'; // Add this line
import SunChaserGame from './components/SunChaserGame';

function App() {
  return (
    <div className="App min-h-screen bg-gray-900">
      <SunChaserGame />
    </div>
  );
}

export default App;