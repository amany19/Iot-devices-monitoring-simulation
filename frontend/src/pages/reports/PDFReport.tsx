import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { useEffect, useState } from "react";
import './pdfreport.css';
import {
  FormLabel,
  TextField,
  MenuItem,
  Button,
  InputLabel,
  OutlinedInput,
  Select,
  Checkbox,
  FormControl,
  ListItemText,
} from "@mui/material";
import type { DeviceType } from "../../types/index ";

export default function PDFReport() {
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [devices, setDevices] = useState<DeviceType[] | null>(null);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]); // Changed from DeviceType[] to string[]
  const [selectionId, setSelectionId] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    twentyFourHoursAgo.setHours(0, 0, 0, 0);
    now.setHours(23, 59, 59, 999);
    setStartTime(twentyFourHoursAgo);
    setEndTime(now);

    const fetchDevices = async () => {
      try {
        const response = await fetch("/api/devices/");
        if (!response.ok) throw new Error("Failed to fetch devices");
        const data = await response.json();
        setDevices(data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchDevices();
  }, []);

  const handleGeneratePDF = async () => {
    const start = startTime?.toISOString();
    const end = endTime?.toISOString();

    if (!start || !end) {
      alert("Please select a valid date range.");
      return;
    }

    try {
      if (selectionId === "All Devices") {
        const response = await fetch(`/api/devices/report/all/?start=${start}&end=${end}`);
        if (!response.ok) throw new Error("Failed to generate all devices PDF");
        const blob = await response.blob();
        downloadBlob(blob, "All_Devices_Report.zip");
      } else if (selectionId === "custom") {
        const response = await fetch(`/api/devices/report/?start=${start}&end=${end}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ device_ids: selectedDeviceIds }),
        });
        if (!response.ok) throw new Error("Failed to generate custom report");
        const blob = await response.blob();
        downloadBlob(blob, "Custom_Devices_Report.zip");
      } else {
        const response = await fetch(`/api/devices/${selectionId}/report/?start=${start}&end=${end}`);
        if (!response.ok) throw new Error("Failed to generate device PDF");
        const blob = await response.blob();
        downloadBlob(blob, `Device_${selectionId}_Report.pdf`);
      }
    } catch (error) {
      console.error(error);
      alert("Error generating report");
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="pdf-report-container">
      <h1>Generate PDF Report</h1>
      <div className="date-picker-container">
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            disableFuture
            label="Start Date"
            value={startTime}
            onChange={(newValue: Date | null) => {
              if (newValue) {
                const normalized = new Date(newValue);
                normalized.setHours(0, 0, 0, 0);
                setStartTime(normalized);
              }
            }}
            slotProps={{ textField: { fullWidth: true, variant:"filled", className:"input-field"} }}
          />
          <DatePicker
            disableFuture
            label="End Date"
            value={endTime}
            
            onChange={(newValue: Date | null) => {
              if (newValue) {
                const normalized = new Date(newValue);
                normalized.setHours(23, 59, 59, 999);
                setEndTime(normalized);
              }
            }}
            slotProps={{ textField: { fullWidth: true , variant:"filled", className:"input-field"} }}
          />
        </LocalizationProvider>
      </div>

      <FormLabel sx={{ mb: 2 }}>Select a device</FormLabel>
      <TextField
        select
        fullWidth
        value={selectionId}
        onChange={(e) => setSelectionId(e.target.value)}
         
        variant="filled" className="input-field"
        size="small"
        sx={{ mb: 2 }}
      >
        <MenuItem value="All Devices">All Devices</MenuItem>
        <MenuItem value="custom">Custom multiple devices</MenuItem>
        {devices?.map((device) => (
          <MenuItem key={device.id} value={device?.id?.toString()}>
            {device.name} ({device.code})
          </MenuItem>
        ))}
      </TextField>

      {selectionId === "custom" && (
      <FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Select Devices</InputLabel>
  <Select
    multiple
    value={selectedDeviceIds}
    onChange={(e) =>
      setSelectedDeviceIds(
        typeof e.target.value === "string"
          ? e.target.value.split(",")
          : (e.target.value as string[])
      )
    }
    input={<OutlinedInput label="Select Devices" />}
    renderValue={(selected: string[]) =>
      devices
        ?.filter((d) => d.id !== undefined && selected.includes(d.id.toString()))
        .map((d) => `${d.name} (${d.code})`)
        .join(", ") || ""
    }
  >
    {devices?.map((device) =>
      device.id !== undefined ? (
        <MenuItem key={device.id} value={device.id.toString()}>
          <Checkbox checked={selectedDeviceIds.includes(device.id.toString())} />
          <ListItemText primary={`${device.name} (${device.code})`} />
        </MenuItem>
      ) : null
    )}
  </Select>
</FormControl>

      )}

      <Button
        className="default-button"
        variant="contained"
        color="primary"
        onClick={handleGeneratePDF}
      >
        Download
      </Button>
    </div>
  );
}
