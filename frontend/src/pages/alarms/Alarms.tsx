import {
  Container, Button, Card, Box, Typography, ToggleButtonGroup,
  ToggleButton, Stack, CardContent, Avatar, Chip, TextField
} from "@mui/material";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import OpacityIcon from '@mui/icons-material/Opacity';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';

import type Alarm from '../../types/alarm';
import { useAlarmContext } from "../../context/AlarmContext";
export default function Alarms() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Alarm[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Alarm[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchNotifications = () => {
    fetch("http://localhost:8000/api/alarms/")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data);
        setFilteredNotifications(data);
      })
      .catch(() => {
        setNotifications([]);
        setFilteredNotifications([]);
      });
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);
    applyFilters(query, filter);
  };

  const handleFilterChange = (
    event: React.MouseEvent<HTMLElement>,
    newFilter: string
  ) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      applyFilters(searchQuery, newFilter);
    }
  };

  const applyFilters = (query: string, filter: string) => {
    let filtered = [...notifications];

    if (filter === "temp") {
      filtered = filtered.filter((alarm) => alarm.alarm_type.startsWith("TEMP"));
    } else if (filter === "humidity") {
      filtered = filtered.filter((alarm) => alarm.alarm_type.startsWith("HUM"));
    } else if (filter in ["dc","md","sd"]) {
      filtered = filtered.filter((alarm) => alarm.alarm_type === "DC");
    }

    if (query) {
      filtered = filtered.filter((alarm) =>
        (alarm.title || alarm.user_message).toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };
  const getAlarmIconAndColor = (alarmType: string) => {
    switch (alarmType) {
      case "TEMP_HI":
        return { icon: <DeviceThermostatIcon />, color: "red" };
      case "TEMP_LO":
        return { icon: <DeviceThermostatIcon />, color: "#049df5ff" };
      case "HUM_HI":
        return { icon: <OpacityIcon />, color: "darkblue" };
      case "HUM_LO":
        return { icon: <OpacityIcon />, color: "#bedbfcff" };
      case "SD":
        return { icon: <PowerSettingsNewIcon />, color: "#292a2bff" };

      case "MD":
        return { icon: <PowerSettingsNewIcon />, color: "#292a2bff" };
      case "DC":
        return { icon: <PowerSettingsNewIcon />, color: "#292a2bff" };
      default:
        return { icon: null, color: "default" };
    }
  }
  const { decreaseCount } = useAlarmContext();
  const acknowledgeAlarm = async (alarmId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/alarms/${alarmId}/acknowledge/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
      });
      decreaseCount();
      if (res.ok) {
        fetchNotifications(); // refresh the list
      } else {
        console.error("Failed to acknowledge alarm");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <Container>


      {/* 
      <TextField
        label="Search"
        variant="outlined"
        value={searchQuery}
        onChange={handleSearchChange}
        fullWidth
        margin="normal"
      />
      */}

      <ToggleButtonGroup
        value={filter}
        exclusive
        onChange={handleFilterChange}
        sx={{ mt: 2 }}
      >
        <ToggleButton value="all">All</ToggleButton>
        <ToggleButton value="temp">Temperature</ToggleButton>
        <ToggleButton value="humidity">Humidity</ToggleButton>
        <ToggleButton value="dc">Disconnected</ToggleButton>
      </ToggleButtonGroup>

      <Stack spacing={2} mt={3}>
        {filteredNotifications.map((note) => {
          const { icon, color } = getAlarmIconAndColor(note.alarm_type);
          return (<Card key={note.id} sx={{ backgroundColor: note.acknowledged ? "#f0f0f0" : "#ffffff" }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: '#14B8A6', color: color }}>
                {icon}
              </Avatar>
              <Box ml={2}>
                <Typography variant="subtitle1">
                  {note.device_code}
                </Typography>
                <Typography variant="subtitle2">
                  {note.user_message}
                </Typography>


              </Box>
              <Typography variant="body2" sx={{ ml: 'auto' }} color="text.secondary">
                {new Date(note.timestamp).toLocaleString()}
              </Typography>
              <Button

                className="default-button"
                size="small"
                sx={{
                  ml: 2,
                  color: "#012525ff",
                  fontWeight: "bold",
                }}
                onClick={() => acknowledgeAlarm(note.id)}
                disabled={note.acknowledged}
              >
                {note.acknowledged ? "Acknowledged" : "Acknowledge"}
              </Button>
            </CardContent>


          </Card>)
        })}
      </Stack>
    </Container>
  );
}
