import Session from "../models/Session.js";
import { streamClient, chatClient } from "../lib/stream.js";
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import InviteToken from '../models/InviteToken.js'

function getClerkId(user) {
	return user?.clerkId || user?.ClerkId || user?.clerkid || null;
}

function normalizeDifficulty(d) {
	if (!d) return "Easy";
	const lowered = String(d).toLowerCase();
	if (lowered === "easy") return "Easy";
	if (lowered === "medium") return "Medium";
	if (lowered === "hard") return "Hard";
	return d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
}

export async function createSession(req, res) {
	try {
		const { problem, difficulty, language, accessCode } = req.body;
		const userId = req.user?._id;
		const clerkId = getClerkId(req.user);

		// Debug logs to help identify why session creation fails
		console.log("[createSession] payload:", { problem, difficulty, language, hasAccessCode: !!accessCode });
		console.log("[createSession] user:", { id: userId, clerkId });

		if (!problem || !difficulty) {
			return res.status(400).json({ message: "problem and difficulty are required" });
		}

		const normalizedDifficulty = normalizeDifficulty(difficulty);

		const callId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

		const payload = {
			problem,
			difficulty: normalizedDifficulty,
			host: userId,
			callId,
		}

		// if access code provided, hash and store
		if (accessCode && String(accessCode).trim().length > 0) {
			try {
				const hash = await bcrypt.hash(String(accessCode), 10);
				payload.accessCodeHash = hash;
			} catch (err) {
				console.warn('[createSession] failed to hash accessCode', err);
			}
		}

		const newSession = await Session.create(payload);

		try {
			if (chatClient) {
				const channel = chatClient.channel("messaging", callId, {
					name: `${problem} Session`,
					created_by_id: clerkId,
					members: clerkId ? [clerkId] : [],
				});
				await channel.create();
			}
		} catch (err) {
			console.error("Warning: failed to create chat channel:", err?.message || err);
		}

		const populated = await Session.findById(newSession._id)
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId")
			.lean();

		// do not expose accessCodeHash to client, but indicate protection
		if (populated) {
			populated.isProtected = !!populated.accessCodeHash;
			delete populated.accessCodeHash;
		}

		res.status(201).json({ session: populated });
	} catch (error) {
		console.error("Error creating session:", error);
		if (error.name === "ValidationError") {
			return res.status(400).json({ message: "Validation error", details: error.message });
		}
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function getActiveSession(_, res) {
	try {
		const sessions = await Session.find({ status: "active" })
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId")
			.sort({ createdAt: -1 })
			.limit(20)
			.lean();

		const cleaned = sessions.map(s => {
			s.isProtected = !!s.accessCodeHash;
			delete s.accessCodeHash;
			return s;
		});

		res.status(200).json({ sessions: cleaned });
		} catch (error) {
		console.error("Error fetching active sessions:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function getMyRecentSession(req, res) {
	try {
		const userId = req.user?._id;
		const sessions = await Session.find({ status: "completed", $or: [{ host: userId }, { participants: userId }] })
			.sort({ createdAt: -1 })
			.limit(20)
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId")
			.lean();

		const cleaned = sessions.map(s => {
			s.isProtected = !!s.accessCodeHash;
			delete s.accessCodeHash;
			return s;
		});

		res.status(200).json({ sessions: cleaned });
	} catch (error) {
		console.error("Error fetching recent sessions:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function getHostActiveSessions(req, res) {
	try {
		const userId = req.user?._id;
		console.log('[getHostActiveSessions] userId:', userId);
		const sessions = await Session.find({ host: userId, status: "active" })
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId")
			.sort({ createdAt: -1 })
			.limit(50)
			.lean();

		const cleaned = sessions.map(s => {
			s.isProtected = !!s.accessCodeHash;
			delete s.accessCodeHash;
			return s;
		});

		console.log('[getHostActiveSessions] found sessions:', cleaned.length);
		return res.status(200).json({ sessions: cleaned });
	} catch (error) {
		console.error("Error fetching host active sessions:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

// Create a single-use invite token for a session (host only)
export async function createInviteToken(req, res) {
	try {
		const { id } = req.params;
		const userId = req.user?._id;

		const session = await Session.findById(id);
		if (!session) return res.status(404).json({ message: 'Session not found' });
		if (session.host.toString() !== userId.toString()) return res.status(403).json({ message: 'Only host can create invites' });

		// generate token
		const token = crypto.randomBytes(12).toString('hex');
		const hash = await bcrypt.hash(token, 10);

		const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		const invite = await InviteToken.create({ tokenHash: hash, session: session._id, createdBy: userId, expiresAt });

		// return plaintext token to host so they can share it
		res.status(201).json({ token, expiresAt });
	} catch (err) {
		console.error('[createInviteToken] error', err);
		return res.status(500).json({ message: 'Failed to create invite token' });
	}
}

// Redeem invite token and join the associated session
export async function joinWithInviteToken(req, res) {
	try {
		const { token } = req.params;
		const userId = req.user?._id;
		const clerkId = getClerkId(req.user);

		// find candidate invite tokens that are unused and not expired
		const candidates = await InviteToken.find({ used: false, expiresAt: { $gt: new Date() } }).limit(50);
		let matched = null;
		for (const c of candidates) {
			const ok = await bcrypt.compare(String(token), String(c.tokenHash));
			if (ok) {
				matched = c;
				break;
			}
		}

		if (!matched) return res.status(404).json({ message: 'Invalid or expired invite' });

		// get session
		const found = await Session.findById(matched.session);
		if (!found) return res.status(404).json({ message: 'Session not found' });

		if (found.status === 'completed') return res.status(400).json({ message: 'Cannot join a completed session' });

		// add participant if not already
		const already = found.participants && found.participants.find(p => p.toString() === userId.toString());
		if (already) {
			// mark invite as used and return
			matched.used = true;
			await matched.save();
		} else {
			found.participants = found.participants || [];
			found.participants.push(userId);
			await found.save();

			try {
				if (chatClient) {
					const channel = chatClient.channel('messaging', found.callId);
					await channel.addMembers([clerkId]);
				}
			} catch (err) {
				console.error('Warning: failed to add member to chat channel:', err?.message || err);
			}

			matched.used = true;
			await matched.save();
		}

		const populated = await Session.findById(found._id)
			.populate('host', 'name profileImage email clerkId')
			.populate('participants', 'name profileImage email clerkId');

		const obj = populated.toObject();
		obj.isProtected = !!obj.accessCodeHash;
		delete obj.accessCodeHash;

		res.status(200).json({ session: obj });
	} catch (err) {
		console.error('[joinWithInviteToken] error', err);
		return res.status(500).json({ message: 'Failed to join with invite' });
	}
}

export async function getSessionById(req, res) {
	try {
		const { id } = req.params;
		const found = await Session.findById(id)
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId");

		if (!found) return res.status(404).json({ message: "Session not found" });

		const obj = found.toObject();
		obj.isProtected = !!obj.accessCodeHash;
		delete obj.accessCodeHash;

		res.status(200).json({ session: obj });
		} catch (error) {
		console.error("Error fetching session by ID:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function joinSessionById(req, res) {
	try {
		const { id } = req.params;
		const { accessCode } = req.body || {};
		const userId = req.user?._id;
		const clerkId = getClerkId(req.user);

		const found = await Session.findById(id);
		if (!found) return res.status(404).json({ message: "Session not found" });

		if (found.status === "completed") {
			return res.status(400).json({ message: "Cannot join a completed session" });
		}

		// If session is protected, require accessCode
		if (found.accessCodeHash && String(found.accessCodeHash).trim().length > 0) {
			if (!accessCode) {
				return res.status(401).json({ message: "Access code required" });
			}
			const match = await bcrypt.compare(String(accessCode), String(found.accessCodeHash));
			if (!match) {
				return res.status(401).json({ message: "Invalid access code" });
			}
		}

		// allow multiple participants: check if user already joined
		const already = found.participants && found.participants.find(p => p.toString() === userId.toString());
		if (already) return res.status(409).json({ message: "User already joined the session" });

		found.participants = found.participants || [];
		found.participants.push(userId);
		await found.save();

		try {
			if (chatClient) {
				const channel = chatClient.channel("messaging", found.callId);
				await channel.addMembers([clerkId]);
			}
		} catch (err) {
			console.error("Warning: failed to add member to chat channel:", err?.message || err);
		}

		const populated = await Session.findById(found._id)
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId");

		const obj = populated.toObject();
		obj.isProtected = !!obj.accessCodeHash;
		delete obj.accessCodeHash;

		res.status(200).json({ session: obj });
	} catch (error) {
		console.error("Error joining session:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

export async function endSession(req, res) {
	try {
		const { id } = req.params;
		const userId = req.user?._id;

		const found = await Session.findById(id);
		if (!found) return res.status(404).json({ message: "Session not found" });

		if (found.host.toString() !== userId.toString()) {
			return res.status(403).json({ message: "Only host can end the session" });
		}

		if (found.status === "completed") {
			return res.status(400).json({ message: "Session is already completed" });
		}

		found.status = "completed";
		await found.save();

		try {
			if (chatClient) {
				const channel = chatClient.channel("messaging", found.callId);
				await channel.delete();
			}
		} catch (err) {
			console.error("Warning: failed to delete chat channel:", err?.message || err);
		}

		try {
			if (streamClient && streamClient.video && typeof streamClient.video.calls === "function") {
				const call = streamClient.video.calls("default", found.callId);
				if (call && typeof call.delete === "function") {
					await call.delete({ hard: true });
				}
			}
		} catch (err) {
			console.error("Warning: failed to delete stream call:", err?.message || err);
		}

		const populated = await Session.findById(found._id)
			.populate("host", "name profileImage email clerkId")
			.populate("participants", "name profileImage email clerkId");

		res.status(200).json({ session: populated, message: "Session ended successfully" });
	} catch (error) {
		console.error("Error ending session:", error);
		return res.status(500).json({ message: "Internal server error" });
	}
}

