import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * React Error Boundary — catches unhandled rendering errors and shows a
 * user-friendly message instead of a blank/broken screen.
 *
 * Wrap the root <App /> (in main.tsx) with this to prevent full-page crashes.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // In production, send to an error tracking service (e.g., Sentry)
    console.error("[ErrorBoundary] Unhandled error:", error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
            backgroundColor: "#f8f9fa",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: 480,
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: "2.5rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ color: "#1F4E79", fontSize: "1.5rem", marginBottom: "0.5rem" }}>
              Something went wrong
            </h1>
            <p style={{ color: "#555", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              An unexpected error occurred. Your data is safe and has not been lost.
              Please reload the page to continue.
            </p>
            {import.meta.env.DEV && (
              <pre
                style={{
                  backgroundColor: "#f1f3f5",
                  padding: "0.75rem",
                  borderRadius: 6,
                  fontSize: "0.75rem",
                  textAlign: "left",
                  overflowX: "auto",
                  marginBottom: "1.5rem",
                  color: "#c0392b",
                }}
              >
                {this.state.errorMessage}
              </pre>
            )}
            <button
              onClick={this.handleReload}
              style={{
                backgroundColor: "#1F4E79",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.75rem 2rem",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Reload Page
            </button>
          </div>
          <p style={{ marginTop: "1rem", color: "#888", fontSize: "0.85rem" }}>
            CONFIDENTIAL — Financial Report System
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
