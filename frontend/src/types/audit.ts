export default interface AuditType {
  id?:number
  timestamp: string; // ISO timestamp
  username: string;
  action:string;
  model_name:string;
  object_id: number;
  changes: string;  // Device ID
}
