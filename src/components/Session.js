import React, { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useSearchParams } from "react-router-dom";

const Session = () => {
  const [searchParams] = useSearchParams();
  const [otherUser, setOtherUser] = useState(null);
  const [unmatched, setUnmatched] = useState(false);
  const preferences = Object.fromEntries(searchParams.entries());

  // Parse the preferences JSON if it exists
  console.log("preferences", preferences);

  const WS_URL =
    "wss://tasteful-experience-server-pzsdi.ondigitalocean.app:443";

  const { sendJsonMessage, lastJsonMessage, readyState } = useWebSocket(
    WS_URL,
    {
      share: false,
      shouldReconnect: () => true
    }
  );

  useEffect(() => {
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
          setOtherUser(data.id);
          break;
        case "cursor_move":
          removePreviousCursor();
          const cursor = document.createElement("div");
          cursor.className = "custom-cursor";
          cursor.style.width = "20px";
          cursor.style.height = "20px";
          cursor.style.border = "1.5px solid black";
          cursor.style.borderRadius = "50% 50% 50% 50% / 40% 40% 60% 60%";
          cursor.style.backgroundColor = "white";
          cursor.style.position = "absolute";
          cursor.style.left = `${data.cursor.x}px`;
          cursor.style.top = `${data.cursor.y}px`;
          cursor.style.transform = "rotate(-45deg)";
          cursor.style.boxShadow = "0px 0px 2px rgba(0,0,0,0.5)";
          document.body.appendChild(cursor);
          break;
        case "unmatched":
          removePreviousCursor();
          setOtherUser(null);
          setUnmatched(true);
          break;
        default:
          console.log("Unknown event type:", data.event);
          break;
      }
    }
  }, [lastJsonMessage]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh"
        }}
      >
        <h1 style={{ fontSize: "2rem" }}>
          {!unmatched && !otherUser && "Searching for partner..."}
          {otherUser && `Sharing an experience with User ${otherUser}`}
          {unmatched && "Partner has left :("}
        </h1>
      </div>
    </div>
  );
};

export default Session;
