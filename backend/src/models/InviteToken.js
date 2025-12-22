import mongoose from 'mongoose';

const inviteTokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true },
  session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  used: { type: Boolean, default: false },
  expiresAt: { type: Date },
}, { timestamps: true });

const InviteToken = mongoose.model('InviteToken', inviteTokenSchema);

export default InviteToken;
