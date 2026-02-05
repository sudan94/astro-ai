import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { astroService } from "../services/astroService";
import VedicChartView from "../components/VedicChart";
import { useAuth } from "../hooks/useAuth";

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export const PersonDetailPage = () => {
  const { id } = useParams();
  const personId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [person, setPerson] = useState(null);

  const [astroLoading, setAstroLoading] = useState(true);
  const [astro, setAstro] = useState(null);

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const normalizeMaybeJson = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      const parsed = safeJsonParse(value);
      return parsed ?? value;
    }
    return value;
  };

  const loadPerson = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await personService.getById(personId);
      setPerson(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load person");
    } finally {
      setLoading(false);
    }
  };

  const loadAstro = async () => {
    setAstroLoading(true);
    try {
      const data = await astroService.getSavedForPerson(personId);
      setAstro(data);
    } catch (e) {
      setAstro(null);
      setError(e?.response?.data?.detail || e?.message || "Failed to load chart");
    } finally {
      setAstroLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(personId)) return;
    loadPerson();
    loadAstro();
  }, [personId]);

  const onRegenerateChart = async () => {
    setError("");
    setAstroLoading(true);
    try {
      await astroService.generateVedicChart(personId);
      await loadAstro();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to generate chart");
    } finally {
      setAstroLoading(false);
    }
  };

  const chartDetails = normalizeMaybeJson(astro?.vedic_chart);
  const { user } = useAuth();

  return (
    <>
      <AppNavbar user={user} />
      <Box sx={{ backgroundColor: "grey.100", minHeight: "100vh", py: 4 }}>
        <Container maxWidth="lg" sx={{ height: "100%" }}>
          {error ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          ) : null}

          {loading ? (
            <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
              <CircularProgress size={18} />
              <Typography variant="body2">Loading person...</Typography>
            </Stack>
          ) : !person ? (
            <Alert severity="warning">Person not found.</Alert>
          ) : (
            <Grid container spacing={4}>
              <Grid item xs={12} >
                <Card >
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ sm: "center" }}
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h5">Person</Typography>
                      <Chip label={`#${person.id}`} size="small" />
                    </Stack>

                    <Grid container spacing={3} sx={{ mb: 2 }}>
                      <Grid item xs={12} >
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {person.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {person.place_of_birth || "-"}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Date of birth
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDateTime(person.date_of_birth)}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Latitude / Longitude
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {person.latitude}, {person.longitude}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="caption" color="text.secondary">
                          Created
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatDateTime(person.created_at)}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      <Button component={Link} to="/persons" variant="outlined" size="small">
                        Back
                      </Button>
                      <Button
                        component={Link}
                        to={`/persons/${personId}/chat`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="contained"
                        size="small"
                      >
                        Open Chat
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      alignItems={{ sm: "center" }}
                      justifyContent="space-between"
                      spacing={2}
                      sx={{ mb: 2 }}
                    >
                      <Typography variant="h5">Chart and AI Analysis</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={onRegenerateChart}
                          disabled={astroLoading}
                        >
                          Re-generate
                        </Button>
                      </Stack>
                    </Stack>

                    {astroLoading ? (
                      <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
                        <CircularProgress size={18} /> <Typography variant="body2">Loading chart...</Typography>
                      </Stack>
                    ) : !astro ? (
                      <Alert severity="warning">No saved astro data found yet.</Alert>
                    ) : (
                      <>
                        <Card sx={{ mb: 3 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              Ascendant
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {chartDetails?.ascendant_sign}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Longitude: {chartDetails?.ascendant?.longitude?.toFixed(2)} deg
                            </Typography>
                          </CardContent>
                        </Card>

                        <Accordion defaultExpanded>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 600 }}>AI Analysis</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {(() => {
                              const analysis = normalizeMaybeJson(astro.ai_analysis);
                              if (!analysis) return <Typography color="text.secondary">-</Typography>;
                              if (typeof analysis === "string") {
                                return (
                                  <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap" }}>
                                    {analysis}
                                  </Box>
                                );
                              }

                              const summary = analysis?.summary;
                              const renderList = (title, items) => (
                                <Box sx={{ mb: 2 }}>
                                  <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
                                  {(items || []).length === 0 ? (
                                    <Typography color="text.secondary">-</Typography>
                                  ) : (
                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                      {items.map((it, idx) => (
                                        <li key={`${title}-${idx}`}>{String(it)}</li>
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              );
                              const renderObjectList = (title, items) => (
                                <Box sx={{ mb: 2 }}>
                                  <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{title}</Typography>
                                  {(items || []).length === 0 ? (
                                    <Typography color="text.secondary">-</Typography>
                                  ) : (
                                    <Box component="ul" sx={{ m: 0, pl: 2 }}>
                                      {items.map((it, idx) => (
                                        <li key={`${title}-${idx}`}>
                                          <Typography sx={{ fontWeight: 600 }}>
                                            {it.name || "-"}
                                          </Typography>
                                          {it.description ? (
                                            <Typography variant="body2" color="text.secondary">
                                              {it.description}
                                            </Typography>
                                          ) : null}
                                        </li>
                                      ))}
                                    </Box>
                                  )}
                                </Box>
                              );

                              return (
                                <>
                                  {summary ? (
                                    <Box sx={{ mb: 3 }}>
                                      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                                        Summary
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Core identity
                                      </Typography>
                                      <Typography sx={{ mb: 1 }}>
                                        {summary.core_identity || "-"}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Life focus
                                      </Typography>
                                      <Typography sx={{ mb: 1 }}>
                                        {summary.life_focus || "-"}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Overall tone
                                      </Typography>
                                      <Typography>{summary.overall_tone || "-"}</Typography>
                                    </Box>
                                  ) : null}

                                  {renderList("Personality", analysis.personality)}
                                  {renderList("Career", analysis.career)}
                                  {renderList("Relationships", analysis.relationships)}
                                  {renderList("Strengths", analysis.strengths)}
                                  {renderList("Challenges", analysis.challenges)}
                                  {renderList("Health tendencies", analysis.health_tendencies)}
                                  {renderList("Spiritual path", analysis.spiritual_path)}
                                  {renderObjectList("Key yogas", analysis.key_yogas)}
                                  {renderObjectList("Key doshas", analysis.key_doshas)}
                                </>
                              );
                            })()}
                          </AccordionDetails>
                        </Accordion>

                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography sx={{ fontWeight: 600 }}>Full Vedic Chart</Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            {(() => {
                              const chart = normalizeMaybeJson(astro.vedic_chart);
                              if (!chart) return <Typography color="text.secondary">-</Typography>;

                              if (typeof chart === "string") {
                                return (
                                  <Box component="pre" sx={{ m: 0, whiteSpace: "pre-wrap" }}>
                                    {chart}
                                  </Box>
                                );
                              }

                              return <VedicChartView chart={chart} />;
                            })()}
                          </AccordionDetails>
                        </Accordion>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </>
  );
};
