import React from 'react';

// Without this, any crash while rendering leaves a blank screen with no way out.
// Workouts in progress are saved on the device, so reloading doesn't lose them.
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center p-8 text-center font-sans space-y-6">
        <h1 className="text-3xl font-bold">Something went wrong</h1>
        <p className="text-neutral-400 max-w-md leading-relaxed">Lethal Lifts hit an unexpected error. Reloading usually fixes it, and your logged workouts are safe.</p>
        <button onClick={() => window.location.reload()} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 py-4 rounded-xl transition-colors">Reload App</button>
        <p className="text-neutral-600 text-xs max-w-md break-words">{String(this.state.error?.message ?? this.state.error)}</p>
      </div>
    );
  }
}

export default ErrorBoundary;
