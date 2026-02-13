# Ad Management Dashboard Implementation Plan (Expanded)

## Goal
Build a comprehensive **Ad Management Center** running locally on your computer.
This dashboard will be your central command for all advertising operations, allowing you to manage:
- Advertisers and their profiles.
- Campaigns (start/end dates, placements).
- Automated notifications for expirations.

---

## 1. Core Architecture: "Local Admin" Pattern
Since your site is static, we will simulate a full backend using a **Local Node.js Script**:
- **Backend Script (`scripts/admin-server.js`)**: Runs on your machine (`localhost:3001`), reads/writes JSON files, and handles Git operations.
- **Frontend Dashboard (`/admin`)**: A hidden React route in your app that connects to this local script.

---

## 2. Enhanced Data Structure
We will expand the data model to support robust management.

### `src/data/advertisers.json`
Stores client profiles.
- `id`: unique ID
- `companyName`: "Acme Corp"
- `contactName`: "John Doe"
- `email`: "john@acme.com"
- `tier`: "Platinum" | "Gold" | "Silver" | "Bronze"
- `notes`: Private notes about the client.

### `src/data/campaigns.json`
Replaces the flat `ads.json`. Links ads to advertisers.
- `id`: unique ID
- `advertiserId`: Link to advertiser
- `placement`: "header" | "footer" | "sidebar-left" | "sidebar-right"
- `status`: "active" | "scheduled" | "expired" | "draft"
- `startDate`: "2026-02-01"
- `endDate`: "2026-02-14" (Used for notifications)
- `imageUrl`: Path to image
- `clicks`: (Optional) Manual entry or GA integration placeholder

---

## 3. Dashboard Features

### A. The "AdSense-Style" Overview
A visual summary screen showing:
- **Active Campaigns**: Number of live ads by placement.
- **Revenue Estimate**: Based on tier pricing (optional calculator).
- **Critical Alerts**: High-priority notifications.

### B. Advertiser Profiles Management
A dedicated section to manage your clients.
- **List View**: Searchable list of all advertisers.
- **Profile Detail**:
    - Edit contact info.
    - View current active ads.
    - View past campaign history.
    - **"Email Client" Button**: Generates a `mailto:` link with pre-filled subject/body for renewals.
- **Tier Logic**: Validates that a "Bronze" client isn't accidentally given a "Platinum" header spot without warning.

### C. Notification System (24-Hour Alert)
Since this runs locally, "Notifications" will appear as **Prominent Alerts** on the dashboard.
- **Expiration Warning**:
    - **Yellow Alert**: < 3 Days remaining.
    - **Red Alert**: < 24 Hours remaining (your requested feature).
    - **Expired**: Greyed out.
- **Smart Action**: Next to the alert, a "Renew" or "Notify Client" button.

### D. Ad Placement Manager
Visual drag-and-drop or checklist interface.
- **Visual Preview**: See exactly where the ad will appear on the site.
- **Conflict Detection**: Warns if two ads are scheduled for the same slot at the same time.

### E. External Redirect Manager
A simple table to manage redirect links (e.g., if you use a link shortener or tracking URL).
- Auto-generates `redirects` file for Netlify/Cloudflare if needed.

---

## 4. Suggested "Smart" Features

### 🚀 One-Click Deployment
A prominent **"Push to Live"** button in the header.
- **Action**: Commits all changes to `advertisers.json` and `campaigns.json`, then runs `git push`.
- **Status**: Shows "Syncing..." spinner and success message.

### 📧 Renewal Email Generator
When an ad is about to expire (24h alert), click "Send Reminder".
- Opens your default email client.
- **Subject**: "Action Required: Your OrbitPDF Ad Expires Tomorrow!"
- **Body**: "Hi [Name], your [Placement] ad expires in 24 hours. Click here to renew..."

### 📊 Analytics Integration (Future)
Connect to Google Analytics API to show:
- "Impressions" (Page views)
- "Clicks" (Event counts)
Directly on the dashboard card for each ad.

---

## 5. Integration Steps

1.  **Setup Backend**: Create `scripts/admin-server.js` with endpoints for Advertisers and Campaigns.
2.  **Define Types**: Create TypeScript interfaces for `Advertiser` and `Campaign`.
3.  **Build Dashboard UI**:
    - Sidebar Navigation (Overview, Advertisers, Placements, Settings).
    - Components for alerts and data tables.
4.  **Implement Logic**:
    - Date checking for expiration alerts.
    - Tier validation logic.
5.  **Connect Git**: Implement the `exec('git push')` logic in the server script.

## User Actions Required
- **Run the Server**: You will need to run `npm run admin` (or similar) to start the local backend alongside your dev server.
- **Review**: Confirm if these features cover your requirements before we start coding.
