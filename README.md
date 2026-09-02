# AuraMind — AI-Authenticated Reflection & Journaling Platform

AuraMind is a mindful, secure, multi-turn AI reflection and personal journaling web application. It combines **Google Gemini 3.6 Flash** for introspective reasoning with **Firebase Authentication (Google Federated Sign-In)** and **Google Cloud Firestore** for strictly user-isolated persistence.

---

## 🏗️ Architecture & Technology Stack

| Component | Technology | Role & Security Mechanism |
| :--- | :--- | :--- |
| **Client Frontend** | React 19 + TypeScript + Vite + Tailwind CSS | Fluid UI with responsive design, Web Speech API dictation, and real-time Firestore synchronization. |
| **AI Processing** | `@google/genai` (Gemini 3.6 Flash) | Multi-turn philosophical inquiry, brainstorming, synthesis, and action planning with a 4-tier model fallback ladder. |
| **User Identity** | Firebase Authentication | Google Federated Sign-In popup with zero stored passwords and automatic token renewal. |
| **Backend Database** | Google Cloud Firestore | Cryptographically isolated subcollection storage under `/users/{userId}/interactions/{interactionId}`. |
| **Backend Proxy** | Node.js + Express + Vite Middleware | Secure server on port 3000 keeping `GEMINI_API_KEY` hidden from browser execution contexts. |
| **Deployment Target** | Google Cloud Run | Serverless containerized deployment with Secret Manager integration. |

---

## 🛡️ Agentic Threat Model & OWASP Alignments

| Threat Zone | Identified Vectors | OWASP Alignment | Architectural Mitigations |
| :--- | :--- | :--- | :--- |
| **Input Surfaces** | Prompt injection, malicious payload structures, oversized payloads | OWASP A03 / LLM02 | Strict schema validation, max character bounds, defensive payload ingestion, and null-safe destructuring. |
| **Planning & Reasoning** | Indirect prompt injection via saved reflections attempting system instruction bypass | OWASP LLM01 | Reflection text treated strictly as untrusted data demarcated in user prompt delimiters; system prompts guard boundaries. |
| **Tool & AI Execution** | Gemini API key extraction, quota exhaustion, transient model failures | OWASP A01 / LLM05 | Zero client-exposed AI keys; resilient fallback ladder (`gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash`). |
| **Memory & State** | Cross-tenant snooping, unauthorized entry reads or deletes | OWASP A01 / A04 | Firestore security rules enforce `request.auth.uid == userId` on all document operations. |
| **Inter-System / Auth** | Credential theft, session hijacking, exposed service account keys | OWASP A07 / LLM07 | Google Federated Identity; secrets resolved at runtime via Google Cloud Secret Manager / `.env`. |

---

## 🧪 Functional Walkthrough & Step-by-Step Test Scenarios

Every interaction available in the user interface has a corresponding verifiable test case:

### Test Suite 1: Authentication & Landing Flow
* **Test 1.1 — Landing Page Initialization**:
  1. Open the application root URL without an active session.
  2. Verify that the landing hero renders cleanly displaying the value proposition, security guarantees, and "Continue with Google Sign-In" button.
* **Test 1.2 — Google Sign-In Execution**:
  1. Click "Continue with Google Sign-In".
  2. Complete Google OAuth popup flow.
  3. Verify immediate redirection to the private dashboard, displaying the user's avatar, active reflection workspace, and history sidebar.
* **Test 1.3 — Sign-Out Verification**:
  1. Click the profile avatar in the navigation bar to open the dropdown menu.
  2. Click "Sign Out of AuraMind".
  3. Verify immediate clearing of session state and return to the landing hero.

### Test Suite 2: Multi-Turn Interactive Reflection & AI Modes
* **Test 2.1 — Introspective Reflection Dialogue**:
  1. Type a personal thought into the reflection box (e.g., *"I felt overwhelmed balancing projects today."*).
  2. Press `Cmd+Enter` (or click "Reflect").
  3. Verify that the user message appears instantly, followed by a thoughtful, markdown-formatted Socratic response from Gemini.
