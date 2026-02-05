import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  ButtonBase,
  IconButton,
  Drawer,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import AddCommentOutlinedIcon from "@mui/icons-material/AddCommentOutlined";
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import SendIcon from "@mui/icons-material/Send";
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));

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

  const [sidebarOpen, setSidebarOpen] = useState(true);

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
  }, [personId]);

  useEffect(() => {
    setSidebarOpen(!isSmallScreen);
  }, [isSmallScreen]);

  useEffect(() => {
    if (!activeSessionId) return;
    loadHistory(activeSessionId);
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
    ? "Loading..."
    : person
      ? `Chat - ${person.name}`
      : "Chat";

  const handleMenuClick = () => {
    if (isSmallScreen) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  const sidebarContent = (
    <Box
      sx={{
        width: 320,
        height: "100%",
        borderRight: "1px solid",
        borderColor: "divider",
        background: "grey.50",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Typography sx={{ fontWeight: 700, fontSize: 16, mb: 0.5 }}>
            {headerTitle}
          </Typography>
          <IconButton
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="contained"
            onClick={onNewSession}
            disabled={sessionsLoading}
            startIcon={<AddCommentOutlinedIcon />}
          >
            New chat
          </Button>
          <Button
            size="small"
            variant="outlined"
            component={Link}
            to={`/persons/${personId}`}
            startIcon={<PersonOutlinedIcon />}
          >
            Person
          </Button>
        </Box>
        {error ? (
          <Typography sx={{ mt: 1, color: "error.main", fontSize: 13 }}>
            {error}
          </Typography>
        ) : null}
      </Box>

      <Box sx={{ p: 1.5, overflowY: "auto", flex: 1 }}>
        <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
          Your chats {sessionsLoading ? <CircularProgress size={12} /> : null}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
          {sessions.length === 0 ? (
            <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
              No chats yet.
            </Typography>
          ) : (
            sessions.map((s) => (
              <ButtonBase
                key={s.id}
                onClick={() => {
                  setActiveSessionId(s.id);
                  if (isSmallScreen) setSidebarOpen(false);
                }}
                sx={{ textAlign: "left", borderRadius: 2 }}
              >
                <Box
                  sx={{
                    width: "100%",
                    border: "1px solid",
                    borderColor: "divider",
                    backgroundColor:
                      s.id === activeSessionId ? "action.selected" : "common.white",
                    p: 1.5,
                    borderRadius: 2,
                  }}
                >
                  <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                    {s.title}
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                    {formatDateTime(s.created_at)}
                  </Typography>
                </Box>
              </ButtonBase>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: "100vh", display: "flex", background: "#ffffff" }}>
      {isSmallScreen ? (
        <Drawer
          anchor="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          ModalProps={{ keepMounted: true }}
          PaperProps={{ sx: { width: 320 } }}
        >
          {sidebarContent}
        </Drawer>
      ) : sidebarOpen ? (
        sidebarContent
      ) : null}

      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              onClick={handleMenuClick}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              size="small"
            >
              <MenuIcon />
            </IconButton>
            <Typography sx={{ fontWeight: 700 }}>
              {activeSession ? `${activeSession.title}` : "No session selected"}
              {messagesLoading ? (
                <Box component="span" sx={{ ml: 1 }}>
                  <CircularProgress size={12} />
                </Box>
              ) : null}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflowY: "auto", py: 2 }}>
          <Box sx={{ maxWidth: 860, mx: "auto", px: 2 }}>
            {messages.length === 0 ? (
              <Typography sx={{ color: "text.secondary" }}>
                Start by asking a question about the person's chart.
              </Typography>
            ) : (
              messages.map((m, idx) => {
                const isUser = m.role === "user";
                const raw = typeof m.content === "string" ? m.content : String(m.content);
                const maybeParsed = safeJsonParse(raw);
                const content = maybeParsed
                  ? `\`\`\`json\n${JSON.stringify(maybeParsed, null, 2)}\n\`\`\``
                  : raw;

                return (
                  <Box
                    key={`${idx}-${m.role}`}
                    sx={{
                      display: "flex",
                      justifyContent: isUser ? "flex-end" : "flex-start",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        maxWidth: "85%",
                        background: isUser ? "action.selected" : "grey.100",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        p: 3,
                      }}
                    >
                      {/* <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                        {isUser ? "You" : "Assistant"}
                      </Typography> */}
                      <Box sx={{ fontSize: 14, lineHeight: 1.5}}>
                        <Markdown>{content}</Markdown>
                      </Box>
                    </Box>
                  </Box>
                );
              })
            )}
            <div ref={bottomRef} />
          </Box>
        </Box>

        <Box sx={{ borderTop: "1px solid", borderColor: "divider", p: 2 }}>
          <Box sx={{ maxWidth: 860, mx: "auto" }}>
            <Box
              component="form"
              onSubmit={(e) => {
                e.preventDefault();
                onSend();
              }}
            >
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
                <TextField
                  multiline
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Message... (Enter to send, Shift+Enter for newline)"
                  disabled={!activeSessionId || sending}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  fullWidth
                />
                {isSmallScreen ? (
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={!activeSessionId || sending}
                    aria-label="Send message"
                    sx={{ alignSelf: "center" }}
                  >
                    <SendIcon />
                  </IconButton>
                ) : (
                  <Button type="submit" variant="contained" disabled={!activeSessionId || sending}>
                    {sending ? "Sending..." : "Send"}
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
