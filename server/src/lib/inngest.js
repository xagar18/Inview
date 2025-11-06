import { Inngest } from "inngest";
import connectDB from "./db.js";

export const inngest = new Inngest({ id: "inview" });

const syncUser = inngest.createFunction(
  {
    id: "sync-user",
  },
  { event: "clerk/user.created" },
  async ({ event }) => {
    await connectDB();
    const { id, email_addresses, first_name, last_name, image_url } =
      event.data;

    const newUser = {
      clerkId: id,
      email: email_addresses[0]?.email_address,
      name: `${first_name || ""} ${last_name || ""}`,
      profileImgage: image_url,
    };
    await User.create(newUser);
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
  }
);

export const inngestFunctions = [syncUser, deleteuser];
