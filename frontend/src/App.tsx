
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './pages/login/Login';
import Devices from './pages/all-devices/Devices';
import AddDevice from './pages/add-device/AddDevice';
import Layout from './components/Layout';
import DeviceDetails from './pages/device-details/DeviceDetails';
import PDFReport from './pages/reports/PDFReport';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Devices/>} />
        <Route path="/devices" element={<Layout><Devices/></Layout>} />
        <Route path="/devices/new" element={<Layout><AddDevice/></Layout>} />
        <Route path="/devices/:id" element={<Layout><DeviceDetails/></Layout>} />
        <Route path="/reports" element={<Layout><PDFReport/></Layout>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
   
  );
}

export default App
