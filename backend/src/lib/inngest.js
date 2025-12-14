import { Inngest } from "inngest";
import { connectDB, connection } from "../lib/db.js";
import User from "../models/User.js";

export const inngest = new Inngest({ id: "talent-iq" });

const syncUser = inngest.createFunction (
    { id: "sync/user"},
    {event: "clerk/user.created" },
    async ({ event, step }) => {
         await  connectDB ();

            const { id ,first_name, last_name,  email_addresss, image_url,  } = event.data;
            
            const newUser = {
                clerkid: id,
                name: `${first_name|| ""} ${last_name || ""}`.trim(),
                email: email_addresss[0]?.email_address,
                profileImage: image_url,
            }

           await User.create (newUser);

           //tODO: create other user data associated with this user
    }
);

 const deleteUserFromDB = inngest.createFunction (
    { id: "delete-user-from-db"},
    {event: "clerk/user.deleted" },
    async ({ event, step }) => {
         await  connectDB ();

            const{ id } = event.data;
           await User.deleteOne({ ClerkId: id });

           //TODO: delete other user data associated with this user
    }
);

export const functions = [syncUser, deleteUserFromDB];