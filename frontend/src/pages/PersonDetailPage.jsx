import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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
} from 'react-bootstrap';
import { AppNavbar } from '../components/AppNavbar';
import { personService } from '../services/personService';
import { chatService } from '../services/chatService';

function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
}

export const PersonDetailPage = () => {
  const { id } = useParams();
  const personId = Number(id);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [person, setPerson] = useState(null);

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content }

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId]
  );

  const loadPerson = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await personService.getById(personId);
      setPerson(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load person');
    } finally {
      setLoading(false);
    }
  };

  const loadSessions = async ({ autoCreateIfEmpty = false } = {}) => {
    setSessionsLoading(true);
    try {
      const data = await chatService.listSessionsForPerson(personId);
      const list = data || [];
      setSessions(list);

      if (list.length > 0) {
        setActiveSessionId((prev) => prev ?? list[0].id);
        return;
      }

      if (autoCreateIfEmpty) {
        const created = await chatService.createSession(personId);
        setSessions([created]);
        setActiveSessionId(created.id);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load chat sessions');
    } finally {
      setSessionsLoading(false);
    }
  };

  const loadHistory = async (sessionId) => {
    if (!sessionId) return;
    setMessagesLoading(true);
    try {
      const data = await chatService.getHistory(sessionId);
      setMessages(data?.messages || []);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load chat history');
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(personId)) return;
    loadPerson();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  useEffect(() => {
    if (!Number.isFinite(personId)) return;
    loadSessions({ autoCreateIfEmpty: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personId]);

  useEffect(() => {
    if (!activeSessionId) return;
    loadHistory(activeSessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId]);

  useEffect(() => {
    if (!bottomRef.current) return;
    bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, messagesLoading, sending]);

  const onNewSession = async () => {
    setError('');
    try {
      const created = await chatService.createSession(personId);
      setSessions((prev) => [created, ...(prev || [])]);
      setActiveSessionId(created.id);
      setMessages([]);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to create session');
    }
  };

  const onSend = async (e) => {
    e.preventDefault();
    if (!activeSessionId) return;
    const text = input.trim();
    if (!text) return;

    setError('');
    setSending(true);
    setInput('');

    // Optimistic append
    setMessages((prev) => [...(prev || []), { role: 'user', content: text }]);
    try {
      const res = await chatService.sendMessage({ sessionId: activeSessionId, message: text });
      setMessages((prev) => [
        ...(prev || []),
        { role: 'assistant', content: res?.assistant_response || '' },
      ]);
      // Refresh sessions so updated_at order stays accurate
      loadSessions({ autoCreateIfEmpty: false });
    } catch (e2) {
      setError(e2?.response?.data?.detail || e2?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AppNavbar />
      <div className="bg-light" style={{ minHeight: 'calc(100vh - 56px)', paddingTop: '30px', paddingBottom: '30px' }}>
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
              <Col lg={4}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <h4 className="mb-0">Person</h4>
                      <Badge bg="secondary">#{person.id}</Badge>
                    </div>

                    <div className="mb-3">
                      <div className="fw-semibold fs-5">{person.name}</div>
                      <div className="text-muted">{person.place_of_birth || '—'}</div>
                    </div>

                    <ListGroup variant="flush">
                      <ListGroup.Item>
                        <div className="text-muted small">Date of birth</div>
                        <div className="fw-semibold">{formatDateTime(person.date_of_birth)}</div>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="text-muted small">Latitude / Longitude</div>
                        <div className="fw-semibold">
                          {person.latitude}, {person.longitude}
                        </div>
                      </ListGroup.Item>
                      <ListGroup.Item>
                        <div className="text-muted small">Created</div>
                        <div className="fw-semibold">{formatDateTime(person.created_at)}</div>
                      </ListGroup.Item>
                    </ListGroup>

                    <div className="mt-3 d-flex gap-2">
                      <Button as={Link} to="/persons" variant="outline-secondary" size="sm">
                        Back
                      </Button>
                      <Button variant="outline-primary" size="sm" onClick={loadPerson}>
                        Refresh
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={8}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <div>
                        <h4 className="mb-0">AI Chat</h4>
                        <div className="text-muted small">
                          Multiple sessions per person. AI uses the generated Vedic chart context.
                        </div>
                      </div>
                      <Button variant="primary" size="sm" onClick={onNewSession} disabled={sessionsLoading}>
                        + New session
                      </Button>
                    </div>

                    <Row className="g-3">
                      <Col md={4}>
                        <Card className="border">
                          <Card.Body>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="fw-semibold">Sessions</div>
                              {sessionsLoading ? <Spinner size="sm" /> : null}
                            </div>

                            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                              <ListGroup>
                                {sessions.length === 0 ? (
                                  <ListGroup.Item className="text-muted">
                                    No sessions yet.
                                  </ListGroup.Item>
                                ) : (
                                  sessions.map((s) => (
                                    <ListGroup.Item
                                      action
                                      key={s.id}
                                      active={s.id === activeSessionId}
                                      onClick={() => setActiveSessionId(s.id)}
                                    >
                                      <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                          <div className="fw-semibold">Session #{s.id}</div>
                                          <div className="small opacity-75">{formatDateTime(s.created_at)}</div>
                                        </div>
                                      </div>
                                    </ListGroup.Item>
                                  ))
                                )}
                              </ListGroup>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={8}>
                        <Card className="border">
                          <Card.Body className="d-flex flex-column" style={{ height: 420 }}>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div className="fw-semibold">
                                {activeSession ? `Session #${activeSession.id}` : 'No session selected'}
                              </div>
                              {messagesLoading ? <Spinner size="sm" /> : null}
                            </div>

                            <div
                              className="bg-light border rounded p-3 mb-3"
                              style={{ flex: 1, overflowY: 'auto' }}
                            >
                              {messagesLoading && messages.length === 0 ? (
                                <div className="text-muted">Loading messages…</div>
                              ) : messages.length === 0 ? (
                                <div className="text-muted">
                                  Ask anything about this person’s chart and life path.
                                </div>
                              ) : (
                                messages.map((m, idx) => (
                                  <div key={`${idx}-${m.role}`} className="mb-2">
                                    <div className="small text-muted">
                                      {m.role === 'assistant' ? 'Assistant' : 'You'}
                                    </div>
                                    <div
                                      className="p-2 rounded"
                                      style={{
                                        background: m.role === 'assistant' ? '#ffffff' : '#e7f1ff',
                                        border: '1px solid #dee2e6',
                                        whiteSpace: 'pre-wrap',
                                      }}
                                    >
                                      {m.content}
                                    </div>
                                  </div>
                                ))
                              )}
                              <div ref={bottomRef} />
                            </div>

                            <Form onSubmit={onSend} className="d-flex gap-2">
                              <Form.Control
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message…"
                                disabled={!activeSessionId || sending}
                              />
                              <Button type="submit" variant="primary" disabled={!activeSessionId || sending}>
                                {sending ? 'Sending…' : 'Send'}
                              </Button>
                            </Form>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
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

