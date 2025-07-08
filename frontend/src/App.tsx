import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Devices from './pages/addDevice/Devices';
import AddDevice from './pages/addDevice/AddDevice';
import Login from './pages/login/Login';

function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Devices/>} />
        <Route path="/add-device" element={<AddDevice/>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App
