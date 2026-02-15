import React, { useEffect } from 'react';

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
                            hostedButtonId: "258NAXUKV2VWG"
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
        <div className="flex flex-col items-center justify-center mt-6 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            <p className="text-slate-400 text-sm mb-3">Found this tool helpful?</p>
            <div id="paypal-container-258NAXUKV2VWG" className="z-10 relative"></div>
        </div>
    );
};

export default BuyMeCoffee;
