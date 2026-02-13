# Ad Management Dashboard - User Guide

You now have a fully functional **Local Admin Dashboard** to manage your ads without touching code.

## 🚀 How to Start
To open the dashboard, you must run the new "Admin Mode" command.

1. Stop your current dev server (Ctrl+C).
2. Run:
   ```bash
   npm run dev:admin
   ```
   *This starts both your website (port 5173) AND the admin server (port 3001).*
3. Open your browser to: **[http://localhost:5173/admin](http://localhost:5173/admin)**

## 🌟 Features

### 1. Dashboard Overview
- **Quick Stats**: See active ads, total advertisers, and revenue estimates.
- **Critical Alerts**: If an ad is expiring in less than 24 hours, it will appear here in RED.

### 2. Advertiser Profiles
- **Manage Clients**: Add companies, contacts, and emails.
- **Tiers**: Assign tiers (Bronze, Silver, Gold, Platinum) to keep track of VIPs.
- **Quick Email**: Click the "Mail" icon to open your email client with a pre-filled subject.

### 3. Campaign Manager
- **Schedule Ads**: Set Start and End dates. The system automatically shows/hides them based on these dates (if Status is Active).
- **Placements**: Choose Header, Footer, Sidebar Left, or Sidebar Right.
- **Assets**: Enter the image URL (e.g., `/ads/header/my-ad.jpg`) and the target link.

### 4. ☁️ One-Click Deploy
When you are happy with your changes:
1. Go to the **Overview** or Sidebar.
2. Click **"Deploy to Site"**.
3. The system will automatically:
   - Save your changes to `src/data/campaigns.json`.
   - Commit them to Git.
   - Push to GitHub.
   - Trigger a new build on your hosting provider (Cloudflare/Netlify).

## ⚠️ Important Notes
- **Local Only**: This dashboard runs on *your* computer. You cannot access `/admin` from the public internet (and neither can hackers).
- **Image Files**: For now, you must potential manually place image files in your `public/ads/` folder, or use external URLs (like Imgur/AWS). The dashboard currently manages *data*, not file uploads.
