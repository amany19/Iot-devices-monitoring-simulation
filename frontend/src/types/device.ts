import type { ReadingType } from "./index ";

export default interface Device {
    id?: number
    
    number: number // Unique identifier for the device
    code: string
    location: string
    status: "on" | "off"

    humidity_max: number
    humidity_min: number
    temperature_max: number
    temperature_min: number

    // Recently added fields
    model?: string | null;
    manufacturer?: string | null;
    serial_number?: string | null;
    firmware_version?: string | null;

    // Alert thresholds
    alert_temp_min?: number | null;
    alert_temp_max?: number | null;
    alert_humidity_min?: number | null;
    alert_humidity_max?: number | null;

    // Logging
    logging_interval_minutes: number;

    // Toggles
    button_stop_enabled: boolean;
    mute_button_enabled: boolean;
    alarm_tone_enabled: boolean;

    // Storage
    storage_mode?: string | null;

    // Date the device was started
    started_at?: Date|null;
    readings?: ReadingType[]
}