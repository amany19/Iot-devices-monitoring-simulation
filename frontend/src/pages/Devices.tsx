import DeviceCard from "../components/DeviceCard";

import { mockDevices } from "../mockData/mockDevices";
import { useNavigate } from "react-router-dom";
export default function Devices (){
const navigate = useNavigate();

    

    return(
    <div className="p-6 space-y-6">
        
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Devices</h1>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700" 
        onClick={()=>{ navigate("/add-device")}}>
          + Add Device
        </button>
      </div>

      <input
        type="text"
        placeholder="Search devices..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md"
      />

      <div className="space-y-4">
        {mockDevices.map((device) => (
          <DeviceCard  key={device.id} {...device}  />
        ))}
      </div>
    </div>
    )
}