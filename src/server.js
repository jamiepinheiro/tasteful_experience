const { randomUUID } = require("crypto");
const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const unmatched_users = [];

class Session {
  constructor(user1, user2) {
    this.user1 = user1;
    this.user2 = user2;
    this.active = true;
  }

  getOtherUser(user) {
    if (user === this.user1) {
      return this.user2;
    } else if (user === this.user2) {
      return this.user1;
    } else {
      throw new Error("User not in session");
    }
  }
}

const sessions = [];

function match_users() {
  if (unmatched_users.length > 1) {
    const user1 = unmatched_users.pop();
    const user2 = unmatched_users.pop();
    const preferences = [user1.preferences, user2.preferences];
    user1.send(
      JSON.stringify({
        event: "match",
        otherUser: user2.name,
        preferences: preferences
      })
    );
    user2.send(
      JSON.stringify({
        event: "match",
        otherUser: user1.name,
        preferences: preferences
      })
    );
    session = new Session(user1, user2);
    sessions.push(session);
    user1.session = session;
    user2.session = session;
  }
}

let nextId = 0;

wss.on("connection", ws => {
  ws.id = nextId++;

  console.log("User connected", ws.id);

  ws.on("message", message => {
    const data = JSON.parse(message.toString());
    console.log(data);
    switch (data.event) {
      case "cursor_move":
        if (ws.session) {
          const otherUser = ws.session.getOtherUser(ws);
          otherUser.send(
            JSON.stringify({ event: "cursor_move", cursor: data.cursor })
          );
        }
        break;
      case "set_preferences":
        ws.name = data.name;
        ws.preferences = data.preferences;
        unmatched_users.push(ws);
        match_users();
        break;
    }
  });

  ws.on("close", () => {
    console.log("User disconnected", ws.id);
    const unmatched_index = unmatched_users.indexOf(ws);
    if (unmatched_index > -1) {
      unmatched_users.splice(unmatched_index, 1);
    }

    if (ws.session) {
      session.active = false;
      const otherUser = ws.session.getOtherUser(ws);
      console.log("Orphaned user", otherUser.id);
      otherUser.send(JSON.stringify({ event: "unmatched" }));
    }
  });
});

server.listen(8080, () => {
  console.log("Server running on port 8080");
});

module.exports = app;
