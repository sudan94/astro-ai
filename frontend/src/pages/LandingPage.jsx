import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { LandingNavbar } from "../components/LandingNavbar";

export const LandingPage = () => {
  return (
    <>
      <LandingNavbar />

      {/* Hero */}
      <section className="bg-light py-5">
        <Container>
          <Row className="justify-content-center text-center">
            <Col md={8}>
              <h1 className="mb-3">
                 An AI-Powered Way to Understand Vedic Astrology
              </h1>
              <p className="text-muted mb-4">
                This project turns complex astrological data into a structured,
                human-readable format without superstition, noise, or confusion.
              </p>
              {/* <Button variant="primary" size="lg">
                Learn More
              </Button> */}
            </Col>
          </Row>
        </Container>
      </section>

      {/* What is this */}
      <section className="py-5" id="features">
        <Container>
          <Row className="mb-4">
            <Col className="text-center">
              <h2>What Is This?</h2>
              <p className="text-muted">
                Not a prediction app. Not a horoscope feed.
              </p>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Structured Data</Card.Title>
                  <Card.Text>
                    Planetary positions, houses, nakshatras, and ascendant
                    presented as clean, explorable data not walls of text.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Vedic Focus</Card.Title>
                  <Card.Text>
                    Built specifically around Vedic astrology concepts such as
                    nakshatras, padas, and planetary motion.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3">
              <Card className="h-100">
                <Card.Body>
                  <Card.Title>Clarity First</Card.Title>
                  <Card.Text>
                    Designed for learners, developers, and curious minds who
                    want understanding not blind belief.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Pricing */}
      <section className="bg-light py-5" id="pricing">
        <Container>
          <Row className="mb-4">
            <Col className="text-center">
              <h2>Pricing</h2>
              <p className="text-muted">
                Simple and transparent.
              </p>
            </Col>
          </Row>

          <Row className="justify-content-center">
            <Col md={4} className="mb-3">
              <Card className="text-center">
                <Card.Body>
                  <h3 className="mb-3">Free</h3>
                  <p className="text-muted">
                    Access to chart structure, planetary data, and basic
                    visualizations.
                  </p>
                  <p className="fw-bold">€0</p>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-3">
              <Card className="text-center border-primary">
                <Card.Body>
                  <h3 className="mb-3">Future Pro</h3>
                  <p className="text-muted">
                    Deeper interpretations, saved charts, and advanced analysis.
                  </p>
                  <p className="fw-bold">Coming later</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* About */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8}>
              <h2 className="text-center mb-3">About This Project</h2>
              <p className="text-muted text-center">
                This is an independent project built with a focus on clarity,
                engineering quality, and respect for traditional systems.
              </p>
              <p className="text-muted text-center">
                The goal is not to replace astrologers but to provide a clean,
                modern interface for understanding complex astrological data.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-light py-4">
        <Container>
          <Row className="text-center">
            <Col>
              <small>
                © {new Date().getFullYear()} Sudan ·
                Made with care · All rights reserved
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </>
  );
};
