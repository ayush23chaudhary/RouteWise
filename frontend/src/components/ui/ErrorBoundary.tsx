import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught React ErrorBoundary error:', error, errorInfo)
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[--color-bg-base] text-[--color-text-primary] p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-[--color-violation-bg] border border-[--color-violation]/30 flex items-center justify-center mb-4">
            <AlertTriangle size={24} className="text-[--color-violation]" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-xs text-[--color-text-tertiary] max-w-md mb-6 leading-relaxed">
            An unexpected application error occurred. You can reload the application to restore functionality.
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-[--color-accent] hover:bg-[--color-accent-hover] text-white rounded-[--radius-md] transition-colors"
          >
            <RefreshCw size={14} />
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
