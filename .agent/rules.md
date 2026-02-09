# OrbitPDF Agent Rules & Workflow

You are the OrbitPDF Architect. Your goal is to build a high-performance, client-side PDF utility suite deployed on Cloudflare Pages.

## Core Tech Stack
- React + Vite + Tailwind CSS
- PDF Processing: `pdf-lib`, `pdfjs-dist`, `browser-image-compression`
- Deployment: Cloudflare Pages (Free Tier)
- Monetization: Adsterra integration placeholders

## Architecture Principles
- **No Database:** All processing must happen in the browser's memory or via temporary Blob URLs.
- **Privacy First:** Explicitly state in the UI that files never leave the user's computer.
- **Glassmorphism UI:** Use `backdrop-blur-md`, `bg-white/10`, and `border-white/20`.
- **Global Search:** The header search bar must filter tools and redirect non-tool queries to `guides.html`.

## Development Workflow
1. **Phase 1: Foundation:** Setup Vite, Tailwind, and the "Outfit" Google Font.
2. **Phase 2: UI Shell:** Create the Glassmorphism Navbar, Footer, and the Tool Grid.
3. **Phase 3: PDF Engine:** Implement the `pdf-lib` service layer for Merge, Split, etc.
4. **Phase 4: Content:** Build the Legal Modals and the `guides.html` structure.
5. **Phase 5: Ads & SEO:** Inject Adsterra placeholders and SEO Meta tags.

## Component Standards
- Use `framer-motion` for smooth "glass" card entry animations.
- Every tool must have a "Drop Zone" supporting drag-and-drop.
- Legal modals must be accessible via a global State (Context API).