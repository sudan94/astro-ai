import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import AnalyticsOutlinedIcon from "@mui/icons-material/AnalyticsOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import { useAuth } from "../hooks/useAuth";
import { AppNavbar } from "../components/AppNavbar";

export const DashboardPage = () => {
  const navigate = useNavigate();
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
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Welcome,{" "}
                <Box component="span" sx={{ color: "primary.main" }}>
                  {user?.name || user?.email}
                </Box>
                !
              </Typography>

              <Box
                sx={{
                  backgroundColor: "grey.50",
                  p: 2,
                  borderLeft: 4,
                  borderColor: "primary.main",
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {user?.name || "N/A"}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Typography variant="h5" sx={{ mb: 3, fontWeight: 700 }}>
            Coming Soon Features
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <AnalyticsOutlinedIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    Birth Chart Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Detailed astrological insights
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <PlaceOutlinedIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    Location Search
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Find cities and coordinates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent sx={{ textAlign: "center" }}>
                  <AutoAwesomeOutlinedIcon color="primary" sx={{ fontSize: 36, mb: 1 }} />
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                    Astrology Readings
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Personalized readings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <List disablePadding>
                <ListItem divider secondaryAction={
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => navigate("/persons")}
                  >
                    Open
                  </Button>
                }>
                  <ListItemText
                    primary="Manage Persons"
                    secondary="Add people and open person detail pages"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText
                    primary="View Birth Chart"
                    secondary="Analyze your astrological chart"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem divider>
                  <ListItemText
                    primary="Search Locations"
                    secondary="Find coordinates for chart calculations"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Get Reading"
                    secondary="Receive personalized astrology insights"
                    primaryTypographyProps={{ fontWeight: 600 }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
};
