import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button, Form, Spinner } from "react-bootstrap";
import { chatService } from "../services/chatService";
import { personService } from "../services/personService";

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const formatDateTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString();
};

const Markdown = ({ children }) => (
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    components={{
      a: (props) => (
        <a {...props} target="_blank" rel="noopener noreferrer">
          {props.children}
        </a>
      ),
      code: ({ inline, children, ...props }) => {
        if (inline) {
          return (
            <code
              {...props}
              style={{
                background: "#f1f3f5",
                padding: "2px 6px",
                borderRadius: 6,
              }}
            >
              {children}
            </code>
          );
        }
        return (
          <pre
            style={{
              background: "#0b1020",
              color: "#e6edf3",
              padding: 14,
              borderRadius: 10,
              overflowX: "auto",
            }}
          >
            <code {...props}>{children}</code>
          </pre>
        );
      },
    }}
  >
    {children}
  </ReactMarkdown>
);

export const PersonChatPage = () => {
  const { id } = useParams();
  const personId = Number(id);

  const [error, setError] = useState("");
  const [person, setPerson] = useState(null);
  const [personLoading, setPersonLoading] = useState(true);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);

  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messages, setMessages] = useState([]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) || null,
    [sessions, activeSessionId],
  );

  const loadPerson = async () => {
    setPersonLoading(true);
    try {
      const data = await personService.getById(personId);
      setPerson(data);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to load person");
    } finally {
      setPersonLoading(false);
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
      setError(e?.response?.data?.detail || e?.message || "Failed to load chat sessions");
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
      setError(e?.response?.data?.detail || e?.message || "Failed to load chat history");
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(personId)) return;
    loadPerson();
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
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, messagesLoading, sending]);

  const onNewSession = async () => {
    setError("");
    try {
      const created = await chatService.createSession(personId);
      setSessions((prev) => [created, ...(prev || [])]);
      setActiveSessionId(created.id);
      setMessages([]);
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to create session");
    }
  };

  const onSend = async () => {
    if (!activeSessionId) return;
    const text = input.trim();
    if (!text) return;

    setError("");
    setSending(true);
    setInput("");

    setMessages((prev) => [...(prev || []), { role: "user", content: text }]);
    try {
      const res = await chatService.sendMessage({ sessionId: activeSessionId, message: text });
      setMessages((prev) => [
        ...(prev || []),
        { role: "assistant", content: res?.assistant_response || "" },
      ]);
      loadSessions({ autoCreateIfEmpty: false });
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const headerTitle = personLoading
    ? "Loading…"
    : person
      ? `Chat — ${person.name}`
      : "Chat";

  return (
    <div style={{ height: "100vh", display: "flex", background: "#ffffff" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid #e9ecef",
          background: "#f8f9fa",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: 16, borderBottom: "1px solid #e9ecef" }}>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{headerTitle}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" variant="primary" onClick={onNewSession} disabled={sessionsLoading}>
              New chat
            </Button>
            <Button
              size="sm"
              variant="outline-secondary"
              as={Link}
              to={`/persons/${personId}`}
            >
              Person
            </Button>
          </div>
          {error ? (
            <div style={{ marginTop: 10, color: "#b02a37", fontSize: 13 }}>{error}</div>
          ) : null}
        </div>

        <div style={{ padding: 10, overflowY: "auto", flex: 1 }}>
          <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 8 }}>
            Sessions {sessionsLoading ? <Spinner size="sm" /> : null}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {sessions.length === 0 ? (
              <div style={{ color: "#6c757d", fontSize: 13 }}>No sessions yet.</div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSessionId(s.id)}
                  style={{
                    textAlign: "left",
                    border: "1px solid #dee2e6",
                    background: s.id === activeSessionId ? "#e7f1ff" : "#ffffff",
                    padding: "10px 12px",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Session #{s.id}</div>
                  <div style={{ fontSize: 12, color: "#6c757d" }}>
                    {formatDateTime(s.created_at)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e9ecef" }}>
          <div style={{ fontWeight: 700 }}>
            {activeSession ? `Session #${activeSession.id}` : "No session selected"}
            {messagesLoading ? <span style={{ marginLeft: 10 }}><Spinner size="sm" /></span> : null}
          </div>
          <div style={{ color: "#6c757d", fontSize: 13 }}>
            Chat messages render as Markdown (supports headings like <code>##</code>, lists, code blocks, etc.)
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "18px 0" }}>
          <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 18px" }}>
            {messages.length === 0 ? (
              <div style={{ color: "#6c757d" }}>
                Start by asking a question about the person’s chart.
              </div>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                const raw = typeof m.content === "string" ? m.content : String(m.content);
                const maybeParsed = safeJsonParse(raw);
                const content = maybeParsed ? `\`\`\`json\n${JSON.stringify(maybeParsed, null, 2)}\n\`\`\`` : raw;

                return (
                  <div
                    key={`${idx}-${m.role}`}
                    style={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      marginBottom: 14,
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "85%",
                        background: isUser ? "#e7f1ff" : "#f8f9fa",
                        border: "1px solid #dee2e6",
                        borderRadius: 14,
                        padding: "10px 12px",
                      }}
                    >
                      <div style={{ fontSize: 12, color: "#6c757d", marginBottom: 6 }}>
                        {isUser ? "You" : "Assistant"}
                      </div>
                      <div style={{ fontSize: 14, lineHeight: 1.45 }}>
                        <Markdown>{content}</Markdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div style={{ borderTop: "1px solid #e9ecef", padding: 16 }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <Form
              onSubmit={(e) => {
                e.preventDefault();
                onSend();
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message… (Enter to send, Shift+Enter for newline)"
                  disabled={!activeSessionId || sending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  style={{ resize: "none" }}
                />
                <Button type="submit" variant="primary" disabled={!activeSessionId || sending}>
                  {sending ? "Sending…" : "Send"}
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

