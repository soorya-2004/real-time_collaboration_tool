const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("drawing", (data) => {
    socket.broadcast.emit("drawing", data);
  });
  
  socket.on("clear", () => {
  socket.broadcast.emit("clear");
});


  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});

server.listen(5001, () => {
  console.log("Server running on http://localhost:5001");
});
