import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Typography,
} from '@mui/material';
import type { DeviceType } from '../types/index ';

 
export default function DeviceDetailsTable( {device} : {device:DeviceType}) {
  return (
    <TableContainer component={Paper} sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" sx={{ p: 2, backgroundColor: '#14B8A6', fontWeight: 'bold' }}>
        Device Details
      </Typography>
      <Table>
        <TableBody>
          <TableRow >
            <TableCell><strong>ID</strong></TableCell>
            <TableCell>{device.id}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell>{device.name}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Code</strong></TableCell>
            <TableCell>{device.code}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell
              sx={{
                color: device.status.toLowerCase() === 'on' ? 'green' : 'red',
                fontWeight: 'bold',
                textTransform: 'capitalize',
              }}
            >
              {device.status}
            </TableCell>
          </TableRow>
          {!!device.location && (
            <TableRow>
              <TableCell><strong>Location</strong></TableCell>
              <TableCell>{device.location}</TableCell>
            </TableRow>
          )}
          {!!(device.temperature_max&&device.temperature_min) && (
            <TableRow>
              <TableCell><strong>Normal Temp</strong></TableCell>
              <TableCell>
                {device.temperature_min}° - {device.temperature_max}°
              </TableCell>
            </TableRow>
          )}
          {!!(device.humidity_max&&device.humidity_min) && (
            <TableRow>
              <TableCell><strong>Normal Humidity</strong></TableCell>
              <TableCell>
                {device.humidity_min}% - {device.humidity_max}%
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
