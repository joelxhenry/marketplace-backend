# Service Provider Marketplace - Backend Setup Plan (Updated)
## Jamaica-Focused Platform | NestJS + Prisma + PostgreSQL + Multi-Gateway Payments

---

## Overview

This plan provides step-by-step instructions to build the backend for a Service Provider Marketplace platform targeting Jamaica. The backend will handle user authentication (Google/Apple only), provider profiles with multiple locations and users, booking management, payment processing (multiple Jamaican gateways), real-time communication, and enhanced content management.

**Key Updates:**
- **Authentication**: Google and Apple ID only (no email/password)
- **Multi-location providers**: Separate locations table with grid-based coordinates
- **Multiple provider users**: Team-based provider management
- **Enhanced portfolio**: Support for photos, YouTube, and Vimeo videos

**Technology Stack:**
- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL 15+ with PostGIS
- **ORM:** Prisma
- **Cache/Sessions:** Redis
- **Authentication:** OAuth only (Google, Apple)
- **Payments:** Paymaster Jamaica (primary), NCB Gateway, Stripe (international)
- **Real-time:** WebSockets (Socket.io)
- **File Storage:** AWS S3 or local
- **Notifications:** Twilio (SMS), SendGrid (Email), FCM (Push)

---

## Phase 1: Core Infrastructure Setup

### Step 1: Initialize NestJS Project

```bash
# Install NestJS CLI globally
npm install -g @nestjs/cli

# Create new project
nest new service-marketplace-backend
cd service-marketplace-backend

# Install core dependencies
npm install @nestjs/config @nestjs/jwt @nestjs/passport
npm install @nestjs/websockets @nestjs/platform-socket.io
npm install @nestjs/schedule @nestjs/cache-manager
npm install @nestjs/swagger @nestjs/serve-static
npm install @nestjs/throttler @nestjs/bull

# Install database and ORM
npm install prisma @prisma/client
npm install class-validator class-transformer

# Install OAuth authentication (Google & Apple only)
npm install passport passport-jwt passport-google-oauth20
npm install apple-signin-auth
npm install jsonwebtoken
npm install @types/passport-jwt @types/passport-google-oauth20

# Install utilities
npm install helmet compression cors
npm install bull redis ioredis
npm install nodemailer twilio

# Development dependencies
npm install -D @types/node @types/nodemailer
npm install -D @types/compression @types/cors
```

### Step 2: Environment Configuration

Create comprehensive environment configuration:

**`.env.example`:**
```env
# Application
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000
FRONTEND_URL=http://localhost:4321

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/marketplace?schema=public"
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# OAuth (Google & Apple only)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_KEY_ID=your-apple-key-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_PRIVATE_KEY_PATH=./certs/apple-private-key.p8

# Payment Gateways - Jamaica
PAYMASTER_API_KEY=your-paymaster-api-key
PAYMASTER_MERCHANT_ID=your-paymaster-merchant-id
PAYMASTER_BASE_URL=https://api.paymaster.com.jm

NCB_API_KEY=your-ncb-api-key
NCB_MERCHANT_ID=your-ncb-merchant-id
NCB_BASE_URL=https://api.ncbjamaica.com

# Stripe (International/Subscriptions)
STRIPE_PUBLIC_KEY=pk_test_your-stripe-public-key
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# External Services
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1876XXXXXXX

SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourplatform.com

GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# File Storage
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=marketplace-assets

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY=your-firebase-private-key
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
```

**`src/config/configuration.ts`:**
```typescript
export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  database: {
    url: process.env.DATABASE_URL,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN,
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID,
      keyId: process.env.APPLE_KEY_ID,
      teamId: process.env.APPLE_TEAM_ID,
      privateKeyPath: process.env.APPLE_PRIVATE_KEY_PATH,
    },
  },
  payments: {
    paymaster: {
      apiKey: process.env.PAYMASTER_API_KEY,
      merchantId: process.env.PAYMASTER_MERCHANT_ID,
      baseUrl: process.env.PAYMASTER_BASE_URL,
    },
    ncb: {
      apiKey: process.env.NCB_API_KEY,
      merchantId: process.env.NCB_MERCHANT_ID,
      baseUrl: process.env.NCB_BASE_URL,
    },
    stripe: {
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  },
  external: {
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
    },
    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
      s3Bucket: process.env.AWS_S3_BUCKET,
    },
    firebase: {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    },
  },
});
```

### Step 3: Database Setup with Prisma

**Initialize Prisma:**
```bash
npx prisma init
```

