import { useState, useEffect } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Button,
  Stack,
  IconButton,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import EditIcon from '@mui/icons-material/Edit';
import ManufacturerModal from '../../components/ManufacturerModal';
import type { ManufacturerType } from '../../types/index ';
 

export default function ManufacturerPage() {
  const [manufacturers, setManufacturers] = useState<ManufacturerType[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<ManufacturerType | null>(null);
const accessToken =localStorage.getItem('access')
  const fetchManufacturers = async () => {
    try {
      const res = await fetch('/api/manufacturers/',{
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, 
        }},)
      const data = await res.json();
      setManufacturers(data);
    } catch (error) {
      console.error('Error fetching manufacturers:', error);
    }
  };

  useEffect(() => {
    fetchManufacturers();
  }, []);

  const handleAddManufacturer = async (name: string) => {
    try {
      await fetch('/api/manufacturers/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, 

        },
        body: JSON.stringify({ name }),
      });
      fetchManufacturers();
    } catch (error) {
      console.error('Error adding manufacturer:', error);
    }
  };

  const handleEditManufacturer = async (name: string) => {
    if (!selectedManufacturer) return;
    try {
      await fetch(`/api/manufacturers/${selectedManufacturer.id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, 

        },
        body: JSON.stringify({ name }),
      });
      fetchManufacturers();
      setSelectedManufacturer(null);
    } catch (error) {
      console.error('Error editing manufacturer:', error);
    }
  };

  const handleDeleteManufacturer = async (id: number) => {
    try {
      await fetch(`/api/manufacturers/${id}/`, {
        
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${accessToken}`}, 

      });
      fetchManufacturers();
    } catch (error) {
      console.error('Error deleting manufacturer:', error);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <div>
       
      <Button variant="contained"       className="default-button"
          onClick={() => setOpenAdd(true)}>
        Add Manufacturer
      </Button>

      <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{ backgroundColor: '#14B8A6', fontWeight: 'bold', width: '50%' }}
                  align="center"
                >
                  Name
                </TableCell>
                <TableCell
                  sx={{ backgroundColor: '#14B8A6', fontWeight: 'bold', width: '50%' }}
                  align="center"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {manufacturers
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((manufacturer) =>
                  manufacturer.id !== undefined ? (
                    <TableRow key={manufacturer.id} hover>
                      <TableCell align="center">{manufacturer.name}</TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={5} justifyContent="center">
                          <IconButton
                            sx={{ color: '#111827' }}
                            aria-label="edit manufacturer"
                            onClick={() => {
                              setSelectedManufacturer(manufacturer);
                              setOpenEdit(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            sx={{ color: 'red' }}
                            aria-label="delete manufacturer"
                            onClick={() => handleDeleteManufacturer(manufacturer.id!)}
                          >
                            <DeleteForeverIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ) : null
                )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={manufacturers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* ADD MODAL */}
      <ManufacturerModal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        onSubmit={handleAddManufacturer}
        title="Add Manufacturer"
      />

      {/* EDIT MODAL */}
      <ManufacturerModal
        open={openEdit}
        onClose={() => {
          setOpenEdit(false);
          setSelectedManufacturer(null);
        }}
        onSubmit={handleEditManufacturer}
        title="Edit Manufacturer"
        initialName={selectedManufacturer?.name || ''}
      />
    </div>
  );
}
