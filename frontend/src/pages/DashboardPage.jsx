import { useEffect, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import AutoStoriesIcon from "@mui/icons-material/AutoStories";
import { useAuth } from "../hooks/useAuth";
import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { horoscopeService } from "../services/horoscopeService";

const ZODIAC = [
  { sign: "aries",       symbol: "♈", vedic: "Mesha",      color: "#E53935" },
  { sign: "taurus",      symbol: "♉", vedic: "Vrishabha",   color: "#43A047" },
  { sign: "gemini",      symbol: "♊", vedic: "Mithuna",     color: "#FB8C00" },
  { sign: "cancer",      symbol: "♋", vedic: "Karka",       color: "#1E88E5" },
  { sign: "leo",         symbol: "♌", vedic: "Simha",       color: "#F4511E" },
  { sign: "virgo",       symbol: "♍", vedic: "Kanya",       color: "#6D4C41" },
  { sign: "libra",       symbol: "♎", vedic: "Tula",        color: "#8E24AA" },
  { sign: "scorpio",     symbol: "♏", vedic: "Vrishchika",  color: "#D81B60" },
  { sign: "sagittarius", symbol: "♐", vedic: "Dhanus",      color: "#3949AB" },
  { sign: "capricorn",   symbol: "♑", vedic: "Makara",      color: "#546E7A" },
  { sign: "aquarius",    symbol: "♒", vedic: "Kumbha",      color: "#039BE5" },
  { sign: "pisces",      symbol: "♓", vedic: "Meena",       color: "#00897B" },
];

function HoroscopeBlock({ loading, error, data, period, zodiac }) {
  if (loading) {
    return (
      <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", py: 2 }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Consulting the stars…
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          background: "rgba(0,0,0,0.03)",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }
  if (!data) return null;

  const text = data?.data?.horoscope;
  const date = data?.data?.date;

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        background: `linear-gradient(135deg, rgba(194,65,12,0.05) 0%, rgba(180,83,9,0.04) 100%)`,
        border: "1px solid",
        borderColor: "rgba(194,65,12,0.18)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontSize: 22 }}>{zodiac.symbol}</Typography>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} sx={{ textTransform: "capitalize" }}>
            {zodiac.sign} {period === "weekly" ? "— This Week" : `— ${date}`}
          </Typography>
          {period === "weekly" && (
            <Typography variant="caption" color="text.secondary">
              Vedic Rashi: {zodiac.vedic}
            </Typography>
          )}
        </Box>
      </Box>
      <Typography variant="body1" sx={{ lineHeight: 1.85, color: "text.primary" }}>
        {text}
      </Typography>
    </Box>
  );
}

export const DashboardPage = () => {
  const { user } = useAuth();

  const [personCount, setPersonCount] = useState(null);

  const [tab, setTab] = useState(0);
  const [selectedSign, setSelectedSign] = useState("aries");

  const [westernData, setWesternData] = useState(null);
  const [westernLoading, setWesternLoading] = useState(false);
  const [westernError, setWesternError] = useState("");

  const [vedicData, setVedicData] = useState(null);
  const [vedicLoading, setVedicLoading] = useState(false);
  const [vedicError, setVedicError] = useState("");

  useEffect(() => {
    personService.list({ skip: 0, limit: 100 }).then((data) => {
      setPersonCount((data || []).length);
    }).catch(() => setPersonCount(0));
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchWestern = async () => {
      setWesternLoading(true);
      setWesternError("");
      setWesternData(null);
      try {
        const data = await horoscopeService.getWestern(selectedSign);
        if (!cancelled) setWesternData(data);
      } catch {
        if (!cancelled) setWesternError("Could not load Western horoscope. Please try again later.");
      } finally {
        if (!cancelled) setWesternLoading(false);
      }
    };

    const fetchVedic = async () => {
      setVedicLoading(true);
      setVedicError("");
      setVedicData(null);
      try {
        const data = await horoscopeService.getVedic(selectedSign);
        if (!cancelled) setVedicData(data);
      } catch {
        if (!cancelled) setVedicError("Could not load Vedic horoscope. For personalized Vedic readings, open your Birth Chart and use the AI reading.");
      } finally {
        if (!cancelled) setVedicLoading(false);
      }
    };

    fetchWestern();
    fetchVedic();

    return () => { cancelled = true; };
  }, [selectedSign]);

  const zodiac = ZODIAC.find((z) => z.sign === selectedSign);
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const circleValue = personCount ? Math.min(personCount * 12, 96) : 0;

  return (
    <>
      <AppNavbar user={user} />

      <Box sx={{ backgroundColor: "background.default", minHeight: "calc(100vh - 64px)", py: 4 }}>
        <Container>

          {/* Welcome */}
          <Card sx={{ mb: 4 }}>
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h4" sx={{ mb: 0.5 }}>
                Welcome,{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  {user?.name || user?.email}
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {todayStr}
              </Typography>
            </CardContent>
          </Card>

          {/* Stats row */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 4,
                    textAlign: "center",
                  }}
                >
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ letterSpacing: "0.12em", mb: 2 }}
                  >
                    Birth Charts Created
                  </Typography>

                  <Box sx={{ position: "relative", display: "inline-flex", mb: 2 }}>
                    {/* Track ring */}
                    <CircularProgress
                      variant="determinate"
                      value={100}
                      size={110}
                      thickness={4}
                      sx={{ color: "rgba(194,65,12,0.1)", position: "absolute" }}
                    />
                    {/* Value ring */}
                    <CircularProgress
                      variant="determinate"
                      value={personCount === null ? 0 : circleValue}
                      size={110}
                      thickness={4}
                      color="primary"
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {personCount === null ? (
                        <CircularProgress size={20} />
                      ) : (
                        <>
                          <Typography
                            variant="h3"
                            color="primary"
                            fontWeight={800}
                            sx={{ lineHeight: 1 }}
                          >
                            {personCount}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            charts
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    {personCount === 1
                      ? "1 person in your Jyotish journal"
                      : `${personCount ?? "—"} people in your Jyotish journal`}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Daily Horoscope */}
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
                <AutoAwesomeIcon sx={{ color: "secondary.main" }} />
                <Typography variant="h6" fontWeight={700}>
                  Daily Horoscope
                </Typography>
              </Box>

              {/* Sign picker */}
              <FormControl size="small" sx={{ mb: 3, minWidth: 240 }}>
                <InputLabel>Your Zodiac Sign</InputLabel>
                <Select
                  value={selectedSign}
                  label="Your Zodiac Sign"
                  onChange={(e) => setSelectedSign(e.target.value)}
                >
                  {ZODIAC.map((z) => (
                    <MenuItem key={z.sign} value={z.sign}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography sx={{ fontSize: 18 }}>{z.symbol}</Typography>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ textTransform: "capitalize" }}>
                            {z.sign}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {z.vedic}
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Tabs */}
              <Tabs
                value={tab}
                onChange={(_, v) => setTab(v)}
                sx={{
                  mb: 3,
                  "& .MuiTab-root": { fontWeight: 600, textTransform: "none" },
                }}
              >
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <AutoStoriesIcon sx={{ fontSize: 16 }} />
                      Western Daily
                    </Box>
                  }
                />
                <Tab
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 16 }} />
                      Vedic Weekly
                    </Box>
                  }
                />
              </Tabs>

              {tab === 0 && (
                <HoroscopeBlock
                  loading={westernLoading}
                  error={westernError}
                  data={westernData}
                  period="daily"
                  zodiac={zodiac}
                />
              )}

              {tab === 1 && (
                <HoroscopeBlock
                  loading={vedicLoading}
                  error={vedicError}
                  data={vedicData}
                  period="weekly"
                  zodiac={zodiac}
                />
              )}
            </CardContent>
          </Card>

        </Container>
      </Box>
    </>
  );
};