**`prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Enums
enum UserRole {
  CUSTOMER
  PROVIDER
  ADMIN
}

enum Parish {
  KINGSTON
  ST_ANDREW
  ST_CATHERINE
  CLARENDON
  MANCHESTER
  ST_ELIZABETH
  WESTMORELAND
  HANOVER
  ST_JAMES
  TRELAWNY
  ST_ANN
  ST_MARY
  PORTLAND
  ST_THOMAS
}

enum Currency {
  JMD
  USD
}

enum PaymentGateway {
  PAYMASTER
  NCB
  STRIPE
  CASH
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
  CANCELLED
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
  NO_SHOW
}

enum SubscriptionPlan {
  BASIC
  PROFESSIONAL
  PREMIUM
}

enum SubscriptionStatus {
  ACTIVE
  INACTIVE
  CANCELLED
  PAST_DUE
}

enum NotificationType {
  EMAIL
  SMS
  PUSH
}

enum PortfolioItemType {
  PHOTO
  VIDEO_YOUTUBE
  VIDEO_VIMEO
}

// Core Models
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  phone         String?   // International format
  firstName     String
  lastName      String
  avatar        String?
  role          UserRole  @default(CUSTOMER)
  isEmailVerified Boolean @default(false)
  isPhoneVerified Boolean @default(false)
  
  // OAuth only authentication (no password)
  googleId      String?   @unique
  appleId       String?   @unique
  
  // Relationships
  customerBookings    Booking[] @relation("CustomerBookings")
  providerUsers       ProviderUser[] // Users can be associated with multiple providers
  reviews             Review[]  @relation("CustomerReviews")
  conversations       ConversationParticipant[]
  messages            Message[]
  notifications       Notification[]
  assignedBookings    Booking[] @relation("AssignedBookings") // Bookings assigned to specific provider users
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@map("users")
}

model Location {
  id        String  @id @default(uuid())
  name      String  // Location name/identifier
  address   String
  city      String?
  parish    Parish? // For Jamaica, can be null for international
  state     String? // For other countries
  country   String  @default("Jamaica")
  
  // Grid-based coordinates for better precision
  latitude  Decimal @db.Decimal(10, 8)  // Higher precision for exact positioning
  longitude Decimal @db.Decimal(11, 8)  // Higher precision for exact positioning
  
  // Additional location data
  zipCode   String?
  timezone  String  @default("America/Jamaica")
  
  // Relationships
  providerLocations ProviderLocation[]
  bookings         Booking[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([latitude, longitude])
  @@index([parish, city])
  @@index([country, state, city])
  @@map("locations")
}

model Provider {
  id              String   @id @default(uuid())
  
  // Business Information
  businessName    String
  description     String   @db.Text
  logoUrl         String?
  bannerUrl       String?
  
  // Contact Information
  businessPhone   String
  businessEmail   String
  whatsapp        String?
  website         String?
  
  // Business Details
  businessRegNo   String?  // Business registration number
  taxRegNo        String?  // Tax registration number
  
  // Verification & Status
  isVerified      Boolean  @default(false)
  isActive        Boolean  @default(true)
  verifiedAt      DateTime?
  
  // Settings
  autoAcceptBookings Boolean @default(false)
  bookingBufferMins  Int     @default(15)
  cancellationPolicy String? @db.Text
  
  // Subscription
  subscriptionPlan   SubscriptionPlan @default(BASIC)
  subscriptionStatus SubscriptionStatus @default(INACTIVE)
  subscriptionId     String?  // Stripe subscription ID
  planExpiresAt      DateTime?
  
  // Statistics
  totalBookings   Int     @default(0)
  totalRevenue    Decimal @default(0) @db.Decimal(10,2)
  averageRating   Float?
  reviewCount     Int     @default(0)
  
  // Relationships
  providerUsers     ProviderUser[]    // Multiple users can be part of a provider
  providerLocations ProviderLocation[] // Provider can have multiple locations
  services          Service[]
  availabilities    Availability[]
  bookings          Booking[]     @relation("ProviderBookings")
  reviews           Review[]      @relation("ProviderReviews")
  blogPosts         BlogPost[]
  portfolioItems    PortfolioItem[]
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([isActive, isVerified])
  @@map("providers")
}

model ProviderUser {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Role within the provider business
  title      String?  // e.g., "Senior Barber", "Nail Technician", "Owner"
  isOwner    Boolean  @default(false)
  isActive   Boolean  @default(true)
  
  // Permissions
  canManageBookings   Boolean @default(true)
  canManageServices   Boolean @default(false)
  canManageLocations  Boolean @default(false)
  canViewAnalytics    Boolean @default(false)
  
  // Professional details
  bio        String?  @db.Text
  expertise  String[] // Array of specialties
  
  // Individual statistics
  completedBookings Int @default(0)
  averageRating     Float?
  reviewCount       Int @default(0)
  
  // Relationships
  availabilities  Availability[]
  assignedBookings Booking[] @relation("AssignedBookings")
  
  joinedAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@unique([providerId, userId])
  @@index([providerId])
  @@index([userId])
  @@map("provider_users")
}

model ProviderLocation {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  locationId String
  location   Location @relation(fields: [locationId], references: [id], onDelete: Cascade)
  
  // Location-specific details for this provider
  isPrimary  Boolean  @default(false) // One primary location per provider
  isActive   Boolean  @default(true)
  
  // Relationships
  availabilities Availability[]
  
  createdAt  DateTime @default(now())
  
  @@unique([providerId, locationId])
  @@index([providerId])
  @@map("provider_locations")
}

model Service {
  id          String   @id @default(uuid())
  providerId  String
  provider    Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  name        String
  description String   @db.Text
  category    String   // Hair, Beauty, Photography, etc.
  subCategory String?  // Cuts, Color, Locs, etc.
  
  // Pricing (JMD primary)
  basePrice   Decimal  @db.Decimal(8,2)
  currency    Currency @default(JMD)
  
  // Service Details
  duration    Int      // Duration in minutes
  isActive    Boolean  @default(true)
  
  // Booking Settings
  requiresApproval Boolean @default(false)
  advanceBookingDays Int   @default(30)
  
  // Add-ons and packages
  addOns      ServiceAddOn[]
  bookingItems BookingItem[]
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([providerId])
  @@index([category, subCategory])
  @@map("services")
}

model ServiceAddOn {
  id        String  @id @default(uuid())
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  
  name      String
  price     Decimal @db.Decimal(8,2)
  duration  Int     // Additional minutes
  
  @@map("service_add_ons")
}

model Availability {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  // Optional: Specific provider user availability
  providerUserId String?
  providerUser   ProviderUser? @relation(fields: [providerUserId], references: [id], onDelete: Cascade)
  
  // Optional: Location-specific availability
  providerLocationId String?
  providerLocation   ProviderLocation? @relation(fields: [providerLocationId], references: [id], onDelete: Cascade)
  
  dayOfWeek  Int      // 0 = Sunday, 6 = Saturday
  startTime  String   // "09:00"
  endTime    String   // "17:00"
  isActive   Boolean  @default(true)
  
  // Date-specific overrides
  specificDate DateTime? // For one-off availability changes
  isOverride   Boolean   @default(false)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([providerId, dayOfWeek])
  @@index([providerUserId, dayOfWeek])
  @@map("availabilities")
}

model Booking {
  id         String        @id @default(uuid())
  
  // Relationships
  customerId String
  customer   User         @relation("CustomerBookings", fields: [customerId], references: [id])
  providerId String
  provider   Provider     @relation("ProviderBookings", fields: [providerId], references: [id])
  
  // Specific provider user assignment
  assignedUserId String?
  assignedUser   User?    @relation("AssignedBookings", fields: [assignedUserId], references: [id])
  
  // Location for this booking
  locationId String
  location   Location    @relation(fields: [locationId], references: [id])
  
  // Booking Details
  startTime  DateTime
  endTime    DateTime
  status     BookingStatus @default(PENDING)
  
  // Pricing
  subtotal   Decimal      @db.Decimal(8,2)
  taxAmount  Decimal      @default(0) @db.Decimal(8,2)
  totalAmount Decimal     @db.Decimal(8,2)
  currency   Currency     @default(JMD)
  
  // Customer Information
  customerNotes String?   @db.Text
  
  // Provider Information
  providerNotes String?   @db.Text
  
  // Booking Items
  items      BookingItem[]
  
  // Payment
  payment    Payment?
  
  // Review
  review     Review?
  
  // Timestamps
  confirmedAt DateTime?
  completedAt DateTime?
  cancelledAt DateTime?
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([customerId])
  @@index([providerId])
  @@index([assignedUserId])
  @@index([locationId])
  @@index([startTime])
  @@index([status])
  @@map("bookings")
}

model BookingItem {
  id        String  @id @default(uuid())
  bookingId String
  booking   Booking @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  serviceId String
  service   Service @relation(fields: [serviceId], references: [id])
  
  quantity  Int     @default(1)
  unitPrice Decimal @db.Decimal(8,2)
  total     Decimal @db.Decimal(8,2)
  
  @@map("booking_items")
}

model Payment {
  id            String         @id @default(uuid())
  bookingId     String         @unique
  booking       Booking        @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  // Payment Details
  amount        Decimal        @db.Decimal(8,2)
  currency      Currency       @default(JMD)
  gateway       PaymentGateway
  status        PaymentStatus  @default(PENDING)
  
  // Gateway-specific
  gatewayPaymentId String?     // External payment ID
  gatewayResponse  Json?       // Raw gateway response
  
  // Fees
  platformFee   Decimal        @db.Decimal(8,2)
  gatewayFee    Decimal        @db.Decimal(8,2)
  providerAmount Decimal       @db.Decimal(8,2)
  
  // Timing
  processedAt   DateTime?
  failedAt      DateTime?
  refundedAt    DateTime?
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([gateway])
  @@index([status])
  @@map("payments")
}

model Review {
  id         String   @id @default(uuid())
  
  // Relationships
  bookingId  String   @unique
  booking    Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  customerId String
  customer   User     @relation("CustomerReviews", fields: [customerId], references: [id])
  providerId String
  provider   Provider @relation("ProviderReviews", fields: [providerId], references: [id])
  
  // Review Content
  rating     Int      // 1-5 stars
  comment    String?  @db.Text
  photos     String[] // Array of S3 URLs
  
  // Provider Response
  response   String?  @db.Text
  respondedAt DateTime?
  
  // Moderation
  isApproved Boolean  @default(true)
  isFlagged  Boolean  @default(false)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([providerId])
  @@index([rating])
  @@map("reviews")
}

model BlogPost {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  title      String
  slug       String   @unique
  excerpt    String?  @db.Text
  content    String   @db.Text
  coverImage String?
  
  // SEO
  metaTitle  String?
  metaDescription String?
  keywords   String[]
  
  // Publishing
  isPublished Boolean  @default(false)
  publishedAt DateTime?
  
  // Engagement
  viewCount  Int      @default(0)
  likeCount  Int      @default(0)
  
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([providerId])
  @@index([isPublished, publishedAt])
  @@map("blog_posts")
}

model PortfolioItem {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  
  title      String
  description String? @db.Text
  
  // Media content - can be photo or video
  type       PortfolioItemType
  imageUrl   String?  // For photos
  videoUrl   String?  // For YouTube/Vimeo URLs
  videoId    String?  // YouTube/Vimeo video ID for embedding
  
  // Metadata
  category   String   // Before/After, Styles, Events, etc.
  tags       String[] // Searchable tags
  
  // Ordering
  sortOrder  Int      @default(0)
  isFeatured Boolean  @default(false)
  
  createdAt  DateTime @default(now())
  
  @@index([providerId, category])
  @@index([type])
  @@map("portfolio_items")
}

// Communication Models
model Conversation {
  id           String   @id @default(uuid())
  
  // Relationships
  participants ConversationParticipant[]
  messages     Message[]
  
  // Metadata
  lastMessageAt DateTime?
  isActive     Boolean  @default(true)
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@map("conversations")
}

model ConversationParticipant {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  joinedAt       DateTime     @default(now())
  lastReadAt     DateTime?
  
  @@unique([conversationId, userId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(uuid())
  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  senderId       String
  sender         User         @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  content        String       @db.Text
  attachments    String[]     // Array of file URLs
  
  // Message Type
  isSystemMessage Boolean     @default(false)
  
  createdAt      DateTime     @default(now())
  
  @@index([conversationId, createdAt])
  @@map("messages")
}

model Notification {
  id        String           @id @default(uuid())
  userId    String
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  type      NotificationType
  title     String
  content   String           @db.Text
  data      Json?            // Additional data
  
  isRead    Boolean          @default(false)
  sentAt    DateTime?
  readAt    DateTime?
  
  createdAt DateTime         @default(now())
  
  @@index([userId, isRead])
  @@map("notifications")
}

// System Models
model Setting {
  id    String @id @default(uuid())
  key   String @unique
  value Json
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("settings")
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  action    String
  entity    String
  entityId  String
  changes   Json?
  ipAddress String?
  userAgent String?
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([entity, entityId])
  @@map("audit_logs")
}
```

