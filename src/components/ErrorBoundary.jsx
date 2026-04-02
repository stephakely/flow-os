import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-full bg-cyber-dark text-cyber-pulse p-10 flex flex-col items-center justify-center font-mono animate-fade-in relative z-50">
          <div className="w-16 h-16 rounded-full bg-cyber-pulse/20 flex items-center justify-center mb-6">
            <span className="text-4xl text-cyber-pulse font-bold">!</span>
          </div>
          <h1 className="text-3xl font-bold tracking-widest mb-4">CRITICAL SYSTEM FAILURE</h1>
          <p className="mb-8 opacity-80">L'interface a crashé. Voici les logs pour réparation :</p>
          <div className="bg-black/50 p-6 rounded border border-cyber-pulse/30 w-full max-w-4xl overflow-auto custom-scrollbar text-left text-xs text-cyber-pulse/90">
            <p className="font-bold mb-2">{this.state.error?.toString()}</p>
            <pre>{this.state.errorInfo?.componentStack}</pre>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-8 px-6 py-2 border border-cyber-pulse hover:bg-cyber-pulse/10 transition-colors uppercase tracking-widest"
          >
            Reboot System
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
