import React from 'react';
import { Check } from 'lucide-react';

interface PricingTier {
    title: string;
    price: string;
    description: string;
    features: string[];
    isPopular?: boolean;
    buttonText: string;
    buttonAction: () => void;
    color: string;
}

interface PricingTableProps {
    // onSelectTier: (tier: string) => void; // No longer needed
}

import { useTranslation } from 'react-i18next';

// ... imports

const PricingTable: React.FC<PricingTableProps> = () => {
    const { t } = useTranslation();

    const handleSelectTier = (tier: string) => {
        window.location.href = `/advertise-inquiry.html?tier=${encodeURIComponent(tier)}`;
    };

    const tiers: PricingTier[] = [
        {
            title: t('pricing.bronze.title'),
            price: '$9',
            description: t('pricing.bronze.desc'),
            features: [
                t('pricing.bronze.features.0'),
                t('pricing.bronze.features.1'),
                t('pricing.bronze.features.2'),
                t('pricing.bronze.features.3')
            ],
            buttonText: t('pricing.getButton', { tier: t('pricing.bronze.title') }),
            buttonAction: () => handleSelectTier('Bronze'),
            color: 'text-orange-400'
        },
        {
            title: t('pricing.silver.title'),
            price: '$29',
            description: t('pricing.silver.desc'),
            features: [
                t('pricing.silver.features.0'),
                t('pricing.silver.features.1'),
                t('pricing.silver.features.2'),
                t('pricing.silver.features.3')
            ],
            buttonText: t('pricing.getButton', { tier: t('pricing.silver.title') }),
            buttonAction: () => handleSelectTier('Silver'),
            color: 'text-slate-300'
        },
        {
            title: t('pricing.gold.title'),
            price: '$49',
            description: t('pricing.gold.desc'),
            features: [
                t('pricing.gold.features.0'),
                t('pricing.gold.features.1'),
                t('pricing.gold.features.2'),
                t('pricing.gold.features.3')
            ],
            isPopular: true,
            buttonText: t('pricing.getButton', { tier: t('pricing.gold.title') }),
            buttonAction: () => handleSelectTier('Gold'),
            color: 'text-yellow-400'
        },
        {
            title: t('pricing.platinum.title'),
            price: '$99',
            description: t('pricing.platinum.desc'),
            features: [
                t('pricing.platinum.features.0'),
                t('pricing.platinum.features.1'),
                t('pricing.platinum.features.2'),
                t('pricing.platinum.features.3')
            ],
            buttonText: t('pricing.getButton', { tier: t('pricing.platinum.title') }),
            buttonAction: () => handleSelectTier('Platinum'),
            color: 'text-cyan-300'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4">
            {tiers.map((tier, index) => (
                <div
                    key={index}
                    className={`relative p-4 rounded-2xl border ${tier.isPopular ? 'border-blue-500 bg-blue-900/10' : 'border-slate-800 bg-slate-900/50'} flex flex-col`}
                >
                    {tier.isPopular && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            {t('pricing.mostPopular')}
                        </div>
                    )}
                    <h3 className={`text-2xl font-bold mb-0.5 ${tier.color}`}>{tier.title}</h3>
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className="text-2xl font-bold text-white">{tier.price}</span>
                        <span className="text-slate-500 text-sm">{t('pricing.perCampaign')}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2">{tier.description}</p>
                    <ul className="space-y-1 mb-3 flex-1">
                        {tier.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 text-sm text-slate-300">
                                <Check className="w-5 h-5 text-blue-500 shrink-0" />
                                {feature}
                            </li>
                        ))}
                    </ul>

                    <button
                        onClick={tier.buttonAction}
                        className={`w-full py-2.5 rounded-xl font-bold transition-all duration-200 ${tier.isPopular ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                    >
                        {tier.buttonText}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default PricingTable;
