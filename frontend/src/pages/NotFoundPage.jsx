import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

export const NotFoundPage = () => {
  return (
    <div className="d-flex align-items-center justify-content-center" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <Card className="shadow-lg">
              <Card.Body className="p-4 text-center">
                <h1 className="display-1 text-primary fw-bold mb-2">404</h1>
                <h2 className="text-secondary mb-4">Page not found</h2>
                <p className="text-muted mb-4">
                  The page you're looking for doesn't exist or has been moved.
                </p>
                <Button
                  variant="primary"
                  size="lg"
                  as={Link}
                  to="/dashboard"
                  className="w-100"
                >
                  Go to Dashboard
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
