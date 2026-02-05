import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  List,
  ListItemButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { locationService } from "../services/locationService";
import { useAuth } from "../hooks/useAuth";

function toDateTimeWithSeconds(value) {
  if (!value) return value;
  if (value.length === 16) return `${value}:00`;
  return value;
}

export const PersonsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [persons, setPersons] = useState([]);

  const [form, setForm] = useState({
    name: "",
    date_of_birth: "",
    place_of_birth: "",
    latitude: "",
    longitude: "",
  });

  const [cityQuery, setCityQuery] = useState("");
  const [cityResults, setCityResults] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);
  const citySearchTimer = useRef(null);

  const canSubmit = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const dobOk = !!form.date_of_birth;
    const latOk = form.latitude !== "" && !Number.isNaN(Number(form.latitude));
    const lngOk = form.longitude !== "" && !Number.isNaN(Number(form.longitude));
    return nameOk && dobOk && latOk && lngOk;
  }, [form]);

  const loadPersons = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await personService.list({ skip: 0, limit: 100 });
      setPersons(data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load persons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
  }, []);

  useEffect(() => {
    if (!showCityResults) return;
    if (!cityQuery || cityQuery.trim().length < 2) {
      setCityResults([]);
      return;
    }

    if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    citySearchTimer.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const results = await locationService.searchCities(cityQuery.trim());
        setCityResults(results || []);
      } catch (e) {
        setCityResults([]);
      } finally {
        setCityLoading(false);
      }
    }, 250);

    return () => {
      if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    };
  }, [cityQuery, showCityResults]);

  const onPickCity = (item) => {
    const place = `${item.city}, ${item.country}`;
    setForm((p) => ({
      ...p,
      place_of_birth: place,
      latitude: String(item.lat),
      longitude: String(item.lng),
    }));
    setCityQuery(place);
    setShowCityResults(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        date_of_birth: toDateTimeWithSeconds(form.date_of_birth),
        place_of_birth: form.place_of_birth?.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      const created = await personService.create(payload);
      navigate(`/persons/${created.id}`);
    } catch (e2) {
      setError(e2?.response?.data?.detail || e2?.message || "Failed to create person");
    } finally {
      setSaving(false);
    }
  };

  const { user } = useAuth();

  return (
    <>
      <AppNavbar user={user} />
      <Box
        sx={{
          backgroundColor: "grey.100",
          minHeight: "calc(100vh - 64px)",
          py: 4,
        }}
      >
        <Container>
          <Grid container spacing={4}>
            <Grid item xs={12} lg={5}>
              <Card>
                <CardContent>
                  <Typography variant="h5" sx={{ mb: 2 }}>
                    Add Person
                  </Typography>
                  {error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  ) : null}

                  <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={2}>
                      <TextField
                        label="Name"
                        value={form.name}
                        onChange={(e2) => setForm((p) => ({ ...p, name: e2.target.value }))}
                        placeholder="Full name"
                        required
                        fullWidth
                      />

                      <TextField
                        label="Date and time of birth"
                        type="datetime-local"
                        value={form.date_of_birth}
                        onChange={(e2) => setForm((p) => ({ ...p, date_of_birth: e2.target.value }))}
                        InputLabelProps={{ shrink: true }}
                        required
                        fullWidth
                      />

                      <Box sx={{ position: "relative" }}>
                        <TextField
                          label="Place of birth"
                          value={cityQuery}
                          onChange={(e2) => {
                            const v = e2.target.value;
                            setCityQuery(v);
                            setForm((p) => ({ ...p, place_of_birth: v }));
                            setShowCityResults(true);
                          }}
                          onFocus={() => setShowCityResults(true)}
                          placeholder="Start typing a city (min 2 chars)"
                          fullWidth
                        />

                        {showCityResults ? (
                          <Paper
                            elevation={3}
                            sx={{
                              position: "absolute",
                              width: "100%",
                              zIndex: 10,
                              mt: 1,
                              maxHeight: 240,
                              overflowY: "auto",
                            }}
                          >
                            {cityLoading ? (
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ p: 2 }}>
                                <CircularProgress size={16} />
                                <Typography variant="body2" color="text.secondary">
                                  Searching...
                                </Typography>
                              </Stack>
                            ) : (
                              <List disablePadding>
                                {(cityResults || []).length === 0 ? (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ p: 2 }}
                                  >
                                    No matches found.
                                  </Typography>
                                ) : (
                                  cityResults.map((item) => (
                                    <ListItemButton
                                      key={`${item.city}-${item.country}-${item.lat}-${item.lng}`}
                                      onClick={() => onPickCity(item)}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          justifyContent: "space-between",
                                          width: "100%",
                                        }}
                                      >
                                        <Box>
                                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                            {item.city}
                                          </Typography>
                                          <Typography variant="caption" color="text.secondary">
                                            {item.country}
                                          </Typography>
                                        </Box>
                                        <Typography variant="caption" color="text.secondary">
                                          {item.lat}, {item.lng}
                                        </Typography>
                                      </Box>
                                    </ListItemButton>
                                  ))
                                )}
                              </List>
                            )}
                          </Paper>
                        ) : null}
                      </Box>

                      <Grid container spacing={2}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Latitude"
                            value={form.latitude}
                            onChange={(e2) => setForm((p) => ({ ...p, latitude: e2.target.value }))}
                            required
                            fullWidth
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                        <Grid item xs={12} md={6}>
                          <TextField
                            label="Longitude"
                            value={form.longitude}
                            onChange={(e2) => setForm((p) => ({ ...p, longitude: e2.target.value }))}
                            required
                            fullWidth
                            InputProps={{ readOnly: true }}
                          />
                        </Grid>
                      </Grid>

                      <Stack direction="row" spacing={2}>
                        <Button type="submit" variant="contained" disabled={!canSubmit || saving}>
                          {saving ? "Creating..." : "Create"}
                        </Button>
                        <Button
                          type="button"
                          variant="outlined"
                          onClick={() => {
                            setForm({
                              name: "",
                              date_of_birth: "",
                              place_of_birth: "",
                              latitude: "",
                              longitude: "",
                            });
                            setCityQuery("");
                            setCityResults([]);
                            setShowCityResults(false);
                            setError("");
                          }}
                          disabled={saving}
                        >
                          Reset
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} lg={7}>
              <Card>
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems={{ sm: "center" }}
                    justifyContent="space-between"
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="h5">Persons</Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<PersonAddAltOutlinedIcon />}
                      >
                        Add Person
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadPersons}
                        disabled={loading}
                      >
                        Refresh
                      </Button>
                    </Stack>
                  </Stack>

                  {loading ? (
                    <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                      <CircularProgress size={18} />
                      <Typography variant="body2">Loading...</Typography>
                    </Stack>
                  ) : (
                    <>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Total: <Chip size="small" label={persons.length} />
                      </Typography>
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
                                  <TableCell sx={{ fontWeight: 600 }}>{p.name}</TableCell>
                                  <TableCell sx={{ color: "text.secondary" }}>
                                    {p.place_of_birth || "-"}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={() => navigate(`/persons/${p.id}`)}
                                    >
                                      Open
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </>
  );
};
