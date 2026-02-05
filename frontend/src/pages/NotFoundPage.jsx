import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from "@mui/material";

export const NotFoundPage = () => {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Card elevation={6}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h2" sx={{ fontWeight: 800, color: "primary.main" }}>
              404
            </Typography>
            <Typography variant="h5" sx={{ color: "text.secondary", mb: 2 }}>
              Page not found
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
              The page you are looking for does not exist or has been moved.
            </Typography>
            <Button
              component={Link}
              to="/dashboard"
              variant="contained"
              size="large"
              fullWidth
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
