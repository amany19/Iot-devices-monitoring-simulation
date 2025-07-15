import React, { useEffect, useState } from "react";
import DeviceGraph from "../show-monitoring-graph/DeviceGraph";
import { useParams } from "react-router-dom";
import DeviceDetailsTable from "../../components/DeviceDetailsTable";
import type { DeviceType } from '../../types/index ';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import "./deviceDetails.css";

export default function DevicesDetails() {
  const { id } = useParams<{ id: string }>();

  const [startTime, setStartTime] = useState<Date | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);
  const [device, setDevice] = useState<DeviceType | null>(null);
  const [readings, setReadings] = useState([]);

  useEffect(() => {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours in ms

    setStartTime(twentyFourHoursAgo);
    setEndTime(now);
  }, []);


  useEffect(() => {
    const fetchDeviceData = async () => {
      try {
        const response = await fetch(`/api/devices/${id}/`);
        if (!response.ok) throw new Error("Failed to fetch device data");
        const deviceData = await response.json();
        setDevice(deviceData);
      } catch (error) {
        console.error(error);
      }
    };

    if (id) fetchDeviceData();
  }, [id]);


  useEffect(() => {
    const fetchDeviceReadings = async () => {
      try {
        const response = await fetch(
          `/api/devices/${id}/readings/?start=${startTime?.toISOString()}&end=${endTime?.toISOString()}`
        );
        if (!response.ok) throw new Error("Failed to fetch device readings");
        const deviceReadings = await response.json();
        setReadings(deviceReadings);
      } catch (error) {
        console.error(error);
      }
    };

    if (id && startTime && endTime) fetchDeviceReadings();
  }, [id, startTime, endTime]);

  return (
    <div>
      <div className="device-table-section">
        <h2>Device {device?.code}</h2>
        {device && <DeviceDetailsTable device={device} />}
      </div>
      <h3>Readings</h3>

      <p>
        Showing readings from{" "}
        {startTime ? startTime.toLocaleString() : "[Select Start Date]"} to{" "}
        {endTime ? endTime.toLocaleString() : "[Select End Date]"}
      </p>

      <div style={{ display: "flex", gap: "1rem", marginBottom: "1rem" }}>
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
            slotProps={{ textField: { fullWidth: true } }}
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
            slotProps={{ textField: { fullWidth: true } }}
          />
        </LocalizationProvider>
      </div>

      <DeviceGraph data={readings} />
    </div>
  );
}
