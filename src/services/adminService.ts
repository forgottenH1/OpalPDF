
import { Advertiser, Campaign } from '../types/admin';

const ADMIN_API_URL = 'http://127.0.0.1:3001/api';

export const adminService = {
    // --- Advertisers ---
    getAdvertisers: async (): Promise<Advertiser[]> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/advertisers`);
            if (!response.ok) throw new Error('Failed to fetch advertisers');
            return await response.json();
        } catch (error) {
            console.error('Error fetching advertisers:', error);
            return [];
        }
    },

    saveAdvertisers: async (data: Advertiser[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/advertisers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: `Server Error: ${response.status} ${text}` };
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error saving advertisers:', error);
            return { success: false, error: error.message || 'Network Error' };
        }
    },

    // --- Campaigns ---
    getCampaigns: async (): Promise<Campaign[]> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/campaigns`);
            if (!response.ok) throw new Error('Failed to fetch campaigns');
            return await response.json();
        } catch (error) {
            console.error('Error fetching campaigns:', error);
            return [];
        }
    },

    saveCampaigns: async (data: Campaign[]): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/campaigns`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: `Server Error: ${response.status} ${text}` };
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error saving campaigns:', error);
            return { success: false, error: error.message || 'Network Error' };
        }
    },

    // --- Settings ---
    getSettings: async (): Promise<{ placements: Record<string, boolean> }> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/settings`);
            if (!response.ok) throw new Error('Failed to fetch settings');
            return await response.json();
        } catch (error) {
            console.error('Error fetching settings:', error);
            return { placements: {} };
        }
    },

    saveSettings: async (data: any): Promise<{ success: boolean; error?: string }> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/settings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            if (!response.ok) {
                const text = await response.text();
                return { success: false, error: `Server Error: ${response.status} ${text}` };
            }
            return { success: true };
        } catch (error: any) {
            console.error('Error saving settings:', error);
            return { success: false, error: error.message || 'Network Error' };
        }
    },

    // --- Images ---
    getImages: async (): Promise<{ placement: string, filename: string, path: string }[]> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/images`);
            if (!response.ok) throw new Error('Failed to fetch images');
            return await response.json();
        } catch (error) {
            console.error('Error fetching images:', error);
            return [];
        }
    },

    // --- Deployment ---
    deploy: async (): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch(`${ADMIN_API_URL}/deploy`, { method: 'POST' });
            const result = await response.json();
            return { success: response.ok, message: result.message || result.error };
        } catch (error) {
            console.error('Deployment error:', error);
            return { success: false, message: 'Deployment failed. Check server console.' };
        }
    }
};
