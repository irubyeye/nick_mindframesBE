const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const dotenv = require("dotenv");
const OpenAI = require("openai");

dotenv.config({ path: `./.env` });

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const cors = require("cors");
app.use(cors());

const openai = new OpenAI();

async function openAiConnection(message, socket) {
  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: `${message}` }],
      stream: true,
    });

    for await (const chunk of stream) {
      const response = chunk.choices[0]?.delta?.content || "";

      socket.emit("message", response);
    }
  } catch (error) {
    console.error("Error processing OpenAI request:", error.message);
  }
}

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", (message) => {
    console.log(`Received: ${message}`);
    openAiConnection(message, socket);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const port = process.env.PORT || 801;
server.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});

// Обработка ошибок
process.on("unhandledRejection", (error) => {
  console.log(error.name, error.message);
  console.log("Unhandled rejection! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});

process.on("uncaughtException", (error) => {
  console.log(error.name, error.message);
  console.log("Uncaught exception! Shutting down...");
  server.close(() => {
    process.exit(1);
  });
});
