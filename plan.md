# Livestreamer Platform - Complete Implementation Plan

## Context

Build a livestreaming platform from scratch where admins can broadcast live streams (via OBS), users watch via shareable links, with Google login, real-time chat, viewer management, password-protected streams, and Google Drive backup for recordings.

**Tech Stack**: Next.js 15 (App Router) + TypeScript + Tailwind CSS + Azure
**Approach**: Full scaffold upfront, then fill in implementations feature by feature
**Infrastructure**: Self-hosted LiveKit on existing Azure subscription
**Google Drive**: Manual upload triggered by admin (recordings always in Azure Blob Storage)

---

## 1. Architecture Overview

```
[Admin's OBS Studio] --RTMP--> [LiveKit Server (Azure VM)] --WebRTC--> [Viewer Browsers]
                                       |                                      |
                                       | Egress (recording)           LiveKit Data Channels
                                       v                                (live chat)
                                [Azure Blob Storage]
                                       |
                          (manual trigger by admin)
                                       v
                                [Google Drive API]

[Next.js App (Azure App Service)] <--> [Azure PostgreSQL Flexible Server]
```

### Azure Services Required (Budget: ₹5K/month)

| Component | Azure Service | SKU/Tier | Monthly Cost (₹) |
|---|---|---|---|
| Web App | App Service | Linux B1 | ~₹1,100 |
| Media Server | Virtual Machine | B2s (auto start/stop) | ~₹600-800 |
| Database | PostgreSQL Flexible Server | Burstable B1ms | ~₹1,400 |
| Storage | Blob Storage | Hot tier, LRS | ~₹100 |
| **Total** | | | **~₹3,200-3,400** |

Note: LiveKit VM uses auto start/stop — the app starts the VM when admin begins streaming and deallocates it when streaming ends. This reduces VM cost from ~₹2,500/mo (24/7) to ~₹600-800/mo (a few hours/day). The `@azure/arm-compute` SDK handles this from the Next.js API.

### VM Ports to Open (NSG Rules)

| Port | Protocol | Purpose |
|---|---|---|
| 7880 | TCP | LiveKit API/WebSocket |
| 7881 | TCP | LiveKit RTC over TCP |
| 50000-60000 | UDP | WebRTC media |
| 1935 | TCP | RTMP Ingress (OBS) |
| 443 | TCP | HTTPS (Caddy reverse proxy) |

### Why LiveKit?
- Azure Media Services was **retired June 2024** — no native Azure live streaming service exists
- LiveKit is open-source (Apache 2.0), self-hostable on Azure VM
- Provides: RTMP Ingress (OBS), WebRTC playback (sub-second latency), Egress (recording), Simulcast (adaptive bitrate), Data Channels (chat)
- Single server handles all media needs

---

## 2. Database Schema (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ── NextAuth Required Tables ──────────────────────────────

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ── Core Models ───────────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          UserRole  @default(VIEWER)
  isBlocked     Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  streamsCreated   Stream[]        @relation("StreamCreator")
  chatMessages     ChatMessage[]
  viewerSessions   ViewerSession[]
  blockedEntries   ViewerBlock[]   @relation("BlockedUser")
  blockedByEntries ViewerBlock[]   @relation("BlockedBy")

  @@index([email])
  @@index([role])
}

enum UserRole {
  VIEWER
  ADMIN
  SUPER_ADMIN
}

model Stream {
  id                  String       @id @default(cuid())
  title               String
  description         String?      @db.Text
  status              StreamStatus @default(PENDING)
  isPasswordProtected Boolean      @default(false)
  passwordHash        String?
  shareableSlug       String       @unique @default(cuid())

  // LiveKit
  livekitRoomName  String?  @unique
  livekitIngressId String?
  rtmpUrl          String?
  streamKey        String?

  // Recording
  recordingUrl      String?
  recordingBlobPath String?
  thumbnailUrl      String?
  duration          Int?       // seconds

  // Google Drive
  googleDriveFileId String?
  googleDriveUrl    String?

  // Timestamps
  startedAt DateTime?
  endedAt   DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Relations
  creatorId      String
  creator        User            @relation("StreamCreator", fields: [creatorId], references: [id])
  chatMessages   ChatMessage[]
  viewerSessions ViewerSession[]
  viewerBlocks   ViewerBlock[]

  @@index([status])
  @@index([creatorId])
  @@index([shareableSlug])
}

