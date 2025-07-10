import type { DeviceType } from "../types/index ";

export const mockDevices :DeviceType[]= [
  {
    id: "1",
    name: "Humidor #1",
    code: "Humidor #1",
    location: "Main Factory",
    status: "on",
    normalTemperatureRange: { min: 20, max: 25 },  // Celsius
    normalHumidityRange: { min: 40, max: 60 },     // Percent
    readings: [
      {
        time: "2025-07-02T09:00:00Z",
        temperature: 22.3,
        humidity: 58,
      },
      {
        time: "2025-07-02T09:15:00Z",
        temperature: 26.0,
        humidity: 65, // 🔥 outside range
      },
      {
        time: "2025-07-02T09:30:00Z",
        temperature: 23.5,
        humidity: 55,
      },
    ],
  },
  // ... more devices
];
