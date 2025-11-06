import cors from "cors";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./src/utils/db.js";
import { ENV } from "./src/utils/env.js";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cors());

// DB connection
connectDB();

// Serve static assets in production
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./client/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/dist/index.html"));
  });
}

// Example route
app.get("/hello", (req, res) => {
  res.send("Hello, World!");
});

// Use Sevella’s dynamic port
const PORT = ENV.PORT;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
