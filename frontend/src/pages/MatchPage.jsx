import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { useAuth } from "../hooks/useAuth";
import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { matchService } from "../services/matchService";

const SCORE_COLOR = (obtained, max) => {
  const pct = obtained / max;
  if (pct >= 0.75) return "success.main";
  if (pct >= 0.4)  return "warning.main";
  return "error.main";
};

function ScoreBar({ obtained, max }) {
  const pct = (obtained / max) * 100;
  return (
    <Box sx={{ position: "relative", height: 8, borderRadius: 4, background: "rgba(0,0,0,0.08)", overflow: "hidden" }}>
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${pct}%`,
          borderRadius: 4,
          background: pct >= 75 ? "#2e7d32" : pct >= 40 ? "#ed6c02" : "#d32f2f",
          transition: "width 0.8s ease",
        }}
      />
    </Box>
  );
}

function CompatibilityRing({ total, max }) {
  const pct = (total / max) * 100;
  const color = pct >= 75 ? "#2e7d32" : pct >= 50 ? "#ed6c02" : "#d32f2f";
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" value={100} size={150} thickness={5}
        sx={{ color: "rgba(0,0,0,0.08)", position: "absolute" }} />
      <CircularProgress variant="determinate" value={pct} size={150} thickness={5}
        sx={{ color }} />
      <Box sx={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1 }}>{total}</Typography>
        <Typography variant="caption" color="text.secondary">out of {max}</Typography>
      </Box>
    </Box>
  );
}

export const MatchPage = () => {
  const { user } = useAuth();
  const [persons, setPersons] = useState([]);
  const [personsLoading, setPersonsLoading] = useState(true);
  const [person1Id, setPerson1Id] = useState("");
  const [person2Id, setPerson2Id] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    personService.list({ skip: 0, limit: 100 }).then((data) => {
      setPersons(data || []);
    }).catch(() => {}).finally(() => setPersonsLoading(false));
  }, []);

  const onMatch = async () => {
    if (!person1Id || !person2Id || person1Id === person2Id) return;
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const data = await matchService.kundali(Number(person1Id), Number(person2Id));
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Matching failed");
    } finally {
      setLoading(false);
    }
  };

  const kutas = result
    ? Object.values(result.scores)
    : [];

  const totalPct = result ? (result.total / result.max) * 100 : 0;

  return (
    <>
      <AppNavbar user={user} />
      <Box sx={{ backgroundColor: "background.default", minHeight: "calc(100vh - 64px)", py: 4 }}>
        <Container maxWidth="md">

          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 1, mb: 1 }}>
              <FavoriteIcon sx={{ color: "primary.main", fontSize: 30 }} />
              <Typography variant="h4" fontWeight={800}>Kundali Matching</Typography>
            </Box>
            <Typography variant="body1" color="text.secondary">
              Ashtakoota Guna Milan — Vedic compatibility analysis across 8 dimensions
            </Typography>
          </Box>

          {/* Selector card */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                Select Two Birth Charts
              </Typography>
              {personsLoading ? (
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" color="text.secondary">Loading charts…</Typography>
                </Box>
              ) : persons.length < 2 ? (
                <Alert severity="info">
                  You need at least 2 birth charts to compare. Add them from the Birth Charts page.
                </Alert>
              ) : (
                <Grid container spacing={2} alignItems="flex-end">
                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth style={{ minWidth: 210 }}>
                      <InputLabel >Person 1 (Boy / Groom)</InputLabel>
                      <Select value={person1Id} label="Person 1 (Boy / Groom)"
                        onChange={(e) => setPerson1Id(e.target.value)}>
                        {persons.map((p) => (
                          <MenuItem key={p.id} value={p.id} disabled={p.id === Number(person2Id)}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={2} sx={{ textAlign: "center" }}>
                    <Typography variant="h5" sx={{ color: "primary.main", fontFamily: "Georgia, serif", marginBottom: 1 }}>
                      ❤
                    </Typography>
                  </Grid>

                  <Grid item xs={12} sm={5}>
                    <FormControl fullWidth style={{ minWidth: 210 }}>
                      <InputLabel>Person 2 (Girl / Bride)</InputLabel>
                      <Select value={person2Id} label="Person 2 (Girl / Bride)"
                        onChange={(e) => setPerson2Id(e.target.value)}>
                        {persons.map((p) => (
                          <MenuItem key={p.id} value={p.id} disabled={p.id === Number(person1Id)}>
                            {p.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      color="warning"
                      onClick={onMatch}
                      disabled={!person1Id || !person2Id || person1Id === person2Id || loading}
                      startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <AutoAwesomeIcon />}
                    >
                      {loading ? "Calculating…" : "Calculate Compatibility"}
                    </Button>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <>
              {/* Score ring */}
              <Card sx={{ mb: 3 }} >
                <CardContent sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>
                    {result.person1.name} & {result.person2.name}
                  </Typography>
                  <CompatibilityRing total={result.total} max={result.max} />
                  <Typography variant="h6" sx={{ mt: 2, fontWeight: 600, color: totalPct >= 75 ? "success.main" : totalPct >= 50 ? "warning.main" : "error.main" }}>
                    {totalPct >= 75 ? "Excellent Match" : totalPct >= 50 ? "Good Match" : totalPct >= 30 ? "Average Match" : "Needs Consideration"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 480, mx: "auto" }}>
                    {result.conclusion}
                  </Typography>
                </CardContent>
              </Card>

              {/* Mangal Dosha banner */}
              {result.mangal_note && (
                <Alert
                  severity="warning"
                  icon={<WarningAmberIcon />}
                  sx={{ mb: 3 }}
                >
                  {result.mangal_note}
                </Alert>
              )}

              {/* Profile comparison */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Astrological Profiles</Typography>
                  <Grid container spacing={2}>
                    {[result.person1, result.person2].map((p, i) => (
                      <Grid item xs={12} sm={6} key={i} style={{minWidth: 400}}>
                        <Box sx={{
                          p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider",
                          background: "rgba(194,65,12,0.03)"
                        }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5, color: "primary.main" }}>
                            {p.name}
                          </Typography>
                          {[
                            ["Rashi (Moon Sign)", p.rashi],
                            ["Nakshatra", `${p.nakshatra} - Pada ${p.nakshatra_pada}`],
                            ["Varna", p.varna],
                            ["Vasya", p.vasya],
                            ["Gana", p.gana],
                            ["Nadi", p.nadi],
                            ["Yoni", p.yoni],
                          ].map(([label, value]) => (
                            <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                              <Typography variant="caption" color="text.secondary">{label}</Typography>
                              <Typography variant="caption" fontWeight={600}>{value}</Typography>
                            </Box>
                          ))}
                          <Divider sx={{ my: 1 }} />
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">Mangal Dosha</Typography>
                            {p.mangal_dosha === "None" ? (
                              <Chip size="small" icon={<CheckCircleOutlineIcon />} label="None" color="success" variant="outlined" />
                            ) : (
                              <Chip size="small" icon={<WarningAmberIcon />} label={p.mangal_dosha} color="warning" variant="outlined" />
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Ashtakoota table */}
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Ashtakoota Scores</Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Kuta</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Area of Life</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                          <TableCell sx={{ fontWeight: 700 }} align="center">Score</TableCell>
                          <TableCell sx={{ fontWeight: 700, minWidth: 120 }}>Progress</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {kutas.map((k) => (
                          <TableRow key={k.name} hover>
                            <TableCell sx={{ fontWeight: 700 }}>{k.name}</TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">{k.area}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" color="text.secondary">{k.detail}</Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography
                                variant="body2"
                                fontWeight={700}
                                sx={{ color: SCORE_COLOR(k.obtained, k.max) }}
                              >
                                {k.obtained} / {k.max}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <ScoreBar obtained={k.obtained} max={k.max} />
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow sx={{ background: "rgba(194,65,12,0.06)" }}>
                          <TableCell colSpan={3} sx={{ fontWeight: 800, fontSize: 15 }}>
                            Total Guna Points
                          </TableCell>
                          <TableCell align="center">
                            <Typography
                              variant="body1"
                              fontWeight={800}
                              sx={{ color: totalPct >= 75 ? "success.main" : totalPct >= 50 ? "warning.main" : "error.main" }}
                            >
                              {result.total} / {result.max}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <ScoreBar obtained={result.total} max={result.max} />
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Stack direction="row" spacing={2} sx={{ mt: 2, flexWrap: "wrap" }}>
                    <Chip size="small" sx={{ background: "#2e7d32", color: "#fff" }} label="≥ 27 — Excellent" />
                    <Chip size="small" sx={{ background: "#ed6c02", color: "#fff" }} label="18–26 — Good" />
                    <Chip size="small" sx={{ background: "#d32f2f", color: "#fff" }} label="< 18 — Needs review" />
                  </Stack>
                </CardContent>
              </Card>
            </>
          )}
        </Container>
      </Box>
    </>
  );
};
