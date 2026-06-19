import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import PersonIcon from "@mui/icons-material/Person";
import MenuIcon from "@mui/icons-material/Menu";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import Tooltip from "@mui/material/Tooltip";
import { useAuth } from "../hooks/useAuth";

const pages = [
  { label: "Home", route: "/dashboard" },
  { label: "Birth Charts", route: "/persons" },
];

export const AppNavbar = ({ user }) => {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleOpenNavMenu = (e) => setAnchorElNav(e.currentTarget);
  const handleCloseNavMenu = () => setAnchorElNav(null);
  const handleOpenUserMenu = (e) => setAnchorElUser(e.currentTarget);
  const handleCloseUserMenu = () => setAnchorElUser(null);

  const handleLogout = async () => {
    handleCloseUserMenu();
    await logout();
    navigate("/login");
  };

  const brandTitle = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <AutoAwesomeIcon sx={{ fontSize: 18, color: "#FFD700", opacity: 0.9 }} />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          letterSpacing: "0.06em",
          fontSize: "inherit",
          color: "#FFFFFF",
          fontFamily: "Georgia, serif",
        }}
      >
        Vedic Astro AI
      </Typography>
    </Box>
  );

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          {/* Desktop brand */}
          <Box
            component={Link}
            to="/dashboard"
            sx={{
              mr: 3,
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              textDecoration: "none",
              fontSize: "1.1rem",
            }}
          >
            {brandTitle}
          </Box>

          {/* Mobile hamburger */}
          <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
            <IconButton
              size="large"
              aria-label="navigation menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: "block", md: "none" } }}
            >
              {pages.map((p) => (
                <MenuItem
                  key={p.route}
                  component={Link}
                  to={p.route}
                  onClick={handleCloseNavMenu}
                >
                  <Typography sx={{ fontWeight: 600 }}>{p.label}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          {/* Mobile brand */}
          <Box
            component={Link}
            to="/dashboard"
            sx={{
              display: { xs: "flex", md: "none" },
              flexGrow: 1,
              alignItems: "center",
              textDecoration: "none",
              fontSize: "1rem",
            }}
          >
            {brandTitle}
          </Box>

          {/* Desktop nav links */}
          <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {pages.map((p) => (
              <Button
                key={p.route}
                component={Link}
                to={p.route}
                sx={{
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  px: 2,
                  "&:hover": {
                    color: "#FFD700",
                    background: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {p.label}
              </Button>
            ))}
          </Box>

          {/* User avatar menu */}
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="Account">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar
                  alt={user?.name}
                  src={user?.avatar_url}
                  sx={{
                    width: 36,
                    height: 36,
                    border: "2px solid rgba(255,215,0,0.6)",
                  }}
                />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: "45px" }}
              id="user-menu"
              anchorEl={anchorElUser}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              keepMounted
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={() => { navigate("/user-profile"); handleCloseUserMenu(); }}>
                <PersonIcon sx={{ mr: 1.5, fontSize: 20, color: "primary.main" }} />
                <Typography>Profile</Typography>
              </MenuItem>
              <MenuItem onClick={handleCloseUserMenu}>
                <SettingsIcon sx={{ mr: 1.5, fontSize: 20, color: "text.secondary" }} />
                <Typography>Settings</Typography>
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1.5, fontSize: 20, color: "error.main" }} />
                <Typography color="error.main">Sign out</Typography>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default AppNavbar;
