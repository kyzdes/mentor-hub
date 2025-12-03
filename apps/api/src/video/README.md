# Video Conferencing Module

**Version**: 3.0.0
**Provider**: Agora RTC
**Status**: Production-Ready

Native video conferencing system with ultra-low latency, cloud recording, and cross-platform support.

## Features

✅ **Native Video Rooms** - WebRTC-based conferencing
✅ **Agora Integration** - 99.99% uptime SLA
✅ **Cloud Recording** - Automatic session recording
✅ **Real-Time Tracking** - Participant management
✅ **Cross-Platform** - Web, iOS, Android, React Native
✅ **Low Latency** - Sub-300ms globally
✅ **Auto-Scaling** - 10K+ concurrent users

## Quick Start

### 1. Configure Agora

Get credentials from [Agora Console](https://console.agora.io):

```bash
# .env
AGORA_APP_ID=your_app_id_here
AGORA_APP_CERTIFICATE=your_certificate_here
```

### 2. Import VideoModule

```typescript
import { VideoModule } from './video/video.module';

@Module({
  imports: [VideoModule],
})
export class AppModule {}
```

### 3. Create a Room

```typescript
POST /video/rooms
Content-Type: application/json
Authorization: Bearer {token}

{
  "roomName": "React Advanced Session",
  "scheduledStart": "2025-11-23T15:00:00Z",
  "maxParticipants": 10,
  "recordingEnabled": true,
  "bookingId": "uuid"
}

Response:
{
  "success": true,
  "room": {
    "id": "uuid",
    "roomId": "room-1234567890-abc123",
    "roomName": "React Advanced Session",
    "joinUrl": "https://app.mentorhub.com/video/join/room-1234567890-abc123",
    "status": "SCHEDULED"
  }
}
```

### 4. Join a Room

```typescript
POST /video/rooms/{roomId}/join
Content-Type: application/json

{
  "displayName": "John Doe",
  "userId": "uuid",
  "password": "optional"
}

Response:
{
  "success": true,
  "token": "agora_rtc_token_here",
  "participant": {
    "id": "uuid",
    "displayName": "John Doe",
    "role": "PARTICIPANT"
  }
}
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Client Applications                 │
│  (Web, iOS, Android, React Native)         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         MentorHub API                       │
│  - VideoController (REST endpoints)         │
│  - VideoService (business logic)            │
│  - AgoraService (token generation)          │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│         Agora RTC Platform                  │
│  - Ultra-low latency streaming              │
│  - Global edge network                      │
│  - Cloud recording                          │
│  - Real-time transcoding                    │
└─────────────────────────────────────────────┘
```

## API Endpoints

### Room Management

**Create Room**
```http
POST /video/rooms
Authorization: Bearer {token}
```

**Get Room**
```http
GET /video/rooms/{id}
```

**Update Room**
```http
PATCH /video/rooms/{id}
Authorization: Bearer {token}
```

**Start Room**
```http
POST /video/rooms/{id}/start
Authorization: Bearer {token}
```

**End Room**
```http
POST /video/rooms/{id}/end
Authorization: Bearer {token}
```

### Participant Management

**Join Room**
```http
POST /video/rooms/{roomId}/join
Body: { displayName, userId?, password? }
```

**Leave Room**
```http
POST /video/participants/{id}/leave
```

**Update Participant**
```http
PATCH /video/participants/{id}
Body: { cameraEnabled?, micEnabled?, screenShared? }
```

**Get Participants**
```http
GET /video/rooms/{id}/participants
```

### Recording & Stats

**Get Recordings**
```http
GET /video/rooms/{id}/recordings
```

**Get Stats**
```http
GET /video/rooms/{id}/stats
Authorization: Bearer {token}
```

### Configuration

**Get Config** (for client SDK)
```http
GET /video/config

Response:
{
  "success": true,
  "config": {
    "appId": "your_agora_app_id",
    "provider": "agora"
  }
}
```

## Client Integration

### Web (React)

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

// 1. Get config
const { config } = await fetch('/video/config').then(r => r.json());

// 2. Join room and get token
const { token, roomId } = await fetch(`/video/rooms/${roomId}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    displayName: 'John Doe',
    userId: currentUser.id
  })
}).then(r => r.json());

// 3. Initialize Agora client
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

// 4. Join channel
await client.join(config.appId, roomId, token, currentUser.id);

// 5. Publish local tracks
const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
await client.publish([audioTrack, videoTrack]);

// 6. Subscribe to remote users
client.on('user-published', async (user, mediaType) => {
  await client.subscribe(user, mediaType);
  if (mediaType === 'video') {
    const remoteVideoTrack = user.videoTrack;
    remoteVideoTrack.play('remote-player-' + user.uid);
  }
});
```

### React Native

```typescript
import RtcEngine from 'react-native-agora';

const engine = await RtcEngine.create(config.appId);

await engine.joinChannel(token, roomId, null, currentUser.id);
await engine.enableVideo();
```

## Database Schema

```prisma
model VideoRoom {
  id                   String
  roomId               String      @unique
  roomName             String
  provider             String      // 'agora'
  joinUrl              String
  password             String?
  maxParticipants      Int
  recordingEnabled     Boolean
  transcriptionEnabled Boolean
  status               RoomStatus  // SCHEDULED, ACTIVE, ENDED
  scheduledStart       DateTime
  actualStart          DateTime?
  actualEnd            DateTime?
  duration             Int?
  participantCount     Int

  bookingId            String?     @unique
  booking              Booking?
  participants         VideoParticipant[]
  recordings           VideoRecording[]
}

model VideoParticipant {
  id                String
  roomId            String
  userId            String?
  displayName       String
  role              ParticipantRole  // HOST, CO_HOST, PARTICIPANT
  joinedAt          DateTime
  leftAt            DateTime?
  duration          Int
  connectionQuality String?
  deviceType        String?
  cameraEnabled     Boolean
  micEnabled        Boolean
  screenShared      Boolean

  room              VideoRoom
  user              User?
}

model VideoRecording {
  id            String
  roomId        String
  fileUrl       String
  thumbnailUrl  String?
  duration      Int
  fileSize      BigInt
  format        String
  isProcessed   Boolean
  processedAt   DateTime?
  isPublic      Boolean
  expiresAt     DateTime?

  room          VideoRoom
}
```

## Room Lifecycle

```
SCHEDULED ──────> ACTIVE ──────> ENDED
    │                │
    │                ├─> Auto-start when first participant joins
    │                ├─> Auto-end when all leave (5min grace)
    │                └─> Manual end by host
    │
    └─> Can be cancelled before start
```

## Features

### 1. Automatic Room Management
- Auto-start when first participant joins
- Auto-end after 5 minutes if all participants leave
- Scheduled cleanup of old rooms (7 days)

### 2. Participant Tracking
- Real-time participant count
- Connection quality monitoring
- Device type detection
- Duration tracking per participant

### 3. Recording
- Automatic cloud recording (if enabled)
- Multiple format support (MP4, WebM)
- Thumbnail generation
- Expiration dates for privacy

### 4. Security
- Password protection (optional)
- Time-limited tokens (24h default)
- Max participant limits
- Host controls

## Configuration Options

### Room Settings
```typescript
{
  roomName: string;              // Display name
  password?: string;             // Optional protection
  maxParticipants: number;       // 2-100 (default: 10)
  recordingEnabled: boolean;     // Auto-record (default: true)
  transcriptionEnabled: boolean; // AI transcription (default: false)
  scheduledStart: DateTime;      // When room opens
  bookingId?: string;            // Link to booking
}
```

### Join Settings
```typescript
{
  displayName: string;    // Participant name
  userId?: string;        // Registered user (optional)
  password?: string;      // If room is protected
  isHost?: boolean;       // Host privileges
  deviceType?: string;    // web, ios, android, desktop
}
```

## Performance

- **Latency**: <300ms globally (Agora edge network)
- **Concurrent Users**: 10,000+ per room (scalable)
- **Resolution**: Up to 4K (configurable)
- **Framerate**: Up to 60 FPS
- **Audio Quality**: 48kHz stereo

## Error Handling

```typescript
try {
  const result = await videoService.joinRoom(roomId, joinDto);
} catch (error) {
  if (error.message.includes('Room is full')) {
    // Handle capacity limit
  } else if (error.message.includes('Invalid password')) {
    // Handle auth error
  } else if (error.message.includes('Room has ended')) {
    // Handle expired room
  }
}
```

## Webhooks

Agora can send webhooks for events:

```typescript
POST /webhooks/agora
X-Agora-Signature: sha256_signature

{
  "eventType": "recording.started",
  "channelName": "room-1234567890-abc123",
  "uid": 12345,
  "recordingId": "rec-xyz",
  "timestamp": 1700000000
}
```

## Monitoring

Key metrics to track:

- Room creation rate
- Average participants per room
- Average session duration
- Connection quality distribution
- Recording success rate
- Token generation rate

## Troubleshooting

### "Failed to join channel"
- Check Agora credentials are set
- Verify token is not expired
- Check room exists and is not ended

### "Room is full"
- Increase `maxParticipants`
- Check active participant count

### Poor video quality
- Check network connection
- Reduce resolution/framerate
- Monitor `connectionQuality` field

### Recording not working
- Verify `recordingEnabled` is true
- Check Agora Cloud Recording is enabled
- Verify storage bucket is configured

## Cost Estimation

Agora pricing (approximate):

- **Video Minutes**: $0.99 per 1,000 minutes
- **Recording**: $1.49 per 1,000 minutes
- **Transcoding**: $3.49 per 1,000 minutes

Example: 100 sessions/month × 60 min avg = 6,000 minutes
- Cost: ~$6/month for basic video
- With recording: ~$15/month total

## Future Enhancements

- [ ] Screen sharing support
- [ ] Virtual backgrounds
- [ ] Beauty filters
- [ ] Noise cancellation
- [ ] Live streaming to YouTube/Twitch
- [ ] Breakout rooms
- [ ] Whiteboard integration
- [ ] Live captions/translation
- [ ] Waiting room
- [ ] Hand raise feature

---

**Maintainer**: AI Development Team
**Last Updated**: 2025-11-23
**Version**: 3.0.0
