import { StreamChat } from "stream-chat";
import { ENV } from "./env.js";

export const streamClient = StreamChat.getInstance(
  ENV.STREAM_API_KEY,
  ENV.STREAM_SECRET_KEY
);

export const upsertStreamUser = async (user) => {
  try {
    await streamClient.upsertUser(user);
    console.log("Upserted Stream user:", user);
    return user;
  } catch (error) {
    console.error("Error upserting Stream user:", error);
  }
};

export const deleteStreamUser = async (userId) => {
  try {
    await streamClient.deleteUser(userId);
    console.log("Deleted Stream user with ID:", userId);
    return userId;
  } catch (error) {
    console.error("Error while deleting Stream user:", error);
  }
};
