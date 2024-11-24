import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OpenAI from "openai";

const PromptApiKey = ({ onApiKeySubmit }) => {
  const [apiKey, setApiKey] = useState("");
  return (
    <div>
      <form onSubmit={e => onApiKeySubmit(apiKey)}>
        <label>
          Please enter your OpenAI API key:
          <input
            type="text"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
          />
        </label>
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

const Home = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    process.env.REACT_APP_OPENAI_API_KEY ||
      new URLSearchParams(window.location.search).get("apiKey") ||
      null
  );
  const [openAI, setOpenAI] = useState(null);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (apiKey) {
      const url = new URL(window.location);
      url.searchParams.set("apiKey", apiKey);
      window.history.replaceState({}, "", url);
      setOpenAI(new OpenAI({ apiKey: apiKey, dangerouslyAllowBrowser: true }));
    }
  }, [apiKey]);

  useEffect(() => {
    scrollToBottom();
    const checkIsMobile = () => {
      setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [messages]);

  if (isMobile) {
    return (
      <div
        style={{
          color: "#FF6B6B",
          textAlign: "center",
          padding: "2rem",
          backgroundColor: "#FFF5F5",
          borderRadius: "8px",
          margin: "2rem"
        }}
      >
        <pre
          style={{
            fontFamily: "monospace",
            fontSize: "30px",
            lineHeight: "1.2",
            color: "#666"
          }}
        >
          {`
 /\\_/\\
 ( o.o )
 > ^ <
`}
        </pre>
        <p
          style={{
            fontSize: "1.2rem",
            marginTop: "1rem",
            fontWeight: "500"
          }}
        >
          Sorry, this app is not supported on mobile devices, try again on a
          desktop!
        </p>
      </div>
    );
  }

  if (!apiKey) {
    return <PromptApiKey onApiKeySubmit={setApiKey} />;
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setUserInput("");
    setIsLoading(true);

    try {
      const exitWord = "COMPLETE:";
      const response = await openAI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `You are a web-based assistant whose role is to guide users through a fun, lighthearted questionnaire with kindness and enthusiasm. Start of by getting their name. Then greet them, saying 'Welcome to A Tasteful Encounter. Together, you and a stranger will create a one-of-a-kind experience based on your combined tastes and preferences. This is a chance to explore, collaborate, and discover—ready to curate your match?' and wait for a yes. Your goal is to help them share their preferences by answering three questions: what vibe they're feeling today, what inspires them most, and what flavor they're craving. Keep your tone cheerful and friendly, using emojis where appropriate to create an engaging and approachable experience. Present options clearly, one question at a time, and confirm their choices before moving on. Just emojis! Once all three responses are collected, let the user they'll be going to a shared experience in a second and then respond with just: '${exitWord}<json of responses>' with keys 'vibe', 'inspiration', 'flavor', and 'name'. The options for vibe are 'cozy', 'reflective', 'sophisticated', 'romantic', the options for 'inspiration' are 'music', 'stories', 'art', 'nature', and the options for 'flavor' are 'sweet', 'savory', 'fresh', 'mellow'. If clarification is needed, gently prompt for it in a warm, encouraging way.`
          },
          ...newMessages
        ]
      });

      let assistantMessage = response.choices[0].message.content;
      let messages = assistantMessage.split(exitWord);

      setMessages([
        ...newMessages,
        { role: "assistant", content: messages[0] }
      ]);

      if (messages.length > 1) {
        const preferences = JSON.parse(messages[1]);
        setTimeout(
          () =>
            navigate(
              "/session?" + new URLSearchParams({ apiKey, ...preferences })
            ),
          3000
        );
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
        gap: "2vh",
        padding: "2vh",
        boxSizing: "border-box",
        maxHeight: "100vh",
        overflow: "hidden"
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "600px",
          height: "50vh",
          margin: "auto",
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "auto",
          padding: "1rem",
          boxSizing: "border-box"
        }}
      >
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              marginBottom: "1rem",
              textAlign: msg.role === "user" ? "right" : "left"
            }}
          >
            <div
              style={{
                background: "#e9ecef",
                color: "2e2e2e",
                padding: "0.5rem 1rem",
                borderRadius: "20px",
                display: "inline-block",
                maxWidth: "80%"
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && <div>Loading...</div>}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        style={{
          width: "100%",
          maxWidth: "600px",
          padding: "1vh 0",
          marginTop: "0"
        }}
      >
        <div style={{ display: "flex", gap: "1rem" }}>
          <input
            type="text"
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            style={{
              flex: 1,
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc"
            }}
            placeholder="Type your message..."
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "none",
              background: "#2e2e2e",
              color: "white",
              cursor: "pointer"
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Home;
