import DeviceCard from "../../components/DeviceCard";

import { mockDevices } from "../../mockData/mockDevices";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "reactstrap";
import { TextField } from "@mui/material";
type DeviceCardProps = {
  device: {
    id: string;
    name: string;
    type: string;
    status: string;
  };
  onClick?: () => void;
};


export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState(mockDevices);

  const fetchDevices = () => {
    fetch("http://localhost:8000/api/devices")
      .then((res) => res.json())
      .then((data) => setDevices(data))
      .catch(() => setDevices(mockDevices));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const onDeleteSuccess = () => {
    fetchDevices();
  };
  const [searchQuery, setSearchQuery] = useState("");

  // Optionally, you can filter devices based on searchQuery:
  // const filteredDevices = devices.filter(device =>
  //   device.name.toLowerCase().includes(searchQuery.toLowerCase())
  // );

  return (
    <div>
      <div className="all-devices-top"><TextField

        variant="outlined"
        size="small"
        fullWidth
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
      />
        <Button className="default-button" onClick={() => navigate("/devices/new")}>
          + Add Device
        </Button>
      </div>

      <div className="devices-container">
        <div
          className="devices-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", // Responsive columns
            gap: "24px",
          }}
        >
          {devices.map((device) => (
            <DeviceCard
              onDeleteSuccess={onDeleteSuccess}
              key={device.id}
              device={device}
              onClick={() => navigate(`/devices/${device.id}`)}
            />
          ))}
        </div>

      </div>
    </div>


  )
}