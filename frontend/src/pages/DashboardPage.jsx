import { useNavigate } from 'react-router-dom';
import { Navbar, Container, Row, Col, Card, Button, ListGroup } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <Navbar bg="primary" data-bs-theme="dark" sticky="top">
        <Container>
          <Navbar.Brand className="fw-bold fs-5">Vedic Astro</Navbar.Brand>
          <div className="ms-auto">
            <Button
              variant="danger"
              size="sm"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </Container>
      </Navbar>

      <div className="bg-light" style={{ minHeight: 'calc(100vh - 56px)', paddingTop: '30px', paddingBottom: '30px' }}>
        <Container>
          {/* Welcome Section */}
          <Card className="mb-4 shadow-sm">
            <Card.Body>
              <h2 className="mb-4">Welcome, <span className="text-primary">{user?.name || user?.email}</span>!</h2>

              <div className="bg-light p-3 rounded border-start border-primary border-4">
                <p className="mb-2"><strong>Email:</strong> {user?.email}</p>
                <p className="mb-0"><strong>Name:</strong> {user?.name || 'N/A'}</p>
              </div>
            </Card.Body>
          </Card>

          {/* Features Grid */}
          <h3 className="mb-4 fw-bold">Coming Soon Features</h3>
          <Row className="mb-4">
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h5 className="card-title text-primary mb-3">📊 Birth Chart Analysis</h5>
                  <p className="card-text text-secondary">Detailed astrological insights</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h5 className="card-title text-primary mb-3">📍 Location Search</h5>
                  <p className="card-text text-secondary">Find cities and coordinates</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-3">
              <Card className="h-100 shadow-sm">
                <Card.Body className="text-center">
                  <h5 className="card-title text-primary mb-3">✨ Astrology Readings</h5>
                  <p className="card-text text-secondary">Personalized readings</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Quick Actions */}
          <Card className="shadow-sm">
            <Card.Body>
              <h5 className="card-title mb-3">Quick Actions</h5>
              <ListGroup variant="flush">
                <ListGroup.Item>
                  <strong>→ View Birth Chart</strong>
                  <p className="text-secondary small mb-0">Analyze your astrological chart</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>→ Search Locations</strong>
                  <p className="text-secondary small mb-0">Find coordinates for chart calculations</p>
                </ListGroup.Item>
                <ListGroup.Item>
                  <strong>→ Get Reading</strong>
                  <p className="text-secondary small mb-0">Receive personalized astrology insights</p>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Container>
      </div>
    </>
  );
};
