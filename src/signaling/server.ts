// Signaling Server for WebRTC video conferencing
// Handles: user join/leave, WebRTC signaling (offer/answer/ICE), chat, screen share

import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import {
  User,
  Meeting,
  MeetingSettings,
  SignalingMessage,
  SignalingMessageType,
  JoinPayload,
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  UserJoinedPayload,
  UserLeftPayload,
  UserUpdatedPayload,
  MeetingStatePayload,
  ChatPayload,
  ErrorPayload,
} from '../shared/types';

const HTTP_PORT = 3001;
const WS_PORT = 3002;

// In-memory storage (replace with Redis/database for production)
const meetings = new Map<string, Meeting>();
const userSockets = new Map<string, { socketId: string; meetingId: string }>();

function createDefaultMeetingSettings(): MeetingSettings {
  return {
    allowScreenShare: true,
    allowChat: true,
    allowRecording: false,
    muteOnEntry: true,
    videoOnEntry: true,
  };
}

function createMeeting(meetingId: string, hostId: string, name: string): Meeting {
  const meeting: Meeting = {
    id: meetingId,
    name,
    hostId,
    participants: [],
    createdAt: Date.now(),
    settings: createDefaultMeetingSettings(),
  };
  meetings.set(meetingId, meeting);
  return meeting;
}

function getOrCreateMeeting(meetingId: string, hostId: string): Meeting {
  let meeting = meetings.get(meetingId);
  if (!meeting) {
    meeting = createMeeting(meetingId, hostId, `Meeting ${meetingId.slice(0, 8)}`);
  }
  return meeting;
}

function addUserToMeeting(meeting: Meeting, user: User): void {
  meeting.participants.push(user);
  // First user becomes host
  if (meeting.participants.length === 1) {
    user.isHost = true;
    meeting.hostId = user.id;
  }
}

function removeUserFromMeeting(meetingId: string, userId: string): User | undefined {
  const meeting = meetings.get(meetingId);
  if (!meeting) return undefined;

  const index = meeting.participants.findIndex((p) => p.id === userId);
  if (index === -1) return undefined;

  const [removedUser] = meeting.participants.splice(index, 1);

  // Transfer host if host left
  if (removedUser.isHost && meeting.participants.length > 0) {
    meeting.participants[0].isHost = true;
    meeting.hostId = meeting.participants[0].id;
  }

  // Clean up empty meetings after a delay
  if (meeting.participants.length === 0) {
    setTimeout(() => {
      const m = meetings.get(meetingId);
      if (m && m.participants.length === 0) {
        meetings.delete(meetingId);
        console.log(`Meeting ${meetingId} removed (empty)`);
      }
    }, 60000);
  }

  return removedUser;
}

function getUserInMeeting(meetingId: string, userId: string): User | undefined {
  const meeting = meetings.get(meetingId);
  return meeting?.participants.find((p) => p.id === userId);
}

function updateUserInMeeting(
  meetingId: string,
  userId: string,
  updates: Partial<User>
): User | undefined {
  const meeting = meetings.get(meetingId);
  if (!meeting) return undefined;

  const user = meeting.participants.find((p) => p.id === userId);
  if (!user) return undefined;

  Object.assign(user, updates);
  return user;
}

// HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', meetings: meetings.size }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

httpServer.listen(HTTP_PORT, () => {
  console.log(`HTTP server listening on port ${HTTP_PORT}`);
});

