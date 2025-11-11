import { Inngest } from "inngest";
import { User } from "../model/User.js";
import connectDB from "./db.js";
import { deleteStreamUser, upsertStreamUser } from "./stream.js";

export const inngest = new Inngest({ id: "inview" });

const syncUser = inngest.createFunction(
  { id: "sync-user" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      await connectDB();

      const { id, email_addresses, first_name, last_name, image_url } =
        event.data;

      const email = email_addresses?.[0]?.email_address;
      if (!email) {
        console.warn("Missing email for Clerk user:", id);
        return;
      }

      const newUser = {
        clerkId: id,
        email,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        profileImage: image_url || "",
      };

      // Use findOneAndUpdate with upsert instead of create to avoid duplicates
      const user = await User.findOneAndUpdate({ clerkId: id }, newUser, {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      });

      console.log("User upserted:", user);

      // Sync with Stream
      await upsertStreamUser({
        id: user.clerkId.toString(),
        name: user.name,
        image: user.profileImage,
      });
    } catch (error) {
      console.error("Error upserting user:", error.message);
    }
  }
);

const deleteuser = inngest.createFunction(
  {
    id: "delete-user",
  },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await connectDB();
    const { id } = event.data;

    await User.findOneAndDelete({ clerkId: id });

    await deleteStreamUser(id.toString());
  }
);

export const inngestFunctions = [syncUser, deleteuser];
