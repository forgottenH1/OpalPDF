import React, { useEffect } from 'react';
import { Heart } from 'lucide-react';

const BuyMeCoffee: React.FC = () => {
    useEffect(() => {
        // Check if PayPal SDK is loaded
        const checkPayPal = () => {
            if ((window as any).paypal && (window as any).paypal.HostedButtons) {
                try {
                    // Clear container first to prevent duplicates if strict mode or re-renders occur
                    const container = document.getElementById("paypal-container-258NAXUKV2VWG");
                    if (container) {
                        container.innerHTML = '';

                        (window as any).paypal.HostedButtons({
                            hostedButtonId: "258NAXUKV2VWG",
                            onApprove: function (data: any, actions: any) {
                                // Fallback: Redirect to thanks page client-side
                                window.location.href = "https://orbitpdf.pages.dev/thanks";
                            }
                        }).render("#paypal-container-258NAXUKV2VWG");
                    }
                } catch (error) {
                    console.error("PayPal Button Render Error:", error);
                }
            } else {
                // Retry if script hasn't loaded yet
                setTimeout(checkPayPal, 500);
            }
        };

        checkPayPal();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center mt-6 w-full animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <div className="flex items-center gap-2 mb-3">
                <p className="text-slate-400 text-sm">Found this tool helpful?</p>
                <Heart className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />
            </div>
            <div id="paypal-container-258NAXUKV2VWG" className="z-10 relative w-full max-w-[300px] min-h-[50px] text-slate-900 bg-white rounded-xl p-2"></div>
        </div>
    );
};

export default BuyMeCoffee;
