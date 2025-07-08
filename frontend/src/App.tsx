
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './pages/login/Login';
import Devices from './pages/all-devices/Devices';
import AddDevice from './pages/add-device/AddDevice';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Devices/>} />
        <Route path="/add-device" element={<Layout><AddDevice/></Layout>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
   
  );
}

export default App