enum StreamStatus {
  PENDING
  LIVE
  ENDED
  RECORDED
  FAILED
}

model ChatMessage {
  id        String   @id @default(cuid())
  content   String   @db.VarChar(500)
  createdAt DateTime @default(now())
  streamId  String
  stream    Stream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([streamId, createdAt])
  @@index([userId])
}

model ViewerSession {
  id       String    @id @default(cuid())
  joinedAt DateTime  @default(now())
  leftAt   DateTime?
  isActive Boolean   @default(true)
  streamId String
  stream   Stream    @relation(fields: [streamId], references: [id], onDelete: Cascade)
  userId   String
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([streamId, userId, joinedAt])
  @@index([streamId, isActive])
  @@index([userId])
}

model ViewerBlock {
  id            String   @id @default(cuid())
  reason        String?
  createdAt     DateTime @default(now())
  streamId      String
  stream        Stream   @relation(fields: [streamId], references: [id], onDelete: Cascade)
  blockedUserId String
  blockedUser   User     @relation("BlockedUser", fields: [blockedUserId], references: [id])
  blockedById   String
  blockedBy     User     @relation("BlockedBy", fields: [blockedById], references: [id])

  @@unique([streamId, blockedUserId])
  @@index([streamId])
  @@index([blockedUserId])
}
```

---

## 3. Complete Folder Structure (to scaffold)

```
livestreamer/
├── .env.local                              # Local environment variables
├── .env.example                            # Template (committed to git)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── middleware.ts                            # Auth + role-based route protection
│
├── prisma/
│   ├── schema.prisma                       # Full schema above
│   └── seed.ts                             # Seed super admin
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                      # Root layout (SessionProvider, global styles)
│   │   ├── page.tsx                        # Home: grid of live + recent streams
│   │   ├── globals.css                     # Tailwind imports
│   │   ├── loading.tsx                     # Global loading skeleton
│   │   ├── error.tsx                       # Global error boundary
│   │   ├── not-found.tsx                   # 404 page
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx               # Google sign-in button
│   │   │   └── error/
│   │   │       └── page.tsx               # Auth error page
│   │   │
│   │   ├── (main)/
│   │   │   ├── layout.tsx                 # Authenticated layout (header, nav)
│   │   │   ├── streams/
│   │   │   │   ├── page.tsx               # Browse all streams (live + recorded)
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx           # Watch stream (player + chat)
│   │   │   └── watch/
│   │   │       └── [slug]/
│   │   │           ├── page.tsx           # Shareable link entry point
│   │   │           └── password/
│   │   │               └── page.tsx       # Password gate for protected streams
│   │   │
│   │   ├── admin/
│   │   │   ├── layout.tsx                 # Admin layout (sidebar)
│   │   │   ├── page.tsx                   # Admin dashboard
│   │   │   ├── streams/
│   │   │   │   ├── page.tsx               # Admin stream list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx           # Create new stream form
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx           # Stream control panel (start/stop/monitor)
│   │   │   │       └── viewers/
│   │   │   │           └── page.tsx       # Current viewers + block controls
│   │   │   ├── recordings/
│   │   │   │   ├── page.tsx               # All past recordings
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx           # View recording + upload to Drive
│   │   │   └── users/
│   │   │       └── page.tsx               # Super admin: manage admins
│   │   │
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts           # NextAuth handler
│   │       ├── streams/
│   │       │   ├── route.ts               # GET: list, POST: create
│   │       │   └── [id]/
│   │       │       ├── route.ts           # GET, PATCH, DELETE
│   │       │       ├── start/
│   │       │       │   └── route.ts       # POST: create LiveKit room + ingress
│   │       │       ├── stop/
│   │       │       │   └── route.ts       # POST: stop ingress, trigger egress
│   │       │       ├── viewers/
│   │       │       │   └── route.ts       # GET: active viewers list
│   │       │       ├── block/
│   │       │       │   └── route.ts       # POST: block viewer
│   │       │       ├── password/
│   │       │       │   └── route.ts       # POST: verify stream password
│   │       │       └── token/
│   │       │           └── route.ts       # GET: generate LiveKit viewer token
│   │       ├── chat/
│   │       │   └── [streamId]/
│   │       │       ├── route.ts           # GET: chat history (paginated)
│   │       │       └── send/
│   │       │           └── route.ts       # POST: send chat message
│   │       ├── admin/
│   │       │   └── users/
│   │       │       ├── route.ts           # GET: list admins, POST: promote
│   │       │       └── [id]/
│   │       │           └── route.ts       # DELETE: remove admin
│   │       ├── recordings/
│   │       │   └── [id]/
│   │       │       ├── route.ts           # GET: recording metadata + SAS URL
│   │       │       └── drive-upload/
│   │       │           └── route.ts       # POST: upload to Google Drive
│   │       ├── webhooks/
│   │       │   └── livekit/
│   │       │       └── route.ts           # POST: LiveKit event handler
│   │       └── health/
│   │           └── route.ts               # GET: health check
│   │
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── table.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── dropdown-menu.tsx
│   │   ├── auth/
│   │   │   ├── login-button.tsx           # Google sign-in button
│   │   │   ├── user-avatar.tsx            # User avatar with dropdown
│   │   │   └── auth-provider.tsx          # SessionProvider wrapper
│   │   ├── stream/
│   │   │   ├── stream-player.tsx          # LiveKit video player (WebRTC)
│   │   │   ├── stream-card.tsx            # Stream preview card
│   │   │   ├── stream-grid.tsx            # Grid layout of stream cards
│   │   │   ├── stream-status-badge.tsx    # Live/Ended/Recorded badge
│   │   │   ├── password-form.tsx          # Password entry form
│   │   │   └── share-link-dialog.tsx      # Copy shareable link
│   │   ├── chat/
│   │   │   ├── chat-panel.tsx             # Full chat (messages + input)
│   │   │   ├── chat-message.tsx           # Single message bubble
│   │   │   └── chat-input.tsx             # Chat text input
│   │   ├── admin/
│   │   │   ├── stream-control-panel.tsx   # Start/stop/config stream
│   │   │   ├── viewer-list.tsx            # Active viewers table
│   │   │   ├── viewer-block-button.tsx    # Block button
│   │   │   ├── admin-sidebar.tsx          # Sidebar navigation
│   │   │   ├── user-management-table.tsx  # Promote/remove admins
│   │   │   └── recording-list.tsx         # Recordings table
│   │   └── layout/
│   │       ├── header.tsx                 # Top nav bar
│   │       └── footer.tsx                 # Footer
│   │
│   ├── lib/
│   │   ├── prisma.ts                      # Prisma client singleton
│   │   ├── auth.ts                        # NextAuth config export
│   │   ├── auth-options.ts                # Auth options (providers, callbacks)
│   │   ├── livekit.ts                     # LiveKit server SDK clients
│   │   ├── livekit-token.ts               # Token generation helpers
│   │   ├── blob-storage.ts               # Azure Blob Storage helpers
│   │   ├── google-drive.ts               # Google Drive API helpers
│   │   ├── utils.ts                       # cn() and general utilities
│   │   ├── constants.ts                   # SUPER_ADMIN_EMAIL, app config
│   │   └── validations/
│   │       ├── stream.ts                  # Zod schemas for stream
│   │       └── chat.ts                    # Zod schemas for chat
│   │
│   ├── hooks/
│   │   ├── use-chat.ts                    # LiveKit data channel chat hook
│   │   ├── use-viewer-count.ts            # Real-time viewer count
│   │   └── use-stream-status.ts           # Stream status polling
│   │
│   └── types/
│       ├── index.ts                       # Shared types
│       ├── next-auth.d.ts                 # NextAuth type extensions
│       └── stream.ts                      # Stream-related types
```

---

## 4. Key Technical Flows (with code outlines)

### 4.1 Authentication (NextAuth v5 + Google)

**Google OAuth scopes**: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file`

