import React from 'react';

/**
 * ErrorBoundary — catches any React render/lifecycle error in its subtree
 * and shows a friendly "something went wrong" UI instead of a white screen.
 *
 * Usage in App.jsx:
 *   <ErrorBoundary>
 *     <YourRoute />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, info) {
        console.error('[FRAMES ErrorBoundary]', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', minHeight: '60vh', padding: '40px',
                    textAlign: 'center', fontFamily: "'Segoe UI', sans-serif"
                }}>
                    <div style={{
                        background: '#fff', borderRadius: 16, padding: '40px 48px',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
                        border: '1px solid rgba(0,0,0,0.06)', maxWidth: 420
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚠️</div>
                        <h2 style={{ color: '#163269', margin: '0 0 8px', fontSize: '1.3rem' }}>
                            Something went wrong
                        </h2>
                        <p style={{ color: '#666', margin: '0 0 24px', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            This page ran into an unexpected error. It may be a network issue or a data loading problem.
                        </p>
                        <button
                            onClick={this.handleReset}
                            style={{
                                background: '#163269', color: '#fff', border: 'none',
                                borderRadius: 8, padding: '10px 24px', fontSize: '0.95rem',
                                fontWeight: 600, cursor: 'pointer', marginRight: 10
                            }}
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                background: 'white', color: '#163269',
                                border: '1px solid #163269', borderRadius: 8,
                                padding: '10px 24px', fontSize: '0.95rem',
                                fontWeight: 600, cursor: 'pointer'
                            }}
                        >
                            Reload Page
                        </button>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details style={{ marginTop: 20, textAlign: 'left', fontSize: '0.8rem', color: '#999' }}>
                                <summary style={{ cursor: 'pointer' }}>Error details (dev only)</summary>
                                <pre style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                                    {this.state.error?.toString()}
                                </pre>
                            </details>
                        )}
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;
