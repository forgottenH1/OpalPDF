
import { useState } from 'react';
import { Advertiser, AdTier, Campaign } from '../../types/admin'; // Import Campaign
import { adminService } from '../../services/adminService';
import { Plus, Edit2, Trash2, Check, X, Mail } from 'lucide-react'; // Restored imports

interface Props {
    advertisers: Advertiser[];
    setAdvertisers: (ads: Advertiser[]) => void;
    campaigns?: Campaign[]; // Optional to avoid breaking other usages if any
    setCampaigns?: (c: Campaign[]) => void;
}

export default function AdvertiserList({ advertisers, setAdvertisers, campaigns, setCampaigns }: Props) {
    const [editing, setEditing] = useState<string | null>(null);
    const [tempData, setTempData] = useState<Partial<Advertiser>>({});
    const [isAdding, setIsAdding] = useState(false);

    const handleEdit = (advertiser: Advertiser) => {
        setEditing(advertiser.id);
        setTempData({ ...advertiser });
    };

    const handleCancel = () => {
        setEditing(null);
        setIsAdding(false);
        setTempData({});
    };

    const handleSave = async () => {
        let updatedList = [...advertisers];

        if (isAdding) {
            const newAd: Advertiser = {
                id: Date.now().toString(),
                companyName: tempData.companyName || 'New Company',
                contactName: tempData.contactName || '',
                email: tempData.email || '',
                tier: (tempData.tier as AdTier) || 'bronze',
                notes: tempData.notes || '',
                website: tempData.website || ''
            };
            updatedList.push(newAd);
        } else if (editing) {
            updatedList = updatedList.map(a => a.id === editing ? { ...a, ...tempData } as Advertiser : a);
        }

        // Save to backend
        const result = await adminService.saveAdvertisers(updatedList);
        if (result.success) {
            setAdvertisers(updatedList);
            handleCancel();
        } else {
            alert(`Failed to save changes: ${result.error}`);
        }
    };

    const handleDelete = async (id: string) => {
        // Check for dependent campaigns
        const dependentCampaigns = campaigns ? campaigns.filter(c => c.advertiserId === id) : [];

        let confirmMessage = 'Are you sure you want to delete this advertiser?';
        if (dependentCampaigns.length > 0) {
            confirmMessage = `Warning: This advertiser has ${dependentCampaigns.length} active/scheduled campaign(s). Deleting them will also DELETE these campaigns. Continue?`;
        }

        if (!confirm(confirmMessage)) return;

        // 1. Delete Advertiser
        const updatedAdvertisers = advertisers.filter(a => a.id !== id);

        // 2. Cascade Delete Campaigns if any
        if (dependentCampaigns.length > 0 && setCampaigns && campaigns) {
            const updatedCampaigns = campaigns.filter(c => c.advertiserId !== id);
            await adminService.saveCampaigns(updatedCampaigns);
            setCampaigns(updatedCampaigns);
        }

        const result = await adminService.saveAdvertisers(updatedAdvertisers);
        if (result.success) setAdvertisers(updatedAdvertisers);
        else alert(`Failed to delete: ${result.error}`);
    };

    const sendEmail = (email: string) => {
        window.location.href = `mailto:${email}?subject=OpalPDF Ad Inquiry`;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Advertiser Profiles</h2>
                <button
                    onClick={() => { setIsAdding(true); setTempData({ tier: 'bronze' }); }}
                    disabled={isAdding || editing !== null}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 disabled:opacity-50"
                >
                    <Plus className="w-4 h-4" />
                    <span>Add New</span>
                </button>
            </div>

            <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 border-b border-slate-700">
                        <tr>
                            <th className="p-4">Company</th>
                            <th className="p-4">Contact</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">Tier</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700">
                        {/* Adding Row */}
                        {isAdding && (
                            <tr className="bg-blue-900/10">
                                <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" placeholder="Company Name" value={tempData.companyName || ''} onChange={e => setTempData({ ...tempData, companyName: e.target.value })} autoFocus /></td>
                                <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" placeholder="Contact Name" value={tempData.contactName || ''} onChange={e => setTempData({ ...tempData, contactName: e.target.value })} /></td>
                                <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" placeholder="Email" value={tempData.email || ''} onChange={e => setTempData({ ...tempData, email: e.target.value })} /></td>
                                <td className="p-4">
                                    <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1" value={tempData.tier || 'bronze'} onChange={e => setTempData({ ...tempData, tier: e.target.value as AdTier })}>
                                        <option value="bronze">Bronze</option>
                                        <option value="silver-left">Silver (Left)</option>
                                        <option value="silver-right">Silver (Right)</option>
                                        <option value="gold">Gold</option>
                                        <option value="platinum">Platinum</option>
                                    </select>
                                </td>
                                <td className="p-4 text-right space-x-2">
                                    <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><Check className="w-5 h-5" /></button>
                                    <button onClick={handleCancel} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
                                </td>
                            </tr>
                        )}

                        {advertisers.map(ad => (
                            <tr key={ad.id} className="hover:bg-slate-700/50">
                                {editing === ad.id ? (
                                    <>
                                        <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" value={tempData.companyName} onChange={e => setTempData({ ...tempData, companyName: e.target.value })} /></td>
                                        <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" value={tempData.contactName} onChange={e => setTempData({ ...tempData, contactName: e.target.value })} /></td>
                                        <td className="p-4"><input className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1" value={tempData.email} onChange={e => setTempData({ ...tempData, email: e.target.value })} /></td>
                                        <td className="p-4">
                                            <select className="bg-slate-900 border border-slate-600 rounded px-2 py-1" value={tempData.tier} onChange={e => setTempData({ ...tempData, tier: e.target.value as AdTier })}>
                                                <option value="bronze">Bronze</option>
                                                <option value="silver-left">Silver (Left)</option>
                                                <option value="silver-right">Silver (Right)</option>
                                                <option value="gold">Gold</option>
                                                <option value="platinum">Platinum</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            <button onClick={handleSave} className="text-emerald-400 hover:text-emerald-300"><Check className="w-5 h-5" /></button>
                                            <button onClick={handleCancel} className="text-red-400 hover:text-red-300"><X className="w-5 h-5" /></button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td className="p-4 font-medium text-white">{ad.companyName}</td>
                                        <td className="p-4">{ad.contactName}</td>
                                        <td className="p-4 text-sm font-mono text-slate-400">{ad.email}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase 
                                                ${ad.tier === 'platinum' ? 'bg-purple-900 text-purple-200' :
                                                    ad.tier === 'gold' ? 'bg-yellow-900 text-yellow-200' :
                                                        (ad.tier === 'silver-left' || ad.tier === 'silver-right') ? 'bg-slate-600 text-slate-200' :
                                                            'bg-orange-900 text-orange-200'}`}>
                                                {ad.tier}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2 flex justify-end">
                                            <button onClick={() => sendEmail(ad.email)} className="text-blue-400 hover:text-blue-300" title="Email Client">
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleEdit(ad)} className="text-slate-400 hover:text-white" title="Edit">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDelete(ad.id)} className="text-red-400 hover:text-red-300" title="Delete">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}

                        {advertisers.length === 0 && !isAdding && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No advertisers found. Click "Add New" to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
