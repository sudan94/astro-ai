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
  TextField,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";

import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { locationService } from "../services/locationService";
import { useAuth } from "../hooks/useAuth";
import { PersonTable } from "../components/PersonTable";

function toDateTimeWithSeconds(value) {
  if (!value) return value;
  if (value.length === 16) return `${value}:00`;
  return value;
}

export const PersonsPage = () => {
  const navigate = useNavigate();
  // modal state Add and edit same modal with some conditional logic
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [editModal, setEditModal] = useState(false);
  const [personId, setPersonId] = useState(null);



  function resetForm() {
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
  }

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
    const lngOk =
      form.longitude !== "" && !Number.isNaN(Number(form.longitude));
    return nameOk && dobOk && latOk && lngOk;
  }, [form]);

  const loadPersons = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await personService.list({ skip: 0, limit: 100 });
      setPersons(data || []);
    } catch (e) {
      setError(
        e?.response?.data?.detail || e?.message || "Failed to load persons",
      );
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
      if (editModal) {
        await personService.update(personId, payload);
        loadPersons();
        handleClose();
        resetForm();
        return;
      }
      const created = await personService.create(payload);
      navigate(`/persons/${created.id}`);
    } catch (e2) {
      setError(
        e2?.response?.data?.detail || e2?.message || "Failed to create person",
      );
    } finally {
      setSaving(false);
    }
  };

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [personToDelete, setPersonToDelete] = useState(null);

  const handleEdit = (person) => {
    setEditModal(true);
    setPersonId(person ? person.id : null);
    setForm({
      name: person.name || "",
      date_of_birth: person.date_of_birth
        ? person.date_of_birth.substring(0, 16)
        : "",
      place_of_birth: person.place_of_birth || "",
      latitude: person.latitude !== null ? String(person.latitude) : "",
      longitude: person.longitude !== null ? String(person.longitude) : "",
    });
    setCityQuery(person.place_of_birth || "");
    handleOpen();
  };

  const handleDeletePrompt = (person) => {
    setPersonToDelete(person);
    setDeleteModalOpen(true);
  };

  const handleDelete = async (person) => {
    try {
      await personService.remove(person.id);
      loadPersons();
    } catch (e) {
      alert(
        e?.response?.data?.detail || e?.message || "Failed to delete person",
      );
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
          <Box>
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
                      onClick={() => {
                        handleOpen();
                        resetForm();
                        setEditModal(false);
                      }}
                    >
                      Add Person
                    </Button>
                  </Stack>
                </Stack>

                {loading ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    color="text.secondary"
                  >
                    <CircularProgress size={18} />
                    <Typography variant="body2">Loading...</Typography>
                  </Stack>
                ) : (
                  <>
                    {/* TODO */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component={"span"}
                      sx={{ mb: 1, display: "block" }}
                    >
                      Total: <Chip size="small" label={persons.length} />
                    </Typography>
                    {/* table goes here */}
                    <PersonTable
                      persons={persons}
                      onOpenPerson={(p) => navigate(`/persons/${p.id}`)}
                      onEdit={handleEdit}
                      onDelete={handleDeletePrompt}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Box>
        </Container>
        <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
          <DialogTitle>
            {editModal ? "Edit Person" : "Add Person"}
          </DialogTitle>
          <DialogContent>
            {error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : null}

            <Box component="form" id="person-form" onSubmit={onSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Name"
                  value={form.name}
                  onChange={(e2) =>
                    setForm((p) => ({ ...p, name: e2.target.value }))
                  }
                  placeholder="Full name"
                  required
                  fullWidth
                />

                <TextField
                  label="Date and time of birth"
                  type="datetime-local"
                  value={form.date_of_birth}
                  onChange={(e2) =>
                    setForm((p) => ({ ...p, date_of_birth: e2.target.value }))
                  }
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
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ p: 2 }}
                        >
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
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600 }}
                                    >
                                      {item.city}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {item.country}
                                    </Typography>
                                  </Box>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
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
                      onChange={(e2) =>
                        setForm((p) => ({ ...p, latitude: e2.target.value }))
                      }
                      required
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Longitude"
                      value={form.longitude}
                      onChange={(e2) =>
                        setForm((p) => ({ ...p, longitude: e2.target.value }))
                      }
                      required
                      fullWidth
                      InputProps={{ readOnly: true }}
                    />
                  </Grid>
                </Grid>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              type="button"
              variant="outlined"
              onClick={() => {
                handleClose();
                resetForm();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit || saving}
              form="person-form"
            >
              {saving ? (editModal ? "Saving..." : "Creating...") : "Submit"}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          fullWidth
          maxWidth="xs"
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Are you sure you want to delete this person?
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="outlined"
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                handleDelete(personToDelete);
                setDeleteModalOpen(false);
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </>
  );
};