```typescript
// src/lib/auth-options.ts
export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/drive.file",
          access_type: "offline",   // get refresh_token for Drive
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Attach role + userId to session
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      session.user.id = user.id;
      session.user.role = dbUser?.role ?? "VIEWER";
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Auto-assign SUPER_ADMIN on first login if email matches
      if (user.email === process.env.SUPER_ADMIN_EMAIL) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "SUPER_ADMIN" },
        });
      }
    },
  },
};
```

**Middleware** (`middleware.ts`):
- Unauthenticated users → redirect to `/login`
- `/admin/*` routes → require ADMIN or SUPER_ADMIN role
- Allow: `/api/auth/*`, `/api/webhooks/*`, `/api/health`

### 4.2 Starting a Stream

```
POST /api/streams/[id]/start
```

1. Create LiveKit room: `roomService.createRoom({ name: "stream-{id}" })`
2. Create RTMP Ingress with simulcast layers:
   - High: 1920x1080 @ 3Mbps
   - Medium: 1280x720 @ 1.5Mbps
   - Low: 640x360 @ 600Kbps
3. Start Room Composite Egress → records to Azure Blob Storage
4. Update DB: status=LIVE, store rtmpUrl + streamKey
5. Return RTMP URL + stream key to admin (for OBS)

### 4.3 Watching a Stream

