import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {

    problem:
    {
        type: String,
        required: true,
    },
    difficulty:{
        type: String,
        enum: ['Easy', 'Medium', 'Hard'],
        required: true,
    },
    host:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    status: {
        type: String,
        enum: ['active', 'completed'],
        default: 'active',
    },
    callId: {
        type: String,
        default: "",
    },
    accessCodeHash: {
        type: String,
        default: "",
    },

}, 
{ timestamps: true }
    
)

const session = mongoose.model("Session", sessionSchema);

export default session;
