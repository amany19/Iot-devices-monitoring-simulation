import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableRow, Paper, Typography } from "@mui/material";
import type AuditType from "../../types/audit";

export default function Audit() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/audit-logs/", {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
    })
      .then(res => res.json())
      .then(data => {setLogs(data);
        // console.log(data)
      });
  }, []);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Audit Logs</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Timestamp</TableCell>
            <TableCell>User</TableCell>
            <TableCell>Action</TableCell>
            <TableCell>Model</TableCell>
            <TableCell>Object ID</TableCell>
            <TableCell>Changes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log:AuditType, index) => (
            <TableRow key={index}>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
              <TableCell>{log.username}</TableCell>
              <TableCell>{log.action}</TableCell>
              <TableCell>{log.model_name}</TableCell>
              <TableCell>{log.object_id}</TableCell>
              <TableCell>{log.changes}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}
