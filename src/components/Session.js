import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./animations.css";
const Session = () => {
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState(null);
  const [unmatched, setUnmatched] = useState(false);
  const [preset, setPreset] = useState(null);
  const [background, setBackground] = useState(null);
  const [expiresIn, setExpiresIn] = useState(null);
  const [over, setOver] = useState(false);
  const [apiKey, setApiKey] = useState(null);

  const navigate = useNavigate();
  const WS_URL =
    process.env.REACT_APP_WS_URL ||
    "wss://tasteful-experience-server-pzsdi.ondigitalocean.app:443";

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true
    }
  );

  useEffect(() => {
    if (readyState === 1) {
      const params = Object.fromEntries(searchParams.entries());
      setApiKey(params.apiKey);
      console.log("params", params);
      sendJsonMessage({
        event: "set_preferences",
        preferences: {
          vibe: params.vibe,
          inspiration: params.inspiration,
          flavor: params.flavor
        },
        name: params.name
      });
    }
    document.onmousemove = e => {
      const { clientX, clientY } = e;
      const cursorPosition = {
        event: "cursor_move",
        cursor: { x: clientX, y: clientY }
      };
      sendJsonMessage(cursorPosition);
    };
  }, [readyState, sendJsonMessage]);

  function removePreviousCursor() {
    const previousCursor = document.querySelector(".custom-cursor");
    if (previousCursor) {
      previousCursor.remove();
    }
  }

  useEffect(() => {
    if (lastJsonMessage) {
      let data = lastJsonMessage;
      switch (data.event) {
        case "match":
          console.log("match", data);
          setSession({
            otherUser: data.otherUser,
            preferences: data.preferences,
            expires: data.expires
          });
          break;
        case "cursor_move":
          removePreviousCursor();
          const cursor = document.createElement("img");
          cursor.className = "custom-cursor";
          cursor.src = "/img/cursor.svg";
          cursor.style.width = "30px";
          cursor.style.height = "30px";
          cursor.style.position = "absolute";
          cursor.style.left = `calc(98vw * ${
            data.cursor.x / window.innerWidth
          })`;
          cursor.style.top = `calc(98vh * ${
            data.cursor.y / window.innerHeight
          })`;
          cursor.style.transform = "translate(-50%, -50%)";
          document.body.appendChild(cursor);
          break;
        case "unmatched":
          removePreviousCursor();
          setSession(null);
          setUnmatched(true);
          break;
        default:
          console.log("Unknown event type:", data.event);
          break;
      }
    }
  }, [lastJsonMessage]);

  useEffect(() => {
    if (session) {
      // Define the mapping for each output
      const outputs = {
        vinyl_cafe: {
          vibe: ["cozy"],
          inspiration: ["music"],
          flavor: ["sweet", "mellow"]
        },
        fresh_garden: {
          vibe: ["reflective", "playful"],
          inspiration: ["nature"],
          flavor: ["fresh"]
        },
        bookstore: {
          vibe: ["reflective", "cozy"],
          inspiration: ["stories"],
          flavor: ["mellow"]
        },
        city_skyline: {
          vibe: ["sophisticated"],
          inspiration: ["food", "music"],
          flavor: ["sweet", "savoury"]
        }
      };

      function calculateScore(userA, userB, criteria) {
        let score = 0;

        for (const key in criteria) {
          const sharedValues = criteria[key].filter(
            value => userA[key] === value || userB[key] === value
          );
          score += sharedValues.length;
        }
        return score;
      }

      function findBestMatch(userA, userB) {
        let bestMatch = null;
        let highestScore = 0;

        for (const output in outputs) {
          const score = calculateScore(userA, userB, outputs[output]);
          if (score > highestScore) {
            highestScore = score;
            bestMatch = output;
          }
        }

        return bestMatch;
      }
      let preset = findBestMatch(
        session.preferences[0],
        session.preferences[1],
        ["vibe", "inspiration", "flavor"]
      );
      setPreset(preset);
    } else {
      setPreset(null);
    }
  }, [session]);

  const [audio, setAudio] = useState(null);
  useEffect(() => {
    if (preset) {
      setBackground(`url(${process.env.PUBLIC_URL}/img/${preset}.svg)`);
      if (!audio) {
        console.log("setting audio");
        const newAudio = new Audio(
          `${process.env.PUBLIC_URL}/music/${preset}.mp3`
        );
        setAudio(newAudio);
        newAudio.loop = true;
        try {
          console.log("adding click listener");
          document.addEventListener(
            "click",
            () => {
              newAudio.play().catch(error => {
                console.error("Error playing audio:", error);
              });
            },
            { once: true }
          );
        } catch (error) {
          console.error("Error playing audio:", error);
        }
      }
    } else {
      if (audio) {
        console.log("pausing audio");
        audio.pause();
        audio.currentTime = 0;
        setAudio(null);
      }
      setBackground("none");
    }
  }, [preset]);

  useEffect(() => {
    if (session) {
      console.log("session", session);
      const intervalId = setInterval(() => {
        const currentTime = new Date().getTime();
        const expirationTime = new Date(session.expires).getTime();
        const remainingTime = expirationTime - currentTime;

        if (remainingTime <= 0) {
          setExpiresIn("Expired");
          setOver(true);
          setSession(null);
          clearInterval(intervalId);
        } else {
          const minutes = Math.floor(
            (remainingTime % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
          setExpiresIn(`${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [session]);

  function startOver() {
    removePreviousCursor();
    navigate("/?" + new URLSearchParams({ apiKey }));
  }

  return (
    <div
      key={background}
      id="background"
      style={{
        opacity: background ? 1 : 0,
        backgroundImage: background,
        transition: "opacity 2s ease-in-out",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
        height: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "cursive"
      }}
    >
      <h1 style={{ fontSize: "2rem", animation: "pulse 1s infinite" }}>
        {!unmatched && !over && !session && "Searching for a partner..."}
      </h1>

      {session && (
        <div
          style={{
            position: "absolute",
            top: "10%", // Changed top position to 10px
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "#eeeeee",
            padding: "20px",
            borderRadius: "5px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            textAlign: "center",
            fontSize: "1.5rem"
          }}
        >
          <i>You're sharing an experience with {session.otherUser}</i>
          <br />
          <i>{expiresIn || "..."}</i>
        </div>
      )}

      {(over || unmatched) && (
        <div
          id="over-modal"
          style={{
            transition: "opacity 2s ease-in-out",
            padding: "20px",
            borderRadius: "10px",
            textAlign: "center",
            fontSize: "1.5rem"
          }}
        >
          {unmatched && !over && <p>Your partner has left :(</p>}
          {over && <p>Thanks for taking part :)</p>}
          <button
            onClick={startOver}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "4px",
              border: "none",
              background: "#2e2e2e",
              color: "white",
              cursor: "pointer",
              marginTop: "1rem"
            }}
          >
            Start Over?
          </button>
        </div>
      )}
    </div>
  );
};

export default Session;
