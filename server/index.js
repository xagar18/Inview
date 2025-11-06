import cors from "cors";
import express from "express";
import path from "path";
import connectDB from "./src/utils/db.js";
import { ENV } from "./src/utils/env.js";

const app = express();

app.use(express.json());
app.use(cors());

//db connection
connectDB();

// API routes
app.get("/api", (req, res) => {
  res.send("Hello, World!");
});

// Serve static assets in production
const __dirname = path.resolve();
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "./client/dist")));

  app.get("/:path(*)", (req, res) => {
    res.sendFile(path.join(__dirname, "./client/dist/index.html"));
  });
}

const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
