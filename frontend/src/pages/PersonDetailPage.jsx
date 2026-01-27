import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Row,
  Spinner,
} from "react-bootstrap";
import { AppNavbar } from "../components/AppNavbar";
import { personService } from "../services/personService";
import { astroService } from "../services/astroService";

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export const PersonDetailPage = () => {
  const { id } = useParams();
  const personId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [person, setPerson] = useState(null);

  const [astroLoading, setAstroLoading] = useState(true);
  const [astro, setAstro] = useState(null);

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const normalizeMaybeJson = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    if (typeof value === "string") {
      const parsed = safeJsonParse(value);
      return parsed ?? value;
    }
    return value;
  };

  const loadPerson = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await personService.getById(personId);
      setPerson(data);
    } catch (e) {
      setError(
        e?.response?.data?.detail || e?.message || "Failed to load person",
      );
    } finally {
      setLoading(false);
    }
  };

  const loadAstro = async () => {
    setAstroLoading(true);
    try {
      const data = await astroService.getSavedForPerson(personId);
      setAstro(data);
    } catch (e) {
      setAstro(null);
      setError(
        e?.response?.data?.detail || e?.message || "Failed to load chart",
      );
    } finally {
      setAstroLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(personId)) return;
    loadPerson();
    loadAstro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  const onRegenerateChart = async () => {
    setError("");
    setAstroLoading(true);
    try {
      await astroService.generateVedicChart(personId);
      await loadAstro();
    } catch (e) {
      setError(
        e?.response?.data?.detail || e?.message || "Failed to generate chart",
      );
    } finally {
      setAstroLoading(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <div
        className="bg-light"
        style={{
          minHeight: "calc(100vh - 56px)",
          paddingTop: "30px",
          paddingBottom: "30px",
        }}
      >
        <Container>
          {error ? <Alert variant="danger">{error}</Alert> : null}

          {loading ? (
            <div className="d-flex align-items-center gap-2 text-muted">
              <Spinner size="sm" />
              Loading person…
            </div>
          ) : !person ? (
            <Alert variant="warning">Person not found.</Alert>
          ) : (
            <Row className="g-4">
              <Col lg={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h4 className="mb-0">Person</h4>
                      <Badge bg="secondary">#{person.id}</Badge>
                    </div>
                    <Row className="mb-3">
                      <Col lg={3} className="mb-3">
                        <div className="fw-semibold fs-5">{person.name}</div>
                        <div className="text-muted">
                          {person.place_of_birth || "—"}
                        </div>
                      </Col>
                      <Col lg={3} className="mb-3">
                        <div className="text-muted small">Date of birth</div>
                        <div className="fw-semibold">
                          {formatDateTime(person.date_of_birth)}
                        </div>
                      </Col>
                      <Col lg={3} className="mb-3">
                        <div className="text-muted small">
                          Latitude / Longitude
                        </div>
                        <div className="fw-semibold">
                          {person.latitude}, {person.longitude}
                        </div>
                      </Col>
                      <Col lg={3} className="mb-3">
                        <div className="text-muted small">Created</div>
                        <div className="fw-semibold">
                          {formatDateTime(person.created_at)}
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex flex-wrap gap-2">
                      <Button
                        as={Link}
                        to="/persons"
                        variant="outline-secondary"
                        size="sm"
                      >
                        Back
                      </Button>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={loadPerson}
                      >
                        Refresh
                      </Button>
                      <Button
                        as={Link}
                        to={`/persons/${personId}/chat`}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="primary"
                        size="sm"
                      >
                        Open Chat (full screen)
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={12}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <div>
                        <h4 className="mb-0">Chart & AI Analysis</h4>
                        <div className="text-muted small">
                          Loaded from the saved `astro` table (summary, AI
                          analysis, full chart JSON).
                        </div>
                      </div>
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={loadAstro}
                          disabled={astroLoading}
                        >
                          Refresh
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={onRegenerateChart}
                          disabled={astroLoading}
                        >
                          Re-generate
                        </Button>
                      </div>
                    </div>

                    {astroLoading ? (
                      <div className="d-flex align-items-center gap-2 text-muted">
                        <Spinner size="sm" /> Loading chart…
                      </div>
                    ) : !astro ? (
                      <Alert variant="warning" className="mb-0">
                        No saved astro data found yet.
                      </Alert>
                    ) : (
                      <>
                        <Row className="g-3 mb-3">
                          <Col md={4}>
                            <Card className="border">
                              <Card.Body>
                                <div className="text-muted small">
                                  Ascendant sign
                                </div>
                                <div className="fw-semibold fs-5">
                                  {astro.ascendent_sign || "—"}
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                          <Col md={8}>
                            <Card className="border">
                              <Card.Body>
                                <div className="text-muted small mb-1">
                                  Summary
                                </div>
                                <pre
                                  className="mb-0"
                                  style={{ whiteSpace: "pre-wrap" }}
                                >
                                  {astro.summary || "—"}
                                </pre>
                              </Card.Body>
                            </Card>
                          </Col>
                        </Row>

                        <Accordion alwaysOpen>
                          <Accordion.Item eventKey="analysis">
                            <Accordion.Header>
                              AI Analysis (saved)
                            </Accordion.Header>
                            <Accordion.Body>
                              {(() => {
                                const analysis = normalizeMaybeJson(
                                  astro.ai_analysis,
                                );
                                if (!analysis)
                                  return <div className="text-muted">—</div>;
                                if (typeof analysis === "string") {
                                  return (
                                    <pre
                                      className="mb-0"
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      {analysis}
                                    </pre>
                                  );
                                }

                                const summary = analysis?.summary;
                                const renderList = (title, items) => (
                                  <div className="mb-3">
                                    <div className="fw-semibold mb-1">
                                      {title}
                                    </div>
                                    {(items || []).length === 0 ? (
                                      <div className="text-muted">—</div>
                                    ) : (
                                      <ul className="mb-0">
                                        {items.map((it, idx) => (
                                          <li key={`${title}-${idx}`}>
                                            {String(it)}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );
                                const renderObjectList = (title, items) => (
                                  <div className="mb-3">
                                    <div className="fw-semibold mb-1">
                                      {title}
                                    </div>

                                    {(items || []).length === 0 ? (
                                      <div className="text-muted">—</div>
                                    ) : (
                                      <ul className="mb-0">
                                        {items.map((it, idx) => (
                                          <li
                                            key={`${title}-${idx}`}
                                            className="mb-2"
                                          >
                                            <div className="fw-semibold">
                                              {it.name || "—"}
                                            </div>

                                            {it.description && (
                                              <div className="text-muted small">
                                                {it.description}
                                              </div>
                                            )}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                );

                                return (
                                  <>
                                    {summary ? (
                                      <div className="mb-3">
                                        <div className="fw-semibold mb-1">
                                          Summary
                                        </div>
                                        <div className="text-muted small">
                                          Core identity
                                        </div>
                                        <div className="mb-2">
                                          {summary.core_identity || "—"}
                                        </div>
                                        <div className="text-muted small">
                                          Life focus
                                        </div>
                                        <div className="mb-2">
                                          {summary.life_focus || "—"}
                                        </div>
                                        <div className="text-muted small">
                                          Overall tone
                                        </div>
                                        <div className="mb-0">
                                          {summary.overall_tone || "—"}
                                        </div>
                                      </div>
                                    ) : null}

                                    {renderList(
                                      "Personality",
                                      analysis.personality,
                                    )}
                                    {renderList("Career", analysis.career)}
                                    {renderList(
                                      "Relationships",
                                      analysis.relationships,
                                    )}
                                    {renderList(
                                      "Strengths",
                                      analysis.strengths,
                                    )}
                                    {renderList(
                                      "Challenges",
                                      analysis.challenges,
                                    )}
                                    {renderList(
                                      "Health tendencies",
                                      analysis.health_tendencies,
                                    )}
                                    {renderList(
                                      "Spiritual path",
                                      analysis.spiritual_path,
                                    )}
                                    {renderObjectList(
                                      "Key yogas",
                                      analysis.key_yogas,
                                    )}
                                    {renderObjectList(
                                      "Key doshas",
                                      analysis.key_doshas,
                                    )}
                                  </>
                                );
                              })()}
                            </Accordion.Body>
                          </Accordion.Item>

                          <Accordion.Item eventKey="chart">
                            <Accordion.Header>
                              Full Vedic Chart (saved)
                            </Accordion.Header>
                            <Accordion.Body>
                              {(() => {
                                const chart = normalizeMaybeJson(
                                  astro.vedic_chart,
                                );
                                if (!chart)
                                  return <div className="text-muted">—</div>;
                                if (typeof chart === "string") {
                                  return (
                                    <pre
                                      className="mb-0"
                                      style={{ whiteSpace: "pre-wrap" }}
                                    >
                                      {chart}
                                    </pre>
                                  );
                                }
                                return (
                                  <pre
                                    className="mb-0"
                                    style={{
                                      whiteSpace: "pre-wrap",
                                      overflowX: "auto",
                                    }}
                                  >
                                    {JSON.stringify(chart, null, 2)}
                                  </pre>
                                );
                              })()}
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
        </Container>
      </div>
    </>
  );
};
