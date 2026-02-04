import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Typography,
} from "@mui/material";
import { useAuth } from "../hooks/useAuth";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please try again.");
    }
  };

  const handleLoginError = () => {
    console.error("Login Failed");
    alert("Login failed. Please try again.");
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress size={28} />
      </Box>
    );
  }

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
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              textAlign="center"
              sx={{ fontWeight: 800, color: "primary.main", mb: 1 }}
            >
              Vedic Astro AI
            </Typography>
            <Typography
              variant="body2"
              textAlign="center"
              sx={{ color: "text.secondary", mb: 3 }}
            >
              Sign in to your account
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <GoogleLogin
                onSuccess={handleLoginSuccess}
                onError={handleLoginError}
                width="300"
              />
            </Box>

            <Divider sx={{ mb: 2 }} />
            <Typography variant="caption" color="text.secondary" textAlign="center" display="block">
              Secure login powered by Google
            </Typography>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
