import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

export const LandingNavbar = () => {
      return (
    <>
      <Navbar bg="primary" data-bs-theme="dark">
        <Container>
          <Navbar.Brand href="#home">Vedic Astro AI</Navbar.Brand>
          <Nav className="me-auto">
            <Nav.Link href="#features">Features</Nav.Link>
            <Nav.Link href="#pricing">Pricing</Nav.Link>
          </Nav>
          <Nav className="ms-auto">
            <Nav.Link href="/login" className='d-flex'>Login</Nav.Link>
            </Nav>
        </Container>
      </Navbar>
    </>
  );
};

