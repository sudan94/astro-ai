import { useNavigate, Link } from "react-router-dom";
import { Navbar, Container, Nav, Button, Image } from "react-bootstrap";
import { useAuth } from "../hooks/useAuth";
import NavDropdown from "react-bootstrap/NavDropdown";
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';

export const AppNavbar = ({ user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Navbar bg="primary" data-bs-theme="dark" sticky="top" expand="lg">
      <Container>
        <Navbar.Brand className="fw-bold fs-5" as={Link} to="/dashboard">
          Vedic Astro AI
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="main-navbar" />
        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/dashboard">
              Dashboard
            </Nav.Link>
            <Nav.Link as={Link} to="/persons">
              Persons
            </Nav.Link>
          </Nav>
          <div className="ms-auto">
            <NavDropdown data-bs-theme="dark" bg="primary"
              title={
                <Image
                  src={user?.avatar_url}
                  alt="UserName profile image"
                  roundedCircle
                  style={{ width: "32px" }}
                />
              }
              id="basic-nav-dropdown"
            >
              <NavDropdown.Item href="#action/3.1"> <SettingsIcon style={{ fontSize: "14px", marginRight: "5px" }} /> Settings</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}> <LogoutIcon style={{ fontSize: "14px", marginRight: "5px" }} /> Logout</NavDropdown.Item>
            </NavDropdown>
            {/* <Button variant="danger" size="sm" onClick={handleLogout}>
              Logout
            </Button> */}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
