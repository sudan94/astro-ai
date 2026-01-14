import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import { useAuth } from '../hooks/useAuth';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLoginSuccess = async (credentialResponse) => {
    try {
      await login(credentialResponse.credential);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const handleLoginError = () => {
    console.error('Login Failed');
    alert('Login failed. Please try again.');
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }

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
              <Card.Body className="p-4">
                <h1 className="text-center text-primary mb-2 fw-bold">Vedic Astro</h1>
                <p className="text-center text-secondary mb-4">Sign in to your account</p>

                <div className="d-flex justify-content-center mb-3">
                  <GoogleLogin
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                    width="300"
                  />
                </div>

                <hr />
                <p className="text-center text-muted small mb-0">
                  Secure login powered by Google
                </p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};