// Socket.io server for WebRTC signaling
const io = new Server(WS_PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

console.log(`Signaling server listening on port ${WS_PORT}`);

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join', (payload: JoinPayload, callback) => {
    try {
      const { userName, meetingId, password, audioEnabled, videoEnabled } = payload;

      // Check meeting password if set
      const meeting = meetings.get(meetingId);
      if (meeting?.settings.password && meeting.settings.password !== password) {
        const error: ErrorPayload = {
          code: 'INVALID_PASSWORD',
          message: '잘못된 회의 비밀번호입니다.',
        };
        callback?.({ success: false, error });
        return;
      }

      // Create user
      const user: User = {
        id: uuidv4(),
        name: userName,
        audioEnabled,
        videoEnabled,
        screenSharing: false,
        isHost: false,
        joinedAt: Date.now(),
      };

      // Get or create meeting
      const meetingResult = getOrCreateMeeting(meetingId, user.id);
      addUserToMeeting(meetingResult, user);

      // Track user socket
      userSockets.set(socket.id, { socketId: socket.id, meetingId });

      // Join socket room
      socket.join(meetingId);

      // Prepare meeting state for the new user
      const currentUser = { ...user };
      const meetingState: MeetingStatePayload = {
        meeting: { ...meetingResult, participants: [...meetingResult.participants] },
        currentUser,
      };

      // Notify others in the meeting
      const userJoinedPayload: UserJoinedPayload = { user: currentUser };
      socket.to(meetingId).emit('signaling', {
        type: 'user-joined',
        payload: userJoinedPayload,
        from: user.id,
        meetingId,
        timestamp: Date.now(),
      } as SignalingMessage);

      // Send meeting state to the new user
      callback?.({ success: true, meetingState });

      console.log(`User ${user.name} (${user.id}) joined meeting ${meetingId}`);
    } catch (error) {
      console.error('Join error:', error);
      const errorPayload: ErrorPayload = {
        code: 'JOIN_FAILED',
        message: '회의 참여에 실패했습니다.',
      };
      callback?.({ success: false, error: errorPayload });
    }
  });

  socket.on('signaling', (message: SignalingMessage, callback) => {
    const userSocket = userSockets.get(socket.id);
    if (!userSocket) {
      callback?.({ success: false, error: { code: 'NOT_JOINED', message: '회의에 참여하지 않았습니다.' } });
      return;
    }

    const { meetingId } = userSocket;

    switch (message.type) {
      case 'offer': {
        const offerPayload = message.payload as OfferPayload;
        // Forward offer to target user
        socket.to(offerPayload.to).emit('signaling', {
          ...message,
          from: userSocket.socketId, // Use socket ID for routing
        });
        callback?.({ success: true });
        break;
      }

      case 'answer': {
        const answerPayload = message.payload as AnswerPayload;
        socket.to(answerPayload.to).emit('signaling', {
          ...message,
          from: userSocket.socketId,
        });
        callback?.({ success: true });
        break;
      }

      case 'ice-candidate': {
        const icePayload = message.payload as IceCandidatePayload;
        socket.to(icePayload.to).emit('signaling', {
          ...message,
          from: userSocket.socketId,
        });
        callback?.({ success: true });
        break;
      }

      case 'user-updated': {
        const updatePayload = message.payload as UserUpdatedPayload;
        const updatedUser = updateUserInMeeting(meetingId, updatePayload.userId, updatePayload.updates);
        if (updatedUser) {
          // Broadcast to all in meeting
          io.to(meetingId).emit('signaling', {
            type: 'user-updated',
            payload: { userId: updatePayload.userId, updates: updatePayload.updates },
            from: userSocket.socketId,
            meetingId,
            timestamp: Date.now(),
          });
        }
        callback?.({ success: true });
        break;
      }

      case 'chat': {
        const chatPayload = message.payload as ChatPayload;
        // Broadcast chat message
        io.to(meetingId).emit('signaling', {
          type: 'chat',
          payload: { message: chatPayload.message, from: userSocket.socketId },
          from: userSocket.socketId,
          meetingId,
          timestamp: Date.now(),
        });
        callback?.({ success: true });
        break;
      }

      case 'screen-share-start': {
        // Notify others that user started screen sharing
        socket.to(meetingId).emit('signaling', {
          type: 'screen-share-start',
          payload: { userId: userSocket.socketId },
          from: userSocket.socketId,
          meetingId,
          timestamp: Date.now(),
        });
        callback?.({ success: true });
        break;
      }

      case 'screen-share-stop': {
        socket.to(meetingId).emit('signaling', {
          type: 'screen-share-stop',
          payload: { userId: userSocket.socketId },
          from: userSocket.socketId,
          meetingId,
          timestamp: Date.now(),
        });
        callback?.({ success: true });
        break;
      }

      case 'kick-user': {
        // Only host can kick
        const meeting = meetings.get(meetingId);
        const requester = getUserInMeeting(meetingId, userSocket.socketId);
        if (meeting && requester?.isHost) {
          const targetId = (message.payload as { userId: string }).userId;
          const targetSocket = Array.from(userSockets.entries()).find(
            ([, v]) => v.socketId === targetId && v.meetingId === meetingId
          );
          if (targetSocket) {
            targetSocket[1].socketId; // target socket ID
            io.to(targetSocket[0]).emit('signaling', {
              type: 'error',
              payload: { code: 'KICKED', message: '호스트에 의해 퇴장되었습니다.' },
              from: 'server',
              meetingId,
              timestamp: Date.now(),
            });
            io.sockets.sockets.get(targetSocket[0])?.disconnect(true);
          }
        }
        callback?.({ success: true });
        break;
      }

      case 'mute-user': {
        const meeting = meetings.get(meetingId);
        const requester = getUserInMeeting(meetingId, userSocket.socketId);
        if (meeting && requester?.isHost) {
          const { userId, muted } = message.payload as { userId: string; muted: boolean };
          updateUserInMeeting(meetingId, userId, { audioEnabled: !muted });
          io.to(meetingId).emit('signaling', {
            type: 'user-updated',
            payload: { userId, updates: { audioEnabled: !muted } },
            from: 'server',
            meetingId,
            timestamp: Date.now(),
          });
        }
        callback?.({ success: true });
        break;
      }

      default:
        callback?.({ success: false, error: { code: 'UNKNOWN_MESSAGE', message: '알 수 없는 메시지 타입' } });
    }
  });

  socket.on('disconnect', () => {
    const userSocket = userSockets.get(socket.id);
    if (userSocket) {
      const { meetingId, socketId } = userSocket;
      const removedUser = removeUserFromMeeting(meetingId, socketId);

      if (removedUser) {
        // Notify others
        const userLeftPayload: UserLeftPayload = { userId: socketId };
        socket.to(meetingId).emit('signaling', {
          type: 'user-left',
          payload: userLeftPayload,
          from: 'server',
          meetingId,
          timestamp: Date.now(),
        });

        console.log(`User ${removedUser.name} (${socketId}) left meeting ${meetingId}`);
      }

      userSockets.delete(socket.id);
    }
    console.log(`Client disconnected: ${socket.id}`);
  });

  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down signaling server...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Servers closed');
      process.exit(0);
    });
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down signaling server...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Servers closed');
      process.exit(0);
    });
  });
});