**Run Prisma migrations:**
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### Step 4: OAuth-Only Authentication Module

**`src/auth/auth.module.ts`:**
```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { AppleStrategy } from './strategies/apple.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret'),
        signOptions: { expiresIn: config.get('jwt.expiresIn') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    AppleStrategy,
  ],
  exports: [AuthService],
})
export class AuthModule {}
```

**`src/auth/auth.service.ts`:**
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';

import { DatabaseService } from '../database/database.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async googleLogin(profile: any) {
    const { email, firstName, lastName, picture } = profile;

    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // Create new user from Google profile
      user = await this.prisma.user.create({
        data: {
          email,
          firstName,
          lastName,
          avatar: picture,
          googleId: profile.id,
          isEmailVerified: true,
        },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    } else if (!user.googleId) {
      // Link existing account to Google
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { googleId: profile.id },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }

  async appleLogin(appleId: string, email: string, firstName?: string, lastName?: string) {
    let user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { appleId },
          { email },
        ],
      },
      include: {
        providerUsers: {
          include: {
            provider: {
              select: {
                id: true,
                businessName: true,
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      // Create new user from Apple ID
      user = await this.prisma.user.create({
        data: {
          email,
          firstName: firstName || 'Apple',
          lastName: lastName || 'User',
          appleId,
          isEmailVerified: true,
        },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    } else if (!user.appleId) {
      // Link existing account to Apple
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { appleId },
        include: {
          providerUsers: {
            include: {
              provider: {
                select: {
                  id: true,
                  businessName: true,
                  subscriptionPlan: true,
                },
              },
            },
          },
        },
      });
    }

    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      providers: user.providerUsers.map(pu => ({
        id: pu.provider.id,
        name: pu.provider.businessName,
        isOwner: pu.isOwner,
      }))
    };
    const accessToken = this.jwtService.sign(payload);

    return { user, accessToken };
  }
}
```

**`src/auth/strategies/apple.strategy.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/strategy';
import { Strategy } from 'passport-apple';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppleStrategy extends PassportStrategy(Strategy, 'apple') {
  constructor(private readonly configService: ConfigService) {
    const privateKeyPath = configService.get('oauth.apple.privateKeyPath');
    const privateKey = fs.readFileSync(path.resolve(privateKeyPath), 'utf8');

    super({
      clientID: configService.get('oauth.apple.clientId'),
      teamID: configService.get('oauth.apple.teamId'),
      keyID: configService.get('oauth.apple.keyId'),
      privateKey,
      callbackURL: `${configService.get('app.url')}/auth/apple/callback`,
      scope: ['name', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    idToken: any,
    profile: any,
  ) {
    return {
      id: idToken.sub,
      email: idToken.email,
      firstName: profile.name?.firstName,
      lastName: profile.name?.lastName,
      accessToken,
    };
  }
}
```

### Step 5: Enhanced Location Service

**`src/locations/locations.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { Parish } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: DatabaseService) {}

  async createLocation(data: {
    name: string;
    address: string;
    city?: string;
    parish?: Parish;
    state?: string;
    country?: string;
    latitude: number;
    longitude: number;
    zipCode?: string;
    timezone?: string;
  }) {
    return this.prisma.location.create({
      data: {
        ...data,
        latitude: data.latitude,
        longitude: data.longitude,
      },
    });
  }

  async findNearbyLocations(
    latitude: number,
    longitude: number,
    radiusKm: number = 25,
  ) {
    const radiusMeters = radiusKm * 1000;

    // Use PostgreSQL with PostGIS for precise geospatial queries
    const locations = await this.prisma.$queryRaw`
      SELECT 
        l.*,
        ST_Distance(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography
        ) / 1000 as distance_km
      FROM "locations" l
      WHERE ST_DWithin(
        ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
        ST_MakePoint(${longitude}, ${latitude})::geography,
        ${radiusMeters}
      )
      ORDER BY distance_km ASC
      LIMIT 50
    `;

    return locations;
  }

  async getProviderLocations(providerId: string) {
    return this.prisma.providerLocation.findMany({
      where: { providerId, isActive: true },
      include: {
        location: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });
  }

  async addProviderLocation(
    providerId: string,
    locationData: {
      name: string;
      address: string;
      city?: string;
      parish?: Parish;
      latitude: number;
      longitude: number;
      isPrimary?: boolean;
    },
  ) {
    // Create location first
    const location = await this.createLocation({
      ...locationData,
      country: 'Jamaica',
    });

    // If this is set as primary, unset other primary locations
    if (locationData.isPrimary) {
      await this.prisma.providerLocation.updateMany({
        where: { providerId },
        data: { isPrimary: false },
      });
    }

    // Link to provider
    return this.prisma.providerLocation.create({
      data: {
        providerId,
        locationId: location.id,
        isPrimary: locationData.isPrimary || false,
      },
      include: {
        location: true,
      },
    });
  }

  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100; // Round to 2 decimal places
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

### Step 6: Enhanced Portfolio Service

**`src/portfolio/portfolio.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { PortfolioItemType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class PortfolioService {
  constructor(private readonly prisma: DatabaseService) {}

  async createPortfolioItem(data: {
    providerId: string;
    title: string;
    description?: string;
    type: PortfolioItemType;
    imageUrl?: string;
    videoUrl?: string;
    category: string;
    tags?: string[];
    isFeatured?: boolean;
  }) {
    let videoId: string | undefined;

    // Extract video ID for YouTube/Vimeo
    if (data.type === PortfolioItemType.VIDEO_YOUTUBE && data.videoUrl) {
      videoId = this.extractYouTubeId(data.videoUrl);
    } else if (data.type === PortfolioItemType.VIDEO_VIMEO && data.videoUrl) {
      videoId = this.extractVimeoId(data.videoUrl);
    }

    // Validate that the correct URL type is provided
    if (data.type === PortfolioItemType.PHOTO && !data.imageUrl) {
      throw new Error('Image URL is required for photo portfolio items');
    }
    if (data.type !== PortfolioItemType.PHOTO && !data.videoUrl) {
      throw new Error('Video URL is required for video portfolio items');
    }

    return this.prisma.portfolioItem.create({
      data: {
        ...data,
        videoId,
        tags: data.tags || [],
      },
    });
  }

  async getProviderPortfolio(
    providerId: string,
    filters?: {
      type?: PortfolioItemType;
      category?: string;
      isFeatured?: boolean;
    },
  ) {
    return this.prisma.portfolioItem.findMany({
      where: {
        providerId,
        ...(filters?.type && { type: filters.type }),
        ...(filters?.category && { category: filters.category }),
        ...(filters?.isFeatured !== undefined && { isFeatured: filters.isFeatured }),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async updatePortfolioItem(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      imageUrl: string;
      videoUrl: string;
      category: string;
      tags: string[];
      isFeatured: boolean;
      sortOrder: number;
    }>,
  ) {
    let videoId: string | undefined;

    // Re-extract video ID if video URL is being updated
    if (data.videoUrl) {
      const portfolioItem = await this.prisma.portfolioItem.findUnique({
        where: { id },
        select: { type: true },
      });

      if (portfolioItem?.type === PortfolioItemType.VIDEO_YOUTUBE) {
        videoId = this.extractYouTubeId(data.videoUrl);
      } else if (portfolioItem?.type === PortfolioItemType.VIDEO_VIMEO) {
        videoId = this.extractVimeoId(data.videoUrl);
      }
    }

    return this.prisma.portfolioItem.update({
      where: { id },
      data: {
        ...data,
        ...(videoId && { videoId }),
      },
    });
  }

  private extractYouTubeId(url: string): string | undefined {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  private extractVimeoId(url: string): string | undefined {
    const regex = /(?:vimeo\.com\/)(?:.*#|.*/videos/)?([0-9]+)/i;
    const match = url.match(regex);
    return match ? match[1] : undefined;
  }

  getYouTubeEmbedUrl(videoId: string): string {
    return `https://www.youtube.com/embed/${videoId}`;
  }

  getVimeoEmbedUrl(videoId: string): string {
    return `https://player.vimeo.com/video/${videoId}`;
  }

  getVideoThumbnail(type: PortfolioItemType, videoId: string): string {
    if (type === PortfolioItemType.VIDEO_YOUTUBE) {
      return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } else if (type === PortfolioItemType.VIDEO_VIMEO) {
      // Vimeo requires API call for thumbnail, return placeholder for now
      return `https://vumbnail.com/${videoId}.jpg`;
    }
    return '';
  }
}
```

### Step 7: Multi-User Provider Management Service

**`src/providers/provider-users.service.ts`:**
```typescript
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ProviderUsersService {
  constructor(private readonly prisma: DatabaseService) {}

  async addUserToProvider(
    providerId: string,
    userId: string,
    data: {
      title?: string;
      isOwner?: boolean;
      canManageBookings?: boolean;
      canManageServices?: boolean;
      canManageLocations?: boolean;
      canViewAnalytics?: boolean;
      bio?: string;
      expertise?: string[];
    },
    requestingUserId: string,
  ) {
    // Check if requesting user has permission to add users
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    if (!requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Only owners can add users to provider');
    }

    // Check if user is already part of this provider
    const existingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId } },
    });

    if (existingProviderUser) {
      throw new ForbiddenException('User is already part of this provider');
    }

    return this.prisma.providerUser.create({
      data: {
        providerId,
        userId,
        ...data,
        expertise: data.expertise || [],
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateProviderUser(
    providerId: string,
    userId: string,
    data: Partial<{
      title: string;
      isActive: boolean;
      canManageBookings: boolean;
      canManageServices: boolean;
      canManageLocations: boolean;
      canViewAnalytics: boolean;
      bio: string;
      expertise: string[];
    }>,
    requestingUserId: string,
  ) {
    // Check permissions
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    // Users can update their own profiles, or owners can update anyone
    if (requestingUserId !== userId && !requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Insufficient permissions');
    }

    const providerUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId } },
    });

    if (!providerUser) {
      throw new NotFoundException('Provider user not found');
    }

    return this.prisma.providerUser.update({
      where: { providerId_userId: { providerId, userId } },
      data,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeUserFromProvider(
    providerId: string,
    userId: string,
    requestingUserId: string,
  ) {
    // Check if requesting user has permission
    const requestingProviderUser = await this.prisma.providerUser.findUnique({
      where: { providerId_userId: { providerId, userId: requestingUserId } },
    });

    if (!requestingProviderUser?.isOwner && requestingUserId !== userId) {
      throw new ForbiddenException('Insufficient permissions');
    }

    // Don't allow removing the last owner
    if (requestingUserId === userId) {
      const ownerCount = await this.prisma.providerUser.count({
        where: { providerId, isOwner: true },
      });

      const userToRemove = await this.prisma.providerUser.findUnique({
        where: { providerId_userId: { providerId, userId } },
      });

      if (userToRemove?.isOwner && ownerCount <= 1) {
        throw new ForbiddenException('Cannot remove the last owner');
      }
    }

    return this.prisma.providerUser.delete({
      where: { providerId_userId: { providerId, userId } },
    });
  }

  async getProviderUsers(providerId: string) {
    return this.prisma.providerUser.findMany({
      where: { providerId, isActive: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: [
        { isOwner: 'desc' },
        { joinedAt: 'asc' },
      ],
    });
  }

  async getUserProviders(userId: string) {
    return this.prisma.providerUser.findMany({
      where: { userId, isActive: true },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            logoUrl: true,
            isVerified: true,
            subscriptionPlan: true,
          },
        },
      },
    });
  }
}
```

### Step 8: Enhanced Search with Multiple Locations

**`src/search/search.service.ts`:**
```typescript
import { Injectable } from '@nestjs/common';
import { Parish, PortfolioItemType } from '@prisma/client';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: DatabaseService) {}

  async searchProviders(filters: {
    query?: string;
    parish?: Parish;
    city?: string;
    category?: string;
    latitude?: number;
    longitude?: number;
    radius?: number; // in kilometers
    minRating?: number;
    maxPrice?: number;
    availability?: Date;
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      parish,
      city,
      category,
      latitude,
      longitude,
      radius = 25,
      minRating,
      maxPrice,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Build search conditions
    const where: any = {
      isActive: true,
      isVerified: true,
    };

    // Text search
    if (query) {
      where.OR = [
        { businessName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        {
          providerLocations: {
            some: {
              location: {
                OR: [
                  { city: { contains: query, mode: 'insensitive' } },
                  { name: { contains: query, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ];
    }

    // Location filters - search through provider locations
    if (parish || city) {
      where.providerLocations = {
        some: {
          isActive: true,
          location: {
            ...(parish && { parish }),
            ...(city && { city: { contains: city, mode: 'insensitive' } }),
          },
        },
      };
    }

    // Rating filter
    if (minRating) {
      where.averageRating = { gte: minRating };
    }

    // Service category filter
    if (category) {
      where.services = {
        some: {
          category: { contains: category, mode: 'insensitive' },
          isActive: true,
        },
      };
    }

    // Price filter
    if (maxPrice) {
      where.services = {
        some: {
          ...where.services?.some,
          basePrice: { lte: maxPrice },
        },
      };
    }

    let providers;

    // Location-based search using multiple provider locations
    if (latitude && longitude) {
      providers = await this.searchByLocation(
        latitude,
        longitude,
        radius,
        where,
        skip,
        limit,
      );
    } else {
      // Regular search
      providers = await this.prisma.provider.findMany({
        where,
        include: {
          providerUsers: {
            where: { isActive: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
            take: 3, // Show first 3 team members
          },
          providerLocations: {
            where: { isActive: true },
            include: {
              location: true,
            },
            orderBy: { isPrimary: 'desc' },
            take: 1, // Primary location for listing
          },
          services: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              category: true,
              basePrice: true,
              currency: true,
              duration: true,
            },
            take: 5,
          },
          portfolioItems: {
            where: { isFeatured: true },
            take: 3,
            select: {
              type: true,
              imageUrl: true,
              videoId: true,
              title: true,
            },
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [
          { averageRating: 'desc' },
          { reviewCount: 'desc' },
          { createdAt: 'desc' },
        ],
      });
    }

    // Add distance for location-based results
    if (latitude && longitude) {
      providers = providers.map(provider => {
        const primaryLocation = provider.providerLocations[0]?.location;
        return {
          ...provider,
          distance: primaryLocation ? this.calculateDistance(
            latitude,
            longitude,
            Number(primaryLocation.latitude),
            Number(primaryLocation.longitude),
          ) : null,
        };
      });
    }

    return {
      providers,
      pagination: {
        page,
        limit,
        total: providers.length,
      },
    };
  }

  private async searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    additionalWhere: any,
    skip: number,
    limit: number,
  ) {
    const radiusMeters = radiusKm * 1000;

    // Search providers with locations within radius
    const providers = await this.prisma.$queryRaw`
      SELECT DISTINCT
        p.*,
        MIN(ST_Distance(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography
        ) / 1000) as distance_km
      FROM "providers" p
      JOIN "provider_locations" pl ON p.id = pl."providerId"
      JOIN "locations" l ON pl."locationId" = l.id
      WHERE p."isActive" = true 
        AND p."isVerified" = true
        AND pl."isActive" = true
        AND ST_DWithin(
          ST_MakePoint(CAST(l.longitude AS float), CAST(l.latitude AS float))::geography,
          ST_MakePoint(${longitude}, ${latitude})::geography,
          ${radiusMeters}
        )
      GROUP BY p.id
      ORDER BY distance_km ASC, p."averageRating" DESC
      LIMIT ${limit} OFFSET ${skip}
    `;

    // Get full provider data for the results
    const providerIds = providers.map(p => p.id);
    
    return this.prisma.provider.findMany({
      where: { id: { in: providerIds } },
      include: {
        providerUsers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
          take: 3,
        },
        providerLocations: {
          where: { isActive: true },
          include: {
            location: true,
          },
          orderBy: { isPrimary: 'desc' },
        },
        services: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            category: true,
            basePrice: true,
            currency: true,
            duration: true,
          },
          take: 5,
        },
        portfolioItems: {
          where: { isFeatured: true },
          take: 3,
          select: {
            type: true,
            imageUrl: true,
            videoId: true,
            title: true,
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);
    
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance * 100) / 100;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}
```

### Step 9: Enhanced Booking Service with User Assignment

**`src/bookings/bookings.service.ts`:**
```typescript
import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createBooking(data: {
    customerId: string;
    providerId: string;
    locationId: string;
    assignedUserId?: string;
    startTime: Date;
    endTime: Date;
    serviceIds: string[];
    customerNotes?: string;
  }) {
    // Validate location belongs to provider
    const providerLocation = await this.prisma.providerLocation.findFirst({
      where: {
        providerId: data.providerId,
        locationId: data.locationId,
        isActive: true,
      },
    });

    if (!providerLocation) {
      throw new BadRequestException('Invalid location for this provider');
    }

    // Validate assigned user belongs to provider (if specified)
    if (data.assignedUserId) {
      const providerUser = await this.prisma.providerUser.findFirst({
        where: {
          providerId: data.providerId,
          userId: data.assignedUserId,
          isActive: true,
        },
      });

      if (!providerUser) {
        throw new BadRequestException('Invalid assigned user for this provider');
      }
    }

    // Get services and calculate pricing
    const services = await this.prisma.service.findMany({
      where: {
        id: { in: data.serviceIds },
        providerId: data.providerId,
        isActive: true,
      },
    });

    if (services.length !== data.serviceIds.length) {
      throw new BadRequestException('Some services are invalid');
    }

    const subtotal = services.reduce((sum, service) => sum + Number(service.basePrice), 0);
    const taxAmount = subtotal * 0.125; // 12.5% GCT in Jamaica
    const totalAmount = subtotal + taxAmount;

    // Create booking in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const newBooking = await tx.booking.create({
        data: {
          customerId: data.customerId,
          providerId: data.providerId,
          assignedUserId: data.assignedUserId,
          locationId: data.locationId,
          startTime: data.startTime,
          endTime: data.endTime,
          subtotal,
          taxAmount,
          totalAmount,
          customerNotes: data.customerNotes,
          status: BookingStatus.PENDING,
        },
      });

      // Create booking items
      const bookingItems = await Promise.all(
        services.map(service =>
          tx.bookingItem.create({
            data: {
              bookingId: newBooking.id,
              serviceId: service.id,
              unitPrice: service.basePrice,
              total: service.basePrice,
            },
          })
        )
      );

      return { ...newBooking, items: bookingItems };
    });

    // Send notifications
    await this.notificationsService.sendBookingConfirmation(booking.id);

    return booking;
  }

  async assignBookingToUser(
    bookingId: string,
    assignedUserId: string,
    requestingUserId: string,
  ) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { provider: true },
    });

    if (!booking) {
      throw new BadRequestException('Booking not found');
    }

    // Check if requesting user has permission
    const requestingProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: booking.providerId,
        userId: requestingUserId,
        isActive: true,
      },
    });

    if (!requestingProviderUser?.canManageBookings && !requestingProviderUser?.isOwner) {
      throw new ForbiddenException('Insufficient permissions to assign bookings');
    }

    // Validate assigned user belongs to provider
    const assignedProviderUser = await this.prisma.providerUser.findFirst({
      where: {
        providerId: booking.providerId,
        userId: assignedUserId,
        isActive: true,
      },
    });

    if (!assignedProviderUser) {
      throw new BadRequestException('User is not part of this provider');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { assignedUserId },
      include: {
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async getProviderBookings(
    providerId: string,
    userId?: string,
    filters?: {
      status?: BookingStatus;
      locationId?: string;
      assignedUserId?: string;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    // Check if user has access to provider bookings
    if (userId) {
      const providerUser = await this.prisma.providerUser.findFirst({
        where: {
          providerId,
          userId,
          isActive: true,
        },
      });

      if (!providerUser) {
        throw new ForbiddenException('Access denied');
      }

      // If user is not owner and can't manage bookings, only show their assigned bookings
      if (!providerUser.isOwner && !providerUser.canManageBookings) {
        filters = { ...filters, assignedUserId: userId };
      }
    }

    return this.prisma.booking.findMany({
      where: {
        providerId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.locationId && { locationId: filters.locationId }),
        ...(filters?.assignedUserId && { assignedUserId: filters.assignedUserId }),
        ...(filters?.startDate && { startTime: { gte: filters.startDate } }),
        ...(filters?.endDate && { endTime: { lte: filters.endDate } }),
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        assignedUser: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        location: true,
        items: {
          include: {
            service: {
              select: {
                name: true,
                duration: true,
              },
            },
          },
        },
        payment: {
          select: {
            status: true,
            amount: true,
            gateway: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }
}
```

---

## Enhanced Database Seeding

**`prisma/seed.ts`:**
```typescript
import { PrismaClient, Parish, UserRole, SubscriptionPlan, PortfolioItemType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: 'admin@marketplace.com' },
    update: {},
    create: {
      email: 'admin@marketplace.com',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      googleId: 'google_admin_123',
    },
  });

  // Create locations
  const kingstonLocation = await prisma.location.create({
    data: {
      name: 'Downtown Kingston',
      address: '123 King Street, Kingston',
      city: 'Kingston',
      parish: Parish.KINGSTON,
      country: 'Jamaica',
      latitude: 18.0179,
      longitude: -76.8099,
    },
  });

  const montegoBayLocation = await prisma.location.create({
    data: {
      name: 'Hip Strip Montego Bay',
      address: '456 Gloucester Avenue, Montego Bay',
      city: 'Montego Bay',
      parish: Parish.ST_JAMES,
      country: 'Jamaica',
      latitude: 18.4762,
      longitude: -77.8919,
    },
  });

  // Create provider users
  const ownerUser = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      firstName: 'John',
      lastName: 'Barber',
      role: UserRole.PROVIDER,
      isEmailVerified: true,
      googleId: 'google_owner_123',
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: {},
    create: {
      email: 'staff@example.com',
      firstName: 'Mary',
      lastName: 'Stylist',
      role: UserRole.PROVIDER,
      isEmailVerified: true,
      appleId: 'apple_staff_123',
    },
  });

  // Create provider
  const provider = await prisma.provider.create({
    data: {
      businessName: 'John\'s Premium Barbershop',
      description: 'Premium barbershop services across Jamaica',
      businessPhone: '+1876-555-0123',
      businessEmail: 'info@johnsbarbershop.com',
      whatsapp: '+1876-555-0123',
      isVerified: true,
      isActive: true,
      subscriptionPlan: SubscriptionPlan.PROFESSIONAL,
    },
  });

  // Add users to provider
  await prisma.providerUser.create({
    data: {
      providerId: provider.id,
      userId: ownerUser.id,
      title: 'Owner & Master Barber',
      isOwner: true,
      canManageBookings: true,
      canManageServices: true,
      canManageLocations: true,
      canViewAnalytics: true,
      bio: 'Master barber with 15 years of experience',
      expertise: ['Classic Cuts', 'Beard Styling', 'Hot Towel Shaves'],
    },
  });

  await prisma.providerUser.create({
    data: {
      providerId: provider.id,
      userId: staffUser.id,
      title: 'Senior Hair Stylist',
      isOwner: false,
      canManageBookings: true,
      bio: 'Specialist in modern cuts and styling',
      expertise: ['Modern Cuts', 'Hair Coloring', 'Women\'s Styling'],
    },
  });

  // Add locations to provider
  await prisma.providerLocation.create({
    data: {
      providerId: provider.id,
      locationId: kingstonLocation.id,
      isPrimary: true,
    },
  });

  await prisma.providerLocation.create({
    data: {
      providerId: provider.id,
      locationId: montegoBayLocation.id,
      isPrimary: false,
    },
  });

  // Create services
  await prisma.service.createMany({
    data: [
      {
        providerId: provider.id,
        name: 'Classic Haircut',
        description: 'Traditional barbershop haircut with wash and style',
        category: 'Hair',
        subCategory: 'Cuts',
        basePrice: 1500, // JMD $15.00
        duration: 45,
      },
      {
        providerId: provider.id,
        name: 'Beard Trim & Style',
        description: 'Professional beard trimming and styling',
        category: 'Hair',
        subCategory: 'Beard',
        basePrice: 800, // JMD $8.00
        duration: 30,
      },
      {
        providerId: provider.id,
        name: 'Hot Towel Shave',
        description: 'Luxury hot towel shave experience',
        category: 'Hair',
        subCategory: 'Shave',
        basePrice: 2000, // JMD $20.00
        duration: 60,
      },
    ],
  });

  // Create portfolio items
  await prisma.portfolioItem.createMany({
    data: [
      {
        providerId: provider.id,
        title: 'Classic Fade Transformation',
        description: 'Before and after of a classic fade cut',
        type: PortfolioItemType.PHOTO,
        imageUrl: 'https://example.com/portfolio/fade-before-after.jpg',
        category: 'Before/After',
        tags: ['fade', 'classic', 'transformation'],
        isFeatured: true,
      },
      {
        providerId: provider.id,
        title: 'Barbering Technique Tutorial',
        description: 'Step-by-step beard trimming technique',
        type: PortfolioItemType.VIDEO_YOUTUBE,
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoId: 'dQw4w9WgXcQ',
        category: 'Tutorials',
        tags: ['beard', 'tutorial', 'technique'],
        isFeatured: true,
      },
      {
        providerId: provider.id,
        title: 'Shop Tour and Services',
        description: 'Virtual tour of our premium facilities',
        type: PortfolioItemType.VIDEO_VIMEO,
        videoUrl: 'https://vimeo.com/123456789',
        videoId: '123456789',
        category: 'Shop Tour',
        tags: ['tour', 'facilities', 'services'],
      },
    ],
  });

  // Create availability
  const daysOfWeek = [1, 2, 3, 4, 5, 6]; // Monday to Saturday
  for (const day of daysOfWeek) {
    // General provider availability
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        isActive: true,
      },
    });

    // Owner availability
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        providerUserId: ownerUser.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    });

    // Staff availability (different hours)
    await prisma.availability.create({
      data: {
        providerId: provider.id,
        providerUserId: staffUser.id,
        dayOfWeek: day,
        startTime: '10:00',
        endTime: '18:00',
        isActive: true,
      },
    });
  }

  console.log('Database seeded successfully with multi-location, multi-user provider setup');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Summary of Key Changes

### 1. **OAuth-Only Authentication**
- Removed email/password authentication
- Added Google and Apple ID strategies
- Updated user model to remove passwordHash
- Enhanced JWT payload with provider information

### 2. **Locations Table & Multi-Location Support**
- Created separate `Location` table with grid-based coordinates
- Added `ProviderLocation` junction table
- Support for multiple locations per provider
- Enhanced geospatial queries with PostGIS

### 3. **Multi-User Provider Management**
- Added `ProviderUser` table for team management
- Role-based permissions within providers
- Owner/staff distinction with granular permissions
- Individual user statistics and expertise

### 4. **Enhanced Portfolio Items**
- Support for photos, YouTube, and Vimeo videos
- Automatic video ID extraction
- Video thumbnail generation
- Enhanced categorization with tags

### 5. **Booking User Assignment**
- Bookings can be assigned to specific provider users
- Permission-based booking management
- User-specific availability scheduling
- Enhanced booking filtering and management

This updated backend setup provides a much more flexible and scalable foundation for your Service Provider Marketplace, supporting complex provider organizations with multiple locations and team members while maintaining secure OAuth-only authentication.
