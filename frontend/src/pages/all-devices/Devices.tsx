import DeviceCard from "../../components/DeviceCard";

import { mockDevices } from "../../mockData/mockDevices";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "reactstrap";
import { Box,  InputAdornment, TextField } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
 

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState(mockDevices);
  const [filteredDevices, setFilteredDevices] = useState(devices);
  const role = (localStorage.getItem('role') ?? 'guest').toLocaleLowerCase();

  const fetchDevices = () => {
    fetch("http://localhost:8000/api/devices")
      .then((res) => res.json())
      .then((data) => {
        setDevices(data);
        setFilteredDevices(data);
      })
      .catch(() => setDevices(mockDevices));
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const onDeleteSuccess = () => {
    console.log("On delete success called ")
    fetchDevices();
  };
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    const searchQuery = event.target.value;
    const filterationh = devices.filter(device =>
      device.code.toLowerCase().includes(searchQuery.toLowerCase()))
    setFilteredDevices(filterationh)
      ;
    if (searchQuery === "") {
      setFilteredDevices(devices);
    }
  }
  useEffect(() => {
    setFilteredDevices(devices);
  }, [devices]);
  // const handleSearchClick = () => {
  //   const filteration = devices.filter(device =>
  //     device.code.toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  //   setFilteredDevices(filteration);
  // };
  return (
    <div>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 2, // 16px spacing
          mb: 3, // 24px bottom margin
          width: '100%',
        }}
      >

        <TextField
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, maxWidth: '600px', mx: 'auto', flexBasis: '100%' }}

          InputProps={{
            endAdornment: (
              <InputAdornment position="end">

                <SearchIcon />

              </InputAdornment>
            ),
          }}
          placeholder="Search by device code"
          value={searchQuery}
          onChange={handleSearchChange}

        />

        {/* <IconButton
          onClick={handleSearchClick}
          aria-label="search devices" >
          <SearchIcon />

        </IconButton> */}
        {['super_admin', 'admin'].includes(role) && (<Box sx={{ flexShrink: 0 }}>
          <Button
            className="default-button"
            variant="contained"
            onClick={() => navigate("/devices/new")}

          >
            + Add Device
          </Button>
        </Box>)}
      </Box>

      <div className="devices-container">
        <div
          className="devices-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", // Responsive columns
            gap: "24px",
          }}
        >
          {filteredDevices.map((device) => (
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