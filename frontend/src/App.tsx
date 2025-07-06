import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Devices from './pages/Devices';
import AddDevice from './pages/addDevice/AddDevice';

function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Devices/>} />
        <Route path="/add-device" element={<AddDevice/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
