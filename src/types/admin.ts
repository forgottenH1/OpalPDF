export type AdTier = 'bronze' | 'silver-left' | 'silver-right' | 'gold' | 'platinum' | 'unassigned';
export type AdPlacement = 'header' | 'footer' | 'sidebar-left' | 'sidebar-right' | 'header-footer-combo';
export type AdStatus = 'active' | 'scheduled' | 'expired' | 'draft';

export interface Advertiser {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    tier: AdTier;
    notes?: string;
    website?: string;
    customWeight?: number; // Override for ad frequency (Bronze=5, Platinum=10)
}

export interface Campaign {
    id: string;
    advertiserId: string;
    placement: AdPlacement;
    status: AdStatus;
    startDate: string; // YYYY-MM-DD
    endDate: string;   // YYYY-MM-DD
    imageUrl: string;
    mobileImageUrl?: string;
    footerImageUrl?: string;
    footerMobileImageUrl?: string;
    link: string;
    clicks?: number;   // For manual tracking or future analytics
    tier?: AdTier;      // Specific tier for this campaign
    customWeight?: number; // Specific weight for this campaign
    script?: string;    // Custom HTML/JS script
    mobileScript?: string; // Script for mobile devices
    footerScript?: string; // Script for footer (Desktop - Combo only)
    footerMobileScript?: string; // Script for footer (Mobile - Combo only)
}

export interface DashboardStats {
    totalAdvertisers: number;
    activeCampaigns: number;
    expiringSoon: number; // Campaigns expiring in < 3 days
    revenueEstimate: number; // Placeholder
}