```
GET /api/streams/[id]/token
```

1. Check auth (must be logged in)
2. Check if viewer is blocked → 403
3. If password-protected, verify password was submitted
4. Generate LiveKit token: `canPublish: false, canSubscribe: true, canPublishData: true`
5. Frontend connects with `@livekit/components-react`, auto-subscribes to video/audio

### 4.4 Adaptive Bitrate
- LiveKit Ingress transcodes RTMP into 3 simulcast layers (1080p/720p/360p)
- LiveKit SFU monitors each viewer's bandwidth (REMB/TWCC)
- Auto-switches to lower quality for slow connections
- No HLS delay — WebRTC gives sub-second latency

### 4.5 Live Chat
- **Transport**: LiveKit Data Channels (reliable mode) — already connected for video
- **Send**: `room.localParticipant.publishData(encodedMessage, DataPacket_Kind.RELIABLE)`
- **Receive**: `room.on(RoomEvent.DataReceived, handler)`
- **Persist**: Every message saved to `ChatMessage` table via `POST /api/chat/[streamId]/send`
- **Replay**: For recorded streams, load from DB and sync by timestamp

### 4.6 Viewer Tracking & Blocking

**Tracking** via LiveKit webhooks (`POST /api/webhooks/livekit`):
- `participant_joined` → create `ViewerSession` (isActive: true)
- `participant_left` → update `ViewerSession` (isActive: false, leftAt: now)
- `room_started` → update Stream status to LIVE
- `room_finished` → update Stream status to ENDED
- `egress_ended` → update Stream with recording URL, status to RECORDED

**Blocking** (`POST /api/streams/[id]/block`):
1. Create `ViewerBlock` record
2. `roomService.removeParticipant(roomName, userId)` → kicks from LiveKit
3. Token generation endpoint checks block list → prevents rejoin

### 4.7 Recording & Google Drive

**Recording**:
- LiveKit Egress outputs to Azure Blob Storage (S3-compatible)
- `egress_ended` webhook saves recording URL to DB

**Manual Google Drive upload** (`POST /api/recordings/[id]/drive-upload`):
1. Get admin's OAuth tokens from `Account` table
2. Create `google.auth.OAuth2` client with refresh token
3. Stream recording from Blob Storage → Google Drive via resumable upload
4. Save Drive file ID + URL to Stream record

---

## 5. Environment Variables

```env
# Next.js
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<random-32-char-secret>

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>

# Database (Azure PostgreSQL)
DATABASE_URL=postgresql://user:pass@server.postgres.database.azure.com:5432/livestreamer?sslmode=require

# LiveKit (self-hosted on Azure VM)
LIVEKIT_URL=wss://livekit.yourdomain.com
LIVEKIT_API_KEY=<api-key>
LIVEKIT_API_SECRET=<api-secret>
LIVEKIT_WEBHOOK_SECRET=<webhook-secret>

# Azure Blob Storage
AZURE_STORAGE_ACCOUNT_NAME=<account-name>
AZURE_STORAGE_ACCOUNT_KEY=<account-key>
AZURE_STORAGE_CONTAINER=recordings

# App Config
SUPER_ADMIN_EMAIL=your-email@gmail.com
```

---

## 6. Key Dependencies

