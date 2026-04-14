import { useState, useMemo } from "react";
import {
  Box,
  Card,
  Container,
  Grid,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";
import { AppNavbar } from "../components/AppNavbar";
import { authService } from "../services/authService";

export const UserProfilePage = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user.name || "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    return nameOk;
  }, [form]);

  const onSubmit = async (e) => {
    e.preventDefault();

    setError("");
    // if (!canSubmit) return;

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
      };
      await authService.updateProfile(user.id, payload);
      setForm({ name: payload.name });
    } catch (e2) {
      setError(
        e2?.response?.data?.detail || e2?.message || "Failed to update user",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppNavbar user={user} />

      <Box
        component="form"
        id="user-form"
        onSubmit={onSubmit}
        sx={{
          backgroundColor: "grey.100",
          minHeight: "calc(100vh - 64px)",
          py: 4,
        }}
      >
        <Container>
          <Card sx={{ p: 4, maxWidth: 500, width: "100%", mx: "auto" }}>
            <Typography variant="h5" gutterBottom>
              User Profile
            </Typography>
            <Grid container direction="column" spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12}>
                <TextField
                  id="outlined-basic"
                  label="Name"
                  variant="outlined"
                  value={form.name}
                  fullWidth
                  onChange={(e2) =>
                    setForm((p) => ({ ...p, name: e2.target.value }))
                  }
                  sx={{ width: "100%", maxWidth: 820 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="outlined-basic"
                  label="Email"
                  variant="outlined"
                  disabled
                  value={user.email}
                  focused
                  fullWidth
                  sx={{ width: "100%", maxWidth: 820 }}
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" form="user-form">
              Save
            </Button>
          </Card>
        </Container>
      </Box>
    </>
  );
};
