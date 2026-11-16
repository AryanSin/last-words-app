  ### Part 1: How to Get All Integration Keys for Free                                                                                                               
                                                                                                                                                                     
   Service                 │ Recommended Free Provider       │ Free Tier Allowance                                   │ What You Get
  ─────────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────┼───────────────────────────────────────────────
   Email (SMTP)            │ Brevo[1] or Gmail App Passwords │ 300 emails/day free forever (Brevo) / 500/day (Gmail) │ SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
   WhatsApp OTP & Delivery │ Twilio WhatsApp Sandbox[2]      │ $15 free trial credit + unlimited sandbox testing     │ TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN,
                           │                                 │                                                       │ TWILIO_WHATSAPP_NUMBER
   Google Sign-In          │ Google Cloud Console[3]         │ Unlimited free                                        │ GOOGLE_CLIENT_ID
   Push Notifications      │ Expo Push Service[4]            │ Unlimited free                                        │ Automatic (Zero setup required)
   PostgreSQL Database     │ Neon[5] or Supabase[6]          │ 0.5 GB Postgres + connection pooling free forever     │ DATABASE_URL
   Redis & Queue           │ Upstash[7] or Railway[8]        │ 10,000 commands/day (Upstash) or $5 free credit       │ REDIS_HOST, REDIS_PORT (or REDIS_URL)         
                                                                                                                                                                     
  [1]: Brevo https://www.brevo.com/                                                                                                                                  
  [2]: Twilio WhatsApp Sandbox https://www.twilio.com/                                                                                                               
  [3]: Google Cloud Console https://console.cloud.google.com/                                                                                                        
  [4]: Expo Push Service https://docs.expo.dev/push-notifications/overview/                                                                                          
  [5]: Neon https://neon.tech/                                                                                                                                       
  [6]: Supabase https://supabase.com/                                                                                                                                
  [7]: Upstash https://upstash.com/                                                                                                                                  
  [8]: Railway https://railway.app/                                                                                                                                  
  ──────                                                                                                                                                             
  #### 1. Email Service (Nodemailer SMTP) — $0                                                                                                                       
                                                                                                                                                                     
  Choose either Brevo (recommended for production sender reputations) or Gmail App Password (fastest setup):                                                         
                                                                                                                                                                     
  ##### Option A: Brevo (Formerly Sendinblue) — Recommended                                                                                                          
                                                                                                                                                                     
  1. Sign up at brevo.com https://www.brevo.com/ (no credit card required).                                                                                          
  2. Go to Settings → SMTP & API → click Generate a new SMTP key.                                                                                                    
  3. Copy your credentials into .env:                                                                                                                                
    SMTP_HOST="smtp-relay.brevo.com"                                                                                                                                 
    SMTP_PORT=587                                                                                                                                                    
    SMTP_SECURE="false"                                                                                                                                              
    SMTP_USER="your-registered-email@example.com"                                                                                                                    
    SMTP_PASS="xsmtpsib-your-generated-key"                                                                                                                          
    SMTP_FROM="Last Words <your-verified-email@example.com>"                                                                                                         
                                                                                                                                                                     
                                                                                                                                                                     
  ##### Option B: Gmail App Password (5-minute setup)                                                                                                                
                                                                                                                                                                     
  1. Go to your Google Account Security https://myaccount.google.com/security.                                                                                       
  2. Ensure 2-Step Verification is turned ON.                                                                                                                        
  3. Search for App passwords → create a new app name (e.g. Last Words App).                                                                                         
  4. Copy the generated 16-character password into .env:                                                                                                             
    SMTP_HOST="smtp.gmail.com"                                                                                                                                       
    SMTP_PORT=465                                                                                                                                                    
    SMTP_SECURE="true"                                                                                                                                               
    SMTP_USER="yourusername@gmail.com"                                                                                                                               
    SMTP_PASS="your-16-char-app-password"                                                                                                                            
    SMTP_FROM="Last Words <yourusername@gmail.com>"                                                                                                                  
                                                                                                                                                                     
  ──────                                                                                                                                                             
  #### 2. WhatsApp Service (Twilio Sandbox) — $0                                                                                                                     
                                                                                                                                                                     
  1. Sign up at twilio.com/try-twilio https://www.twilio.com/try-twilio (gives you $15.00 free credit).                                                              
  2. In the Twilio Console dashboard:                                                                                                                                
      • Copy your Account SID and Auth Token.                                                                                                                        
  3. In the left sidebar, navigate to Messaging → Try it out → Send a WhatsApp message.                                                                              
  4. You will see a sandbox number (e.g. +14155238886) and a join code (e.g. join brave-fox).                                                                        
  5. Open WhatsApp on your phone and text that code to the sandbox number.                                                                                           
  6. Add the variables to .env:                                                                                                                                      
    WHATSAPP_PROVIDER="twilio"                                                                                                                                       
    TWILIO_ACCOUNT_SID="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"                                                                                                          
    TWILIO_AUTH_TOKEN="your_auth_token"                                                                                                                              
    TWILIO_WHATSAPP_NUMBER="whatsapp:+14155238886"                                                                                                                   
                                                                                                                                                                     
                                                                                                                                                                     
  (Alternative: If you have a Meta Developer account, https://developers.facebook.com provides 1,000 free conversations/month with WHATSAPP_PROVIDER="meta").        
  ──────                                                                                                                                                             
  #### 3. Google OAuth 2.0 (Google Sign-In) — $0                                                                                                                     
                                                                                                                                                                     
  1. Open Google Cloud Console https://console.cloud.google.com/.                                                                                                    
  2. Create a new project (e.g. last-words-app).                                                                                                                     
  3. Navigate to APIs & Services → OAuth consent screen:                                                                                                             
      • Select External → Fill App Name ("Last Words") and developer email → Save.                                                                                   
  4. Navigate to Credentials → Click Create Credentials → OAuth client ID:                                                                                           
      • Application type: Web application.                                                                                                                           
      • Authorized redirect URIs: Add http://localhost:3000 (and your production domain later).                                                                      
  5. Copy the generated Client ID into .env:                                                                                                                         
    GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnopqrst.apps.googleusercontent.com"                                                                                    
                                                                                                                                                                     
  ──────                                                                                                                                                             
  #### 4. Free Managed PostgreSQL Database — $0                                                                                                                      
                                                                                                                                                                     
  1. Sign up for free at Neon.tech https://neon.tech/ or Supabase.com https://supabase.com/.                                                                         
  2. Create a project named last-words.                                                                                                                              
  3. Copy the pooled PostgreSQL connection string into .env:                                                                                                         
    DATABASE_URL="postgresql://user:password@ep-cool-project-1234.us-east-2.aws.neon.tech/last_words?sslmode=require"                                                
                                                                                                                                                                     
  4. Push your schema:                                                                                                                                               
    cd apps/server                                                                                                                                                   
    pnpm exec prisma db push                                                                                                                                         
                                                                                                                                                                     
  ──────                                                                                                                                                             
  #### 5. Free Redis (BullMQ & Rate Limiting) — $0                                                                                                                   
                                                                                                                                                                     
  • Option A (Self-Hosted on free VPS / Docker): Run Redis 7 directly inside your Docker container (0 cost).                                                         
  • Option B (Upstash https://upstash.com/): Create a free Redis database. Under "Connect with ioredis", copy the host, port, and password.                          
  ──────                                                                                                                                                             
  ### Part 2: Free Hosting & Deployment Blueprint ($0)                                                                                                               
                                                                                                                                                                     
                                ┌──────────────────────────────────────────────┐                                                                                     
                                │      Oracle Cloud "Always Free" VM           │                                                                                     
                                │      (4 OCPU, 24 GB RAM, 200 GB SSD)         │                                                                                     
                                │                                              │                                                                                     
                                │  ┌──────────────┐       ┌─────────────────┐  │                                                                                     
                                │  │  PostgreSQL  │       │     Redis 7     │  │                                                                                     
                                │  │  (Port 5432) │       │   (Port 6379)   │  │                                                                                     
                                │  └──────┬───────┘       └────────┬────────┘  │                                                                                     
                                │         │                        │           │                                                                                     
                                │         └───────────┬────────────┘           │                                                                                     
                                │                     ▼                        │                                                                                     
                                │        ┌────────────────────────┐            │                                                                                     
                                │        │   Last Words API Pod   │            │                                                                                     
                                │        │   (Express, Cron,      │            │                                                                                     
                                │        │    BullMQ Worker)      │            │                                                                                     
                                │        └────────────┬───────────┘            │                                                                                     
                                └─────────────────────┼────────────────────────┘                                                                                     
                                                      │ HTTPS (Caddy / Cloudflare)                                                                                   
                                                      ▼                                                                                                              
                            ┌─────────────────────────────────────────────────────┐                                                                                  
                            │              Mobile App (Expo SDK 58)               │                                                                                  
                            │    • iOS & Android via Expo Go or EAS Free Build    │                                                                                  
                            └─────────────────────────────────────────────────────┘                                                                                  
                                                                                                                                                                     
  #### 1. Best Free Backend Hosting: Oracle Cloud "Always Free"                                                                                                      
                                                                                                                                                                     
  Oracle Cloud provides the most generous permanent free tier available in cloud computing:                                                                          
                                                                                                                                                                     
  • Resources: Up to 4 Ampere ARM cores, 24 GB RAM, and 200 GB storage free forever (no unexpected charges).                                                         
  • Deployment:                                                                                                                                                      
      1. Create an Always Free VM (Ubuntu 24.04 ARM).                                                                                                                
      2. Install Docker and Docker Compose:                                                                                                                          
        sudo apt update && sudo apt install -y docker.io docker-compose-v2 git                                                                                       
                                                                                                                                                                     
      3. Clone the repo and configure .env:                                                                                                                          
        git clone https://github.com/AryanSin/last-words-app.git                                                                                                     
        cd last-words-app                                                                                                                                            
        cp apps/server/.env.example apps/server/.env                                                                                                                 
        # fill in your free keys                                                                                                                                     
                                                                                                                                                                     
      4. Launch with one command:                                                                                                                                    
        docker compose up -d --build                                                                                                                                 
                                                                                                                                                                     
  All three services (Postgres, Redis, and Express API + BullMQ Worker) run persistently 24/7 with zero downtime or sleep states.
  
  #### Alternative: Render.com / Railway
  
  • Deploy the Dockerfile Dockerfile.server to Render (Free Web Service) connected to your free Neon Postgres and Redis.
  ──────
  #### 2. Mobile App Deployment: Expo EAS ($0)
  
  1. Install EAS CLI:
    npm install -g eas-cli
    eas login
  
  2. Build an Android standalone APK (free cloud build):
    cd apps/mobile
    eas build -p android --profile preview
  
  3. EAS generates an installable .apk link and QR code you can download directly to any Android device for free. For iOS, you can run and distribute immediately    
  using Expo Go without needing an Apple Developer Account.