```json
{
  "dependencies": {
    "next": "^15.x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "next-auth": "^5.x",
    "@auth/prisma-adapter": "^2.x",
    "@prisma/client": "^6.x",
    "livekit-server-sdk": "^2.x",
    "livekit-client": "^2.x",
    "@livekit/components-react": "^2.x",
    "@livekit/components-styles": "^1.x",
    "googleapis": "^144.x",
    "@azure/storage-blob": "^12.x",
    "bcryptjs": "^2.x",
    "zod": "^3.x",
    "hls.js": "^1.x",
    "class-variance-authority": "^0.7.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x",
    "lucide-react": "^0.x"
  },
  "devDependencies": {
    "prisma": "^6.x",
    "typescript": "^5.x",
    "@types/bcryptjs": "^2.x",
    "tailwindcss": "^4.x"
  }
}
```

---

## 7. Build Order (after full scaffold)

### Step 1: Foundation
- Initialize Next.js project with TypeScript + Tailwind + shadcn/ui
- Set up Prisma schema + run migrations against Azure PostgreSQL
- Implement NextAuth with Google provider + Prisma adapter
- Build middleware for route protection
- Create login page, root layout, header, admin sidebar

### Step 2: Livestreaming Core
- Set up LiveKit server on Azure VM (install LiveKit + Ingress + Egress)
- Implement stream CRUD API routes
- Build admin pages: create stream, stream list, stream control panel
- Implement `start` endpoint (LiveKit room + Ingress creation)
- Implement `stop` endpoint (Ingress deletion + Egress trigger)
- Build StreamPlayer component with LiveKit React SDK
- Build `/watch/[slug]` page + shareable link generation

### Step 3: Stream Features
- Add password protection (hash on create, verify on watch)
- Set up LiveKit webhook handler for viewer tracking
- Build admin viewer list page with block controls
- Implement chat via LiveKit Data Channels
- Build ChatPanel, ChatMessage, ChatInput components
- Persist chat messages to database

### Step 4: Recording & Google Drive
- Configure Egress to save to Azure Blob Storage
- Handle `egress_ended` webhook
- Build recording list page + video player for playback
- Implement chat replay synced to recording timestamps
- Build Google Drive upload endpoint + "Save to Drive" button

### Step 5: Admin Management & Polish
- Build super admin user management (promote/remove admins by email)
- Build home page stream grid with live/recorded filters
- Add loading skeletons, error boundaries, toast notifications
- Responsive design pass
- Super admin: view all videos without password

### Step 6: Deployment & Hardening
- Deploy to Azure App Service
- Set up CI/CD via GitHub Actions
- Add rate limiting, CSP headers, webhook signature verification
- Azure Application Insights monitoring
- Write tests (Vitest + Playwright)

---

## 8. Verification Plan

| # | Test | How to Verify |
|---|---|---|
| 1 | Auth | Login with Google → super admin auto-assigned → non-admin blocked from `/admin` |
| 2 | Stream creation | Create stream → RTMP URL + key returned → OBS connects and streams |
| 3 | Viewer playback | Open shareable link in browser → video plays with sub-second latency |
| 4 | Adaptive quality | Throttle network in DevTools → quality drops automatically |
| 5 | Password protection | Create protected stream → viewer prompted → wrong password rejected |
| 6 | Live chat | Send messages → appear for all viewers → persisted in DB |
| 7 | Viewer tracking | Admin sees active viewer list → viewer leaves → removed from list |
| 8 | Viewer blocking | Block viewer → kicked from stream → cannot rejoin |
| 9 | Recording | Stop stream → recording in Blob Storage → playback works with chat replay |
| 10 | Google Drive | Click "Save to Drive" → file appears in admin's Google Drive |
| 11 | Admin management | Super admin promotes user → they access admin panel → remove → access revoked |

---

## 9. LiveKit VM Setup Script (for reference)

```bash
# On Azure VM (Ubuntu 22.04)
# Install LiveKit
curl -sSL https://get.livekit.io | bash

# Install LiveKit Ingress
curl -sSL https://get.livekit.io/ingress | bash

# Install LiveKit Egress (requires Docker)
curl -sSL https://get.livekit.io/egress | bash

# Install Caddy (reverse proxy + auto TLS)
sudo apt install -y caddy

# Configure /etc/livekit.yaml, /etc/caddy/Caddyfile
# Start services: systemctl enable --now livekit-server livekit-ingress
```
