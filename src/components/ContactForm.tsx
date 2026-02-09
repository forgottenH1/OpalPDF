import React, { useState, useRef } from 'react';
import emailjs from '@emailjs/browser';
import { Mail, Send, CheckCircle2, AlertCircle } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const ContactForm: React.FC = () => {
    const { t } = useTranslation();
    const form = useRef<HTMLFormElement>(null);
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const sendEmail = (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation
        if (!form.current) return;

        setStatus('sending');
        setErrorMessage('');

        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            setStatus('error');
            setErrorMessage(t('contact.errorConfig'));
            return;
        }

        emailjs.sendForm(serviceId, templateId, form.current, publicKey)
            .then(() => {
                setStatus('success');
                if (form.current) form.current.reset();
                // Clear success message after 5 seconds
                setTimeout(() => setStatus('idle'), 5000);
            }, (error) => {
                setStatus('error');
                setErrorMessage(error.text || t('contact.errorGeneric'));
            });
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl">
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-blue-600/20 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{t('contact.getInTouch')}</h2>
                    <p className="text-slate-400">{t('contact.subtitle')}</p>
                </div>

                <form ref={form} onSubmit={sendEmail} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="user_name" className="text-sm font-medium text-slate-300">{t('contact.name')}</label>
                            <input
                                type="text"
                                name="user_name"
                                id="user_name"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="user_email" className="text-sm font-medium text-slate-300">{t('contact.email')}</label>
                            <input
                                type="email"
                                name="user_email"
                                id="user_email"
                                required
                                className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="subject" className="text-sm font-medium text-slate-300">{t('contact.subject')}</label>
                        <select
                            name="subject"
                            id="subject"
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            <option value="Showcase">{t('contact.subjects.general')}</option>
                            <option value="Support">{t('contact.subjects.support')}</option>
                            <option value="Feedback">{t('contact.subjects.feature')}</option>
                            <option value="Business">{t('contact.subjects.business')}</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium text-slate-300">{t('contact.message')}</label>
                        <textarea
                            name="message"
                            id="message"
                            rows={5}
                            required
                            className="w-full bg-slate-950/50 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                            placeholder={t('contact.messagePlaceholder')}
                        ></textarea>
                    </div>

                    {status === 'sending' && (
                        <button disabled className="w-full bg-blue-600/50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 cursor-wait">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            {t('contact.sending')}
                        </button>
                    )}

                    {status === 'idle' && (
                        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20">
                            <Send size={20} />
                            {t('contact.send')}
                        </button>
                    )}

                    {status === 'success' && (
                        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex items-center gap-3 text-green-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CheckCircle2 size={24} />
                            <div>
                                <h4 className="font-bold">{t('contact.successTitle')}</h4>
                                <p className="text-sm text-green-400/80">{t('contact.successMessage')}</p>
                            </div>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AlertCircle size={24} />
                            <div>
                                <h4 className="font-bold">{t('contact.errorTitle')}</h4>
                                <p className="text-sm text-red-400/80">{errorMessage}</p>
                            </div>
                            <button onClick={() => setStatus('idle')} className="ml-auto text-xs underline hover:text-white">{t('contact.tryAgain')}</button>
                        </div>
                    )}
                </form>
            </div>

            {/* Config Check Warning (Only visible in dev or if config missing) */}
            {import.meta.env.DEV && !import.meta.env.VITE_EMAILJS_PUBLIC_KEY && (
                <div className="mt-8 text-center text-yellow-500 text-sm bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
                    <p><strong>Dev Note:</strong> EmailJS keys are missing from <code>.env</code>.</p>
                    <p>Emails will fail to send until configured.</p>
                </div>
            )}
        </div>
    );
};

export default ContactForm;
