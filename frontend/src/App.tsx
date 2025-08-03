
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
import { AlarmProvider } from './context/AlarmContext';
import EditDevice from './pages/edit-device/EditDevice';
import Dashboard from './pages/dashboard/Dashboard';
import AddUser from './pages/add-user/AddUser';
import InjectReadings from './pages/inject-readings/InjectReadings'
import Audit from './pages/audit/Audit'
function App() {
  return (
    
   <AlarmProvider>

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>} />
        <Route path="/devices" element={<Layout><Devices/></Layout>} />
        <Route path="/devices/new" element={<Layout><AddDevice/></Layout>} />
        <Route path="/devices/:id" element={<Layout><DeviceDetails/></Layout>} />
        <Route path="/devices/:id/edit" element={<Layout><EditDevice/></Layout>} />
        <Route path="/reports" element={<Layout><PDFReport/></Layout>} />
        <Route path="/alarms" element={<Layout><Alarms /></Layout>} />
        <Route path="/manufacturer" element={<Layout><ManufacturerPage /></Layout>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/add-user" element={<Layout><AddUser/></Layout>} />
        <Route path="/inject-readings" element={<Layout><InjectReadings/></Layout>} />
        <Route path="/audit" element={<Layout><Audit/></Layout>} />
        <Route path="/dashboard" element={<Layout><Dashboard/></Layout>} />
      </Routes>
    </BrowserRouter>
   </AlarmProvider>
  );
}

export default App
