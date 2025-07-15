export default interface Reading {
  id?:number
  time: string; // ISO timestamp
  temperature: number;
  humidity: number;
  device: number;  // Device ID
}
