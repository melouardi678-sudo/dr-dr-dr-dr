import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('MediCab ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  public handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Une erreur inattendue est survenue</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Le système a protégé vos données médicales. Vous pouvez recharger l'interface en toute sécurité.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-rose-300/80 text-left overflow-x-auto max-h-24">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/20"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Recharger l'application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
