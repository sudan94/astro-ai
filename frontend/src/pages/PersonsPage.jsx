import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap';
import { AppNavbar } from '../components/AppNavbar';
import { personService } from '../services/personService';
import { locationService } from '../services/locationService';

function toDateTimeWithSeconds(value) {
  // value from <input type="datetime-local" /> => "YYYY-MM-DDTHH:MM" (or with seconds)
  if (!value) return value;
  if (value.length === 16) return `${value}:00`;
  return value;
}

export const PersonsPage = () => {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [persons, setPersons] = useState([]);

  const [form, setForm] = useState({
    name: '',
    date_of_birth: '',
    place_of_birth: '',
    latitude: '',
    longitude: '',
  });

  const [cityQuery, setCityQuery] = useState('');
  const [cityResults, setCityResults] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [showCityResults, setShowCityResults] = useState(false);
  const citySearchTimer = useRef(null);

  const canSubmit = useMemo(() => {
    const nameOk = form.name.trim().length > 0;
    const dobOk = !!form.date_of_birth;
    const latOk = form.latitude !== '' && !Number.isNaN(Number(form.latitude));
    const lngOk = form.longitude !== '' && !Number.isNaN(Number(form.longitude));
    return nameOk && dobOk && latOk && lngOk;
  }, [form]);

  const loadPersons = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await personService.list({ skip: 0, limit: 100 });
      setPersons(data || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load persons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPersons();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!showCityResults) return;
    if (!cityQuery || cityQuery.trim().length < 2) {
      setCityResults([]);
      return;
    }

    if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    citySearchTimer.current = setTimeout(async () => {
      setCityLoading(true);
      try {
        const results = await locationService.searchCities(cityQuery.trim());
        setCityResults(results || []);
      } catch (e) {
        setCityResults([]);
      } finally {
        setCityLoading(false);
      }
    }, 250);

    return () => {
      if (citySearchTimer.current) clearTimeout(citySearchTimer.current);
    };
  }, [cityQuery, showCityResults]);

  const onPickCity = (item) => {
    const place = `${item.city}, ${item.country}`;
    setForm((p) => ({
      ...p,
      place_of_birth: place,
      latitude: String(item.lat),
      longitude: String(item.lng),
    }));
    setCityQuery(place);
    setShowCityResults(false);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        date_of_birth: toDateTimeWithSeconds(form.date_of_birth),
        place_of_birth: form.place_of_birth?.trim() || null,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      };
      const created = await personService.create(payload);
      navigate(`/persons/${created.id}`);
    } catch (e2) {
      setError(e2?.response?.data?.detail || e2?.message || 'Failed to create person');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="bg-light" style={{ minHeight: 'calc(100vh - 56px)', paddingTop: '30px', paddingBottom: '30px' }}>
        <Container>
          <Row className="g-4">
            <Col lg={5}>
              <Card className="shadow-sm">
                <Card.Body>
                  <h4 className="mb-3">Add Person</h4>
                  {error ? <Alert variant="danger">{error}</Alert> : null}

                  <Form onSubmit={onSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name</Form.Label>
                      <Form.Control
                        value={form.name}
                        onChange={(e2) => setForm((p) => ({ ...p, name: e2.target.value }))}
                        placeholder="Full name"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Date & time of birth</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={form.date_of_birth}
                        onChange={(e2) => setForm((p) => ({ ...p, date_of_birth: e2.target.value }))}
                        name ="date_of_birth"
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3" style={{ position: 'relative' }}>
                      <Form.Label>Place of birth</Form.Label>
                      <Form.Control
                        value={cityQuery}
                        onChange={(e2) => {
                          const v = e2.target.value;
                          setCityQuery(v);
                          setForm((p) => ({ ...p, place_of_birth: v }));
                          setShowCityResults(true);
                        }}
                        onFocus={() => setShowCityResults(true)}
                        placeholder="Start typing a city (min 2 chars)"
                      />

                      {showCityResults ? (
                        <div
                          className="bg-white border rounded shadow-sm"
                          style={{
                            position: 'absolute',
                            width: '100%',
                            zIndex: 10,
                            marginTop: '6px',
                            maxHeight: '240px',
                            overflowY: 'auto',
                          }}
                        >
                          {cityLoading ? (
                            <div className="p-3 d-flex align-items-center gap-2">
                              <Spinner size="sm" />
                              <span className="text-muted">Searching…</span>
                            </div>
                          ) : (
                            <ListGroup variant="flush">
                              {(cityResults || []).length === 0 ? (
                                <ListGroup.Item className="text-muted">
                                  No matches found.
                                </ListGroup.Item>
                              ) : (
                                cityResults.map((item) => (
                                  <ListGroup.Item
                                    action
                                    key={`${item.city}-${item.country}-${item.lat}-${item.lng}`}
                                    onClick={() => onPickCity(item)}
                                  >
                                    <div className="d-flex align-items-center justify-content-between">
                                      <div>
                                        <div className="fw-semibold">{item.city}</div>
                                        <div className="text-muted small">{item.country}</div>
                                      </div>
                                      <div className="text-muted small">
                                        {item.lat}, {item.lng}
                                      </div>
                                    </div>
                                  </ListGroup.Item>
                                ))
                              )}
                            </ListGroup>
                          )}
                        </div>
                      ) : null}
                    </Form.Group>

                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Latitude</Form.Label>
                          <Form.Control
                            value={form.latitude}
                            onChange={(e2) => setForm((p) => ({ ...p, latitude: e2.target.value }))}
                            required
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Longitude</Form.Label>
                          <Form.Control
                            value={form.longitude}
                            onChange={(e2) => setForm((p) => ({ ...p, longitude: e2.target.value }))}
                            required
                            readOnly
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <div className="d-flex gap-2">
                      <Button type="submit" variant="primary" disabled={!canSubmit || saving}>
                        {saving ? 'Creating…' : 'Create'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline-secondary"
                        onClick={() => {
                          setForm({ name: '', date_of_birth: '', place_of_birth: '', latitude: '', longitude: '' });
                          setCityQuery('');
                          setCityResults([]);
                          setShowCityResults(false);
                          setError('');
                        }}
                        disabled={saving}
                      >
                        Reset
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={12}>
              <Card className="shadow-sm">
                <Card.Body>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <h4 className="mb-0">Persons</h4>
                    <Button variant="success" size="sm">
                      Add Person
                    </Button>
                    <Button variant="outline-primary" size="sm" onClick={loadPersons} disabled={loading}>
                      Refresh
                    </Button>
                  </div>

                  {loading ? (
                    <div className="d-flex align-items-center gap-2 text-muted">
                      <Spinner size="sm" />
                      Loading…
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 text-muted small">
                        Total: <Badge bg="secondary">{persons.length}</Badge>
                      </div>
                      <Table striped hover responsive className="mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: 80 }}>ID</th>
                            <th>Name</th>
                            <th>Birth place</th>
                            <th style={{ width: 140 }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {persons.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-muted">
                                No persons yet. Create one on the left.
                              </td>
                            </tr>
                          ) : (
                            persons.map((p) => (
                              <tr key={p.id}>
                                <td>{p.id}</td>
                                <td className="fw-semibold">{p.name}</td>
                                <td className="text-muted">{p.place_of_birth || '—'}</td>
                                <td>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => navigate(`/persons/${p.id}`)}
                                  >
                                    Open
                                  </Button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  );
};

