import { Link } from 'react-router-dom';
import { Terminal, ArrowRight, Code, Layout, Download } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const HomePage = () => {
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-terminal-bg">
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-terminal-accent/10 rounded-full">
              <Terminal className="w-16 h-16 text-terminal-accent" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-terminal-text">Rust TUI</span>
            <br />
            <span className="text-terminal-accent">Design Platform</span>
          </h1>

          <p className="text-lg text-terminal-text-dim mb-8 max-w-2xl mx-auto">
            Create beautiful TUI layouts with drag & drop.
            Generate production-ready Rust code for ratatui.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/editor" className="btn-primary flex items-center justify-center gap-2">
              <span>Start Designing</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {!isAuthenticated && (
              <Link to="/register" className="btn-secondary flex items-center justify-center gap-2">
                <span>Create Account</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-terminal-bg-secondary">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12 text-terminal-accent">
            Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card">
              <div className="p-3 bg-terminal-accent/10 rounded-lg w-fit mb-4">
                <Layout className="w-6 h-6 text-terminal-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-terminal-text">
                Visual Layout Editor
              </h3>
              <p className="text-terminal-text-dim">
                Drag and drop widgets to create complex TUI layouts.
                Split views horizontally or vertically with precise control.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card">
              <div className="p-3 bg-terminal-accent/10 rounded-lg w-fit mb-4">
                <Code className="w-6 h-6 text-terminal-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-terminal-text">
                Rust Code Generation
              </h3>
              <p className="text-terminal-text-dim">
                Generate clean, production-ready Rust code for ratatui.
                Supports all major widgets: Paragraph, List, Table, and more.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card">
              <div className="p-3 bg-terminal-accent/10 rounded-lg w-fit mb-4">
                <Download className="w-6 h-6 text-terminal-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2 text-terminal-text">
                One-Click Export
              </h3>
              <p className="text-terminal-text-dim">
                Download your complete Rust project as a ZIP file.
                Includes Cargo.toml and all necessary configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4 text-terminal-text">
            Ready to build your TUI?
          </h2>
          <p className="text-terminal-text-dim mb-8">
            {isAuthenticated
              ? 'Start designing and save your projects.'
              : 'No account required to start designing. Sign up to save and manage your projects.'}
          </p>
          <Link to="/editor" className="btn-primary inline-flex items-center gap-2">
            <span>Open Editor</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-terminal-border">
        <div className="max-w-6xl mx-auto text-center text-terminal-text-dim text-sm">
          <p>Tuify - Rust TUI Design Platform</p>
          <p className="mt-2">
            Built for the ratatui ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
};
