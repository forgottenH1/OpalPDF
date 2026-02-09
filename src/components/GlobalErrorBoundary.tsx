import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Wrapper to use hook in class component
const ErrorBoundaryContent = ({ error, resetError }: { error: Error | null, resetError: () => void }) => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">{t('errorBoundary.title')}</h1>
                <p className="text-slate-400 mb-8">
                    {t('errorBoundary.desc')}
                </p>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        {t('errorBoundary.reload')}
                    </button>

                    <button
                        onClick={() => {
                            resetError();
                            window.location.href = '/';
                        }}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                        <Home className="w-4 h-4" />
                        {t('errorBoundary.home')}
                    </button>
                </div>

                {process.env.NODE_ENV === 'development' && error && (
                    <div className="mt-8 p-4 bg-slate-950 rounded-lg text-left overflow-auto max-h-48 border border-white/5">
                        <p className="text-xs font-mono text-red-400 mb-2">{t('errorBoundary.details')}</p>
                        <pre className="text-xs font-mono text-slate-400 break-words whitespace-pre-wrap">
                            {error.toString()}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}

class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return <ErrorBoundaryContent error={this.state.error} resetError={() => this.setState({ hasError: false })} />;
        }

        return this.props.children;
    }
}

export default GlobalErrorBoundary;
