import React, { Component, ErrorInfo, ReactNode } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <LanguageContext.Consumer>
          {(context) => {
            const t = context?.t;
            return (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-red-800">
                <h2 className="text-xl font-bold">{t?.Title_Error || 'Something went wrong'}</h2>
                <p>{t?.Text_ErrorDesc || 'Please try again later or contact support.'}</p>
              </div>
            );
          }}
        </LanguageContext.Consumer>
      );
    }

    return this.props.children;
  }
}
