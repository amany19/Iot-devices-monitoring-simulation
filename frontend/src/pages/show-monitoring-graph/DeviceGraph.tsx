import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

type Props = {
  data: {
    temperature: number;
    humidity: number;
    timestamp: string;
  }[];
};

export default function DeviceGraph({ data }: Props) {
  return (
    <div style={{ width: "100%", padding: "2rem 0" }}>
      <h3>Temperature</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="temperature" stroke="#991b12ff" name="Temperature (°C)" />
        </LineChart>
      </ResponsiveContainer>

      <h3>Humidity</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid stroke="#ccc" />
          <XAxis dataKey="timestamp" tickFormatter={(t) => new Date(t).toLocaleDateString()} />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="humidity" stroke="#055d91ff" name="Humidity (%)" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
