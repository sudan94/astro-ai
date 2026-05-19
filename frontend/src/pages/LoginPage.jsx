import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import {
  Box,
  Button,
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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        await login(tokenResponse.access_token);
        navigate("/dashboard");
      } catch (error) {
        console.error("Login failed:", error);
        alert("Login failed. Please try again.");
      }
    },
    onError: () => {
      console.error("Google Login Failed");
      alert("Login failed. Please try again.");
    },
  });

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
              <Button
                variant="outlined"
                onClick={() => googleLogin()}
                sx={{ width: 300, py: 1.2, textTransform: "none", fontSize: "0.95rem" }}
                startIcon={
                  <svg width="18" height="18" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                }
              >
                Sign in with Google
              </Button>
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
