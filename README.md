# SafeSpace - Ruang Aman untuk Bercerita

A browser-based MVP mental health support space built with native web technologies and Vercel Serverless Functions.

## Tech Stack

- **Frontend**: Vanilla HTML + CSS + JavaScript (ES Modules)
- **Backend**: Vercel Serverless Functions (Node.js)
- **Database**: Google Sheets (via Google Sheets API)
- **Authentication**: Invite-code based with httpOnly JWT cookies

## ⚠️ Important Limitations

- **Chat uses polling (every 3 seconds)**, not WebSockets. This means:
  - Messages may take up to 3 seconds to appear
  - Higher API usage compared to real-time solutions
  - Suitable for MVP/low-traffic scenarios
- **Not a replacement for professional mental health services**
- **Non-clinical support only**

---

## Setup Guide

### 1. Create Google Cloud Project & Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g., "SafeSpace")
3. Enable the **Google Sheets API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"
4. Create a Service Account:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "Service Account"
   - Name it (e.g., "safespace-backend")
   - Click "Create and Continue"
   - Skip the optional steps, click "Done"
5. Create Service Account Key:
   - Click on the service account you just created
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose "JSON" format
   - Download the JSON file (keep it secure!)

### 2. Create Google Sheet

1. Create a new Google Sheet
2. Rename it to "SafeSpace Database" (or any name)
3. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
   ```
4. Create the following tabs (sheets) with headers in row 1:

#### Tab: `users`
| userId | displayName | consentAt | createdAt | lastSeenAt |
|--------|-------------|-----------|-----------|------------|

#### Tab: `chat_sessions`
| sessionId | userId | topic | status | createdAt |
|-----------|--------|-------|--------|-----------|

#### Tab: `messages`
| messageId | sessionId | userId | text | riskFlag | createdAt |
|-----------|-----------|--------|------|----------|-----------|

#### Tab: `journal`
| entryId | userId | title | body | tags | createdAt |
|---------|--------|-------|------|------|-----------|

#### Tab: `mood`
| moodId | userId | date | score | emotion | note | createdAt |
|--------|--------|------|-------|---------|------|-----------|

#### Tab: `reports`
| reportId | reporterUserId | targetSessionId | reason | createdAt |
|----------|----------------|-----------------|--------|-----------|

### 3. Share Google Sheet with Service Account

1. Open your Google Sheet
2. Click "Share" button
3. Add the service account email (found in the JSON file as `client_email`)
   - It looks like: `safespace-backend@your-project.iam.gserviceaccount.com`
4. Give it **Editor** access
5. Click "Send" (uncheck "Notify people" if prompted)

### 4. Set Up Environment Variables

Create a `.env` file locally (for development) with the following variables:

```env
# Google Sheets Configuration
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}
GOOGLE_SHEETS_ID=your-spreadsheet-id-here

# Application Security
APP_SECRET=your-super-secret-jwt-signing-key-min-32-chars

# Invite Codes (comma-separated)
INVITE_CODES=SAFESPACE2024,WELCOME123,RUANGAMAN
```

**Important Notes:**
- `GOOGLE_SERVICE_ACCOUNT_JSON`: Paste the entire JSON content from the downloaded service account key file (as a single line)
- `APP_SECRET`: Use a strong random string (minimum 32 characters)
- `INVITE_CODES`: Comma-separated list of valid invite codes

### 5. Deploy to Vercel

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from project root:
   ```bash
   vercel
   ```

4. Set environment variables in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from `.env`
   - **For `GOOGLE_SERVICE_ACCOUNT_JSON`**: Paste the JSON as a single line

5. Redeploy after setting environment variables:
   ```bash
   vercel --prod
   ```

---

## Project Structure

```
/
├── api/
│   ├── _lib/
│   │   ├── sheets.js      # Google Sheets helper functions
│   │   ├── auth.js        # JWT authentication helpers
│   │   └── rateLimit.js   # Basic rate limiting
│   ├── auth/
│   │   ├── login.js       # POST /api/auth/login
│   │   └── logout.js      # POST /api/auth/logout
│   ├── me.js              # GET /api/me
│   ├── chat/
│   │   ├── sessions.js    # Chat session management
│   │   └── messages.js    # Chat messages with polling
│   ├── journal.js         # Journal CRUD operations
│   ├── mood.js            # Mood check-in
│   └── reports.js         # Report functionality
├── public/
│   ├── landing.html       # Login page
│   ├── onboarding.html    # Consent & rules page
│   ├── app.html           # Main application
│   ├── styles.css         # Global styles
│   └── app.js             # Frontend JavaScript
├── .env.example           # Example environment variables
└── README.md              # This file
```

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with invite code and display name
- `POST /api/auth/logout` - Logout and clear session
- `GET /api/me` - Get current user info

### Chat
- `GET /api/chat/sessions` - List user's chat sessions
- `POST /api/chat/sessions` - Create new chat session
- `GET /api/chat/messages?sessionId=...&after=...` - Get messages (polling)
- `POST /api/chat/messages` - Send a message

### Journal
- `GET /api/journal` - List user's journal entries
- `POST /api/journal` - Create new entry
- `PUT /api/journal` - Update entry
- `DELETE /api/journal` - Delete entry

### Mood
- `GET /api/mood` - Get user's mood history
- `POST /api/mood` - Record mood (once per day)

### Reports
- `POST /api/reports` - Report a chat session

---

## Security Features

- **httpOnly Cookies**: JWT tokens stored in httpOnly cookies (not accessible via JavaScript)
- **Server-side Only Google Sheets Access**: Browser never directly accesses Google Sheets API
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: Basic in-memory rate limiting to prevent abuse
- **Risk Detection**: Server-side keyword detection for concerning content
- **HTML Escaping**: All user content is escaped before display

---

## Risk Detection

The system includes basic keyword detection for potentially concerning content. When detected:
- The message is **still saved** (not blocked)
- A `riskFlag` is set to `true`
- A gentle warning is shown to the user with support resources

**Keywords monitored** (configurable in backend):
- Mentions of self-harm
- Mentions of suicide
- Extreme distress indicators

---

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file with your credentials

3. Run Vercel dev server:
   ```bash
   vercel dev
   ```

4. Open `http://localhost:3000/landing.html`

---

## Dependencies

The project uses minimal dependencies:

```json
{
  "dependencies": {
    "googleapis": "^128.0.0",
    "jsonwebtoken": "^9.0.0",
    "uuid": "^9.0.0"
  }
}
```

---

## Disclaimer

**SafeSpace is NOT a substitute for professional mental health care.**

This platform is designed to provide a safe space for sharing and peer support. If you are experiencing a mental health crisis, please contact:

- **Indonesia**: Into The Light - 119 ext 8
- **International**: Your local emergency services or crisis hotline

---

## License

MIT License - Feel free to modify and use for your community.
