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


export default function DeviceDetailsTable({ device }: { device: DeviceType }) {
  return (
    <TableContainer component={Paper} sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <Typography variant="h6" sx={{ p: 2, backgroundColor: '#14B8A6', fontWeight: 'bold' }}>
        Device Details
      </Typography>
      <Table>
        <TableBody>
          {/* <TableRow >
            <TableCell><strong>ID</strong></TableCell>
            <TableCell>{device.id}</TableCell>
          </TableRow> */}
          <TableRow>
            <TableCell><strong>Device Number</strong></TableCell>
            <TableCell>{device.number}</TableCell>
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
          <TableRow>
            <TableCell><strong>Model</strong></TableCell>
            <TableCell>{device.model}</TableCell>
          </TableRow>
 
          {!!(device.alert_temp_min && device.alert_temp_max) && (
            <TableRow>
              <TableCell><strong>Alert Temperature</strong></TableCell>
              <TableCell>
                {device.alert_temp_min}° - {device.alert_temp_max}°
              </TableCell>
            </TableRow>
          )}
          {!!(device.alert_humidity_min && device.alert_humidity_max) && (
            <TableRow>
              <TableCell><strong>Alert Humidity</strong></TableCell>
              <TableCell>
                {device.alert_humidity_min}% - {device.alert_humidity_min}%
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
