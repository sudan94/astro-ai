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

export const UserProfilePage = () => {
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
          <Card sx={{ p: 4, maxWidth: 500, width: "100%", mx: "auto" }}>
            <Typography variant="h5" gutterBottom>
              User Profile
            </Typography>
            <Grid container direction="column" spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} >
                <TextField
                  id="outlined-basic"
                  label="Name"
                  variant="outlined"
                  value={user.name}
                  focused
                  fullWidth
                  sx={{ width: "100%", maxWidth: 820 }}
                />
              </Grid>
              <Grid item xs={12} >
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
            <Button variant="contained">Save</Button>
          </Card>

        </Container>
      </Box>
    </>
  );
};
