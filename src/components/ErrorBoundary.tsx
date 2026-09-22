import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Bump this (e.g. the route path) to auto-reset after navigating away. */
  resetKey?: string;
}
interface State {
  error: Error | null;
}

/**
 * Stops one broken page from white-screening the entire admin. A render or
 * lifecycle error inside a routed page is caught here and shown as a card, so
 * the sidebar stays usable and the admin can move to another section.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, maxWidth: 620 }}>
          <h2 style={{ margin: "0 0 8px", color: "#b91c1c" }}>This page hit an error</h2>
          <p className="muted" style={{ margin: "0 0 16px" }}>
            Something on this screen failed to load. The rest of the admin still
            works — try again, or pick another section from the sidebar.
          </p>
          <pre
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#7f1d1d",
              padding: 12,
              borderRadius: 8,
              fontSize: 12,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {this.state.error.message}
          </pre>
          <button className="btn" style={{ marginTop: 16 }} onClick={() => this.setState({ error: null })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
