import { chatClient, streamClient } from "../lib/stream.js";
import { Session } from "../model/Session.js";

// Create a new session
// export async function createSession(req, res) {
//   console.log("session create called")
//   try {
//     const { problem, difficulty } = req.body;
//     const userId = req.user._id;
//     const clerkId = req.user.clerkId;

//     if (!problem || !difficulty) {
//       return res
//         .status(400)
//         .json({ message: "Problem and difficulty are required" });
//     }
//     console.log("got problem and diff");

//     //create session logic here
//     const callId = `session_${Date.now()}_${Math.random()
//       .toString(36)
//       .substring(7)}`;

//     // Create session in DB
//     const session = await Session.create({
//       problem,
//       difficulty,
//       host: userId,
//       callId,
//     });
//     console.log("session created in db");

//     // create stream video room here
//     await streamClient.video.call("default", callId).getOrCreate({
//       data: {
//         created_by_id: clerkId,
//         custom: { problem, difficulty, sessionId: session._id.toString() },
//       },
//     });

//     // chat client setup
//     const channel = chatClient.channel("messaging", callId, {
//       name: `${problem} Session`,
//       created_by_id: clerkId,
//       members: [clerkId],
//     });
//     await channel.create();

//     return res.status(201).json({ session, message: "Session created" });
//   } catch (error) {
//     console.error("Error creating session:", error);
//     return res.status(500).json({ message: "Internal server error" });
//   }
// }

export async function createSession(req, res) {
  try {
    const { problem, difficulty } = req.body;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    if (!problem || !difficulty) {
      return res
        .status(400)
        .json({ message: "Problem and difficulty are required" });
    }

    // generate a unique call id for stream video
    const callId = `session_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    // create session in db
    const session = await Session.create({
      problem,
      difficulty,
      host: userId,
      callId,
    });

    // create stream video call
    await streamClient.video.call("default", callId).getOrCreate({
      data: {
        created_by_id: clerkId,
        custom: { problem, difficulty, sessionId: session._id.toString() },
      },
    });

    // chat messaging
    const channel = chatClient.channel("messaging", callId, {
      name: `${problem} Session`,
      created_by_id: clerkId,
      members: [clerkId],
    });

    await channel.create();

    res.status(201).json({ session });
  } catch (error) {
    console.log("Error in createSession controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get all active sessions
export async function getActiveSessions(req, res) {
  try {
    const sessions = await Session.find({ status: "active" })
      .populate("host", "name profileImage, email clerkId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error fetching active sessions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get my recent sessions
export async function getMyRecentSessions(req, res) {
  try {
    // where user is either host or participant

    const userId = req.user._id;

    const sessions = await Session.find({
      $or: [{ host: userId }, { participants: userId }],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ sessions });
  } catch (error) {
    console.error("Error fetching recent sessions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Get session by ID
export async function getSessionById(req, res) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id)
      .populate("host", "name profileImage email clerkId")
      .populate("participants", "name profileImage email clerkId");
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(200).json({ session });
  } catch (error) {
    console.error("Error fetching session by ID:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// Join a session
export async function joinSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const clerkId = req.user.clerkId;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.status !== "active") {
      return res
        .status(400)
        .json({ message: "Cannot join a completed session" });
    }
    if (session.host.toString() === userId.toString()) {
      return res
        .status(400)
        .json({ message: "Host cannot join as participant" });
    }

    // check if user is already a participant
    if (session.participants && session.participants.toString() === userId.toString()) {
      return res
        .status(200)
        .json({ session, message: "Already joined this session" });
    }

    // check if session is already full
    if (session.participants !== null && session.participants.toString() !== userId.toString()) {
      return res.status(409).json({ message: "Session is already full" });
    }

    // add participant to session
    session.participants = userId;
    await session.save();

    const channel = chatClient.channel("messaging", session.callId);
    await channel.addMembers([clerkId]);

    return res
      .status(200)
      .json({ session, message: "Joined session successfully" });
  } catch (error) {
    console.error("Error joining session:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

//
export async function endSession(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const session = await Session.findById(id);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    // check if user is host
    if (session.host.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Only the host can end the session" });
    }

    // check session is already completed
    if (session.status === "completed") {
      return res.status(400).json({ message: "Session is already completed" });
    }

    // delete stream video room
    const call = await streamClient.video.call("default", session.callId);
    await call.delete();

    // delete chat channel
    const channel = chatClient.channel("messaging", session.callId);
    await channel.delete({ hard_delete: true });

    // update session status
    session.status = "completed";
    await session.save();

    return res
      .status(200)
      .json({ session, message: "Session ended successfully" });
  } catch (error) {}
}
