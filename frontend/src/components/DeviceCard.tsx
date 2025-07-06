import type Device from "../types/device";

export default function DeviceCard({ name, location, status, normalTemperatureRange, normalHumidityRange }: Device) {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
      <div>
        <h2 className="text-lg font-semibold text-gray-800">{name}</h2>
        <p className="text-sm text-gray-500">{location}</p>
        <span
          className={`text-sm font-medium ${status === "on" ? "text-green-600" : "text-red-600"}`}
        >
          ● {status}
        </span>
      </div>
      <div className="flex gap-6 items-center text-right">
        <div>
          <p className="text-sm text-gray-400">Temp</p>
          <p className="font-semibold text-gray-800">min: {normalTemperatureRange.min} max: {normalTemperatureRange.max}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Humidity</p>
          <p className="font-semibold text-gray-800">min:{normalHumidityRange.min} max:{normalHumidityRange.max}</p>
        </div>
        <button className="border border-gray-300 px-3 py-1 rounded-md hover:bg-gray-100">
          Manage
        </button>
      </div>
    </div>
  );
}
