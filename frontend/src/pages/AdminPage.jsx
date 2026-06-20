import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import { AppNavbar } from "../components/AppNavbar";
import apiClient from "../config/api";

function timeAgo(isoString) {
  if (!isoString) return "Never";
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString();
}

export function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient
      .get("/admin/users")
      .then((res) => setUsers(res.data.users))
      .catch(() => setError("Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppNavbar />
      <Container maxWidth="md" sx={{ py: 5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 4 }}>
          <PeopleAltIcon sx={{ color: "text.secondary" }} />
          <Typography variant="h6" fontWeight={600}>
            Users
          </Typography>
          {!loading && !error && (
            <Chip label={users.length} size="small" sx={{ ml: 0.5 }} />
          )}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={28} />
          </Box>
        )}

        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}

        {!loading && !error && (
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>
                    USER
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>
                    EMAIL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>
                    JOINED
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>
                    LAST ACTIVE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: "text.secondary", fontSize: 12 }}>
                    STATUS
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          src={u.avatar_url}
                          alt={u.name}
                          sx={{ width: 30, height: 30, fontSize: 13 }}
                        >
                          {u.name?.[0]?.toUpperCase() ?? "?"}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {u.name ?? "—"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {timeAgo(u.last_active_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.is_active ? "Active" : "Inactive"}
                        size="small"
                        color={u.is_active ? "success" : "default"}
                        variant="outlined"
                        sx={{ fontSize: 11 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Container>
    </Box>
  );
}