* **Test 2.2 — Reflection Mode Switching**:
  1. Switch between mode buttons: **Introspection (🧘)**, **Brainstorm (💡)**, **Synthesis (📝)**, **Action Plan (🎯)**.
  2. Send a follow-up query in *Brainstorm* mode. Verify the AI adopts a divergent, creative ideation tone.
* **Test 2.3 — Mood & Tag Customization**:
  1. Select a mood from the dropdown (e.g., *Inspired* or *Focused*).
  2. Click `+ Tag`, type `creativity`, and press `Enter`.
  3. Verify that the tag badge appears and is immediately persisted.
* **Test 2.4 — Voice Dictation (Speech-to-Text)**:
  1. Click the microphone icon in the bottom-left of the input box.
  2. Speak a sentence aloud.
  3. Verify transcribed text appears in the reflection textarea.

### Test Suite 3: AI Executive Synthesis & Action Checklist
* **Test 3.1 — Executive Synthesis Generation**:
  1. In a reflection session with 2+ messages, click "Synthesize Insights".
  2. Verify that Gemini generates an **Executive Summary**, **Key Insights list**, and **Actionable Steps**.
  3. Verify celebratory confetti triggers upon completion.
* **Test 3.2 — Interactive Action Item Checklist**:
  1. Click an action item checkbox inside the synthesis card.
  2. Verify that the item toggles strikethrough state (`[DONE]`) and persists to Firestore.

### Test Suite 4: History, Search, Pin & Data Isolation
* **Test 4.1 — Real-time Firestore Sync**:
  1. Observe the top-right save indicator transition from *"Saving..."* to *"Saved"*.
  2. Check the sidebar history list to verify the reflection appears with correct title, mood, and mode badge.
* **Test 4.2 — Search & Multi-Filter Querying**:
  1. Type a keyword in the sidebar search bar. Verify matching reflections filter in real time.
  2. Filter by mode dropdown (e.g. *Brainstorm*). Verify non-matching entries are hidden.
* **Test 4.3 — Pin to Top**:
  1. Click the pin icon on any reflection in the history list.
  2. Verify that the entry shifts to the top of the timeline with an amber highlight.
* **Test 4.4 — Cross-User Data Isolation**:
  1. Sign in with User A; create entries.
  2. Sign out and sign in with User B.
  3. Verify User B sees only an empty or their own private collection. User A's entries are completely inaccessible.

### Test Suite 5: Spark Prompts & Analytics Modals
* **Test 5.1 — AI Spark Prompts**:
  1. Click "Spark Prompts" in the navigation bar.
  2. Click "Generate New AI Sparks" to fetch dynamic questions from Gemini.
  3. Click "Reflect on this" on any prompt card; verify a new reflection opens with the prompt populated.
* **Test 5.2 — Reflection & Habit Analytics**:
  1. Click "Analytics" in the navbar.
  2. Verify the modal displays accurate metrics for total entries, streak days, total words reflected, mode breakdown, and top emotional states.

### Test Suite 6: Multi-Format Data Export
* **Test 6.1 — Markdown / Text / JSON Export**:
  1. Click "Export" in the workspace header or history list.
  2. Toggle between **Markdown (.md)**, **Plain Text (.txt)**, and **JSON (.json)**.
  3. Click "Copy to Clipboard" and verify the toast confirmation.
  4. Click "Download File" and verify the generated file downloads with the correct format and extension.

---

## 🔒 Firestore Security Rules (`firestore.rules`)

Owner-bound security rules configured in `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-isolated interactions and journal entries
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // User profile isolation
    match /users/{userId}/profiles/{profileId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Prevent fallback access to unauthorized paths
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## 🔑 Secret Manager Setup & Permissions

To store and access the Gemini API key securely in Google Cloud:

```bash
# 1. Create and populate the secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the Cloud Run runtime service account permission to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 🚀 Google Cloud Run Deployment

Deploy AuraMind to Cloud Run with automatic secret injection and campaign registration:

```bash
# 1. Build and deploy container to Cloud Run
gcloud run deploy auramind \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest \
  --set-env-vars NODE_ENV=production

# 2. Apply mandatory campaign verification label
gcloud run services update auramind \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start development fullstack server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```
