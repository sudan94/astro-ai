import {
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export const PersonTable = ({ persons, onOpenPerson, onEdit, onDelete }) => {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 80 }}>ID</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Birth place</TableCell>
            <TableCell sx={{ width: 140 }}>Action</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {persons.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} sx={{ color: "text.secondary" }}>
                No persons yet. Create one on the left.
              </TableCell>
            </TableRow>
          ) : (
            persons.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.id}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>
                  <Link
                    component="button"
                    variant="body2"
                    onClick={() => onOpenPerson?.(p)}
                  >
                    {p.name}
                  </Link>
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>
                  {p.place_of_birth || "-"}
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      color="success"
                      onClick={() => onEdit?.(p)}
                    >
                      <EditIcon fontSize="small" sx={{ mr: 0.5 }} />
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => onDelete?.(p)}
                    >
                      <DeleteIcon fontSize="small" sx={{ mr: 0.5 }} />
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
