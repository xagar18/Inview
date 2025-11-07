import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import { serve } from "inngest/express";
import path from "path";
import connectDB from "./src/lib/db.js";
import { ENV } from "./src/lib/env.js";
import { inngest, inngestFunctions } from "./src/lib/inngest.js";
import { protectRoute } from "./src/middleware/protectRoute.js";
import chatRoutes from "./src/routes/chatRoutes.js";

const app = express();

app.use(express.json());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(clerkMiddleware());
app.use(express.urlencoded({ extended: true }));

// Inngest webhook endpoint
app.use(
  "/api/inngest",
  serve({ client: inngest, functions: inngestFunctions })
);

//chat routes
app.use("/api/chat", chatRoutes);
//session  routes
app.use("/api/chat", chatRoutes);

app.get("/video-calls", protectRoute, (req, res) => {
  res.send("Video Calls Endpoint");
});

// Serve static assets in production
const __dirname = path.resolve();
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  // Catch-all route - use regex for Express 5+
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, "../client/dist/index.html"));
  });
}

const PORT = ENV.PORT;
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
