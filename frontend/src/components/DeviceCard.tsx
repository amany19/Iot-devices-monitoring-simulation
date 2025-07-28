import { Fragment, useEffect, useState } from "react";
import type Device from "../types/device";
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Button from '@mui/material/Button';
import PowerRounded from '@mui/icons-material/PowerRounded';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { Alert, IconButton, Snackbar, Typography } from "@mui/material";

type Props = {
  device: Device;
  onClick?: () => void;
  onDeleteSuccess?: () => void;
};

export default function DeviceCard({ device, onClick, onDeleteSuccess }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Track snackbar state updates
  useEffect(() => {
    if (showSuccess) {
      console.log("Snackbar should now be visible for:", device.code);
    }
  }, [showSuccess]);

  const handleCloseSnackbar = () => {
    setShowSuccess(false);
    setError(null);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Device ${device.code}`)) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/devices/${device.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete device!');
      }

      setShowSuccess(true); // triggers useEffect

      // Call the success callback to let parent refresh
      onDeleteSuccess?.();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Fragment>
      <Card className="device-card">
        <IconButton
          className="card-delete-icon"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="delete device"
        >
          <DeleteForeverIcon color={isDeleting ? "disabled" : "error"} />
        </IconButton>

        <CardContent>
          <h2>{device.code}</h2>
          <h3>Device number{device.number}</h3>
          <p>Location: {device.location}</p>
          <div>
            Status
            <Typography sx={{ color: device.status?.toLocaleLowerCase() === "on" ? '#10B981' : '#EF4444' }}>
              {device.status} <PowerRounded />
            </Typography>
          </div>
        </CardContent>

        <CardActions>
          <Button
            className='default-button'
            size="small"
            variant="contained"
            onClick={onClick}
          >
            View Details
          </Button>
        </CardActions>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={showSuccess}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 999 }}
      >
        <Alert
          severity="success"
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          Device {device.code} was deleted successfully!
        </Alert>
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        sx={{ zIndex: 999 }}
      >
        <Alert
          severity="error"
          onClose={handleCloseSnackbar}
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Fragment>
  );
}
