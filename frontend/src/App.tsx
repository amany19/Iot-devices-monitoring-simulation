
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from './pages/login/Login';
import Devices from './pages/all-devices/Devices';
import AddDevice from './pages/add-device/AddDevice';
import Layout from './components/Layout';
import DeviceDetails from './pages/device-details/DeviceDetails';
import PDFReport from './pages/reports/PDFReport';
import Alarms from './pages/alarms/Alarms';
import ManufacturerPage from './pages/manufacturer/Manufacturer';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/devices" element={<Layout><Devices/></Layout>} />
        <Route path="/devices/new" element={<Layout><AddDevice/></Layout>} />
        <Route path="/devices/:id" element={<Layout><DeviceDetails/></Layout>} />
        <Route path="/reports" element={<Layout><PDFReport/></Layout>} />
        <Route path="/alarms" element={<Layout><Alarms /></Layout>} />
        <Route path="/manufacturer" element={<Layout><ManufacturerPage /></Layout>} />
        <Route path="/login" element={<Login/>} />
      </Routes>
    </BrowserRouter>
   
  );
}

export default App
