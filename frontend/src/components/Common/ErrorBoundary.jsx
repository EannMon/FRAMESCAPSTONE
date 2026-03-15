import React from 'react';
import './ErrorBoundary.css';

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
                <div className="error-boundary-container">
                    <div className="error-boundary-card">
                        <div className="error-boundary-icon">⚠️</div>
                        <h2 className="error-boundary-title">
                            Something went wrong
                        </h2>
                        <p className="error-boundary-text">
                            This page ran into an unexpected error. It may be a network issue or a data loading problem.
                        </p>
                        <div className="error-boundary-actions">
                            <button
                                onClick={this.handleReset}
                                className="error-boundary-btn-primary"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="error-boundary-btn-outline"
                            >
                                Reload Page
                            </button>
                        </div>
                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="error-boundary-details">
                                <summary>Error details (dev only)</summary>
                                <pre>
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
