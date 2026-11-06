import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Keeps a render-time throw from blanking the Owlbear panel.
 *
 * Without a boundary, React unmounts the whole tree on an uncaught error and
 * the extension shows an empty black box with no clue what happened. This
 * shows the error instead, and offers a reload.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('MÖRK BORG sheet crashed:', error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="p-4 text-mb-white bg-mb-black min-h-screen font-mono text-xs">
        <h1 className="text-mb-yellow text-base font-bold mb-2">THE SHEET BROKE</h1>
        <p className="mb-3">{error.message}</p>
        <button
          className="border border-mb-yellow text-mb-yellow px-3 py-1"
          onClick={() => {
            this.setState({ error: null });
            window.location.reload();
          }}
        >
          RELOAD
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
