import session from "../models/Session.js";

export async function createSession(req, res) {
   try{
        const {problem,difficulty} = req.body;
        const userId = req.user._id;
        const clerkId = req.user.clerkId;

        if(!problem || !difficulty){
            return res.status(400).json({msg: "problem and difficulty are required"});
        }
        // generate session logic here

        const callId = `session_${Date.now()}_${Math.random().toString(36).substring(2,8) }`;
       

        // create session in DB
        const session = await Session.create({
            problem,
            difficulty,
            host: userId, 
            callId,
        });

        //create stream video call here
         await  streamClient.video.calls("default", callId).getOrCreate({
            data: {
                created_by_id: clerkId,
                custom: { problem, difficulty, sessionId: session._id.toString() },
            },      
        
        });
      
       // chaat message logic can be added here

      const channel = chatClient.channel("messaging", callId, {
        name: `${problem} Session`,
        created_by_id: clerkId,
        members: [clerkId],
      });
        await channel.create();
 
      res.status(201).json({session});
    } catch (error){

        console.error("Error creating session:", error);
        return res.status(500).json({msg: "Internal server error"});

   }
}

export async function getActiveSession(_, res) {
   try{
      const sessions = await session.find({status: "active"})
      .populate("host","name profileImage email clerkId")
       .sort({createdAt: -1})
       .limit(20);

      res.status(200).json({sessions});
   }catch(error){
        console.error("Error fetching active sessions:", error);
        return res.status(500).json({msg: "Internal server error"});
   }
}


export async function getMyRecentSession(req, res) {
   try {
      // where user is host or participant
    
        const userId = req.user._id;
        await session
        .findOne({ status: "completed", 
        $or: [ { host: userId }, { participants: userId } ] })
        .sort({ createdAt: -1 })
        .limit(20);

        res.status(200).json({session});

   }catch (error) {
        console.error("Error fetching recent session:", error);
        return res.status(500).json({msg: "Internal server error"});
   }
}

export async function getSessionById(req, res) {
   try {
     const {id} = req.params;

     const  session = await session
     .findById(id)
     .populate("host","name profileImage email clerkId")
     .populate("participants","name profileImage email clerkId");
   
        if(!session){
            return res.status(404).json({msg: "Session not found"});
        }
        res.status(200).json({session});

    }
    catch (error) {
        console.error("Error fetching session by ID:", error);
        return res.status(500).json({msg: "Internal server error"});
   }

    
}


export async function joinSessionById(req, res) {
     try {
    const {id} = req.params;
    const userId = req.user._id;

    const session = await session.findById(id);
    if(!session){
        return res.status(404).json({msg: "Session not found"});
    }
 
     if(session.status === "active"){
        return res.status(400).json({msg: "Cannot join a completed session"});
    }

    if(session.host.toString() === userId.toString()){
        return res.status(400).json({msg: "Host cannot join their own session as participant"});
    }



    // check if session is already full 
    if(session.participants){
        return res.status(409).json({msg: "Session is already full"});
    }
     



    session.participants = userId;
    await session.save();
  
    const channel = chatClient.channel("messaging", session.callID);
    await channel.addMembers([clerkId]);

    res.status(200).json({session});

   }
    catch (error) {
        console.error("Error ending session:", error);
        return res.status(500).json({msg: "Internal server error"});
   }
}


export async function endSession(req, res) {
  try {
    const {id} = req.params;

    const userId = req.user._id;

    const session = await session.findById(id);
    if(!session){
        return res.status(404).json({msg: "Session not found"});
    }
    // only host can end session
    if(session.host.toString() !== userId.toString()){
        return res.status(403).json({msg: "Only host can end the session"});
    }

    //check if session is already completed
    if(session.status === "completed"){
        return res.status(400).json({msg: "Session is already completed"});
    }

   
    
    // delete stream video call here
     const call = await streamClient.video.calls("default", session.callID);
        await call.delete({hard: true});
  

        //delete chat channel here
        const channel = chatClient.channel("messaging", session.callID);
        await channel.delete();


         session.status = "completed";
    await session.save();
    
        res.status(200).json({session , message: "Session ended successfully"});

    }
    catch (error) {
        console.error("Error ending session:", error);
        return res.status(500).json({msg: "Internal server error"});
   }

}