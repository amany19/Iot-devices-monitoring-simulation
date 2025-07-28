export default interface Alarm {
  id: number;
  alarm_type: string;
  timestamp: string;
  acknowledged: boolean;
  device: number;
    
  active: boolean;
  user_message: string;
  title?: string;
 
  device_code: string;
 
  severity: string;
}