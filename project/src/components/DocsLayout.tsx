import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronRight, BookOpen, Shield, Wallet, Code, Cpu, Layers, Map, FileText } from 'lucide-react';

interface DocSection {
  title: string;
  path: string;
  icon: React.ReactNode;
}

const docSections: DocSection[] = [
  { title: 'Introduction', path: '/docs', icon: <BookOpen className="w-4 h-4" /> },
  { title: 'Architecture', path: '/docs/architecture', icon: <Layers className="w-4 h-4" /> },
  { title: 'ZK Authentication', path: '/docs/zk-auth', icon: <Shield className="w-4 h-4" /> },
  { title: 'Solana Integration', path: '/docs/solana', icon: <Wallet className="w-4 h-4" /> },
  { title: 'Smart Contracts', path: '/docs/contracts', icon: <FileText className="w-4 h-4" /> },
  { title: 'API Reference', path: '/docs/api', icon: <Code className="w-4 h-4" /> },
  { title: 'Technology Stack', path: '/docs/tech-stack', icon: <Cpu className="w-4 h-4" /> },
  { title: 'Roadmap', path: '/docs/roadmap', icon: <Map className="w-4 h-4" /> },
];

interface DocsLayoutProps {
  children: React.ReactNode;
}

export default function DocsLayout({ children }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/docs') {
      return location.pathname === '/docs';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[#2a2a2a] bg-black/95 backdrop-blur">
        <div className="flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link to="/" className="flex items-center gap-2 ml-2 lg:ml-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#17ff9a] to-[#0ec97d] flex items-center justify-center">
              <span className="text-black font-bold text-sm">ZK</span>
            </div>
            <span className="font-bold text-white text-lg">ZKForge Docs</span>
          </Link>

          <Link
            to="/"
            className="ml-auto px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Back to App
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)]
          w-64 shrink-0 border-r border-[#2a2a2a] bg-black
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <nav className="h-full overflow-y-auto p-6">
            <div className="space-y-1">
              {docSections.map((section) => (
                <Link
                  key={section.path}
                  to={section.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium
                    transition-colors
                    ${isActive(section.path)
                      ? 'bg-[#17ff9a]/10 text-[#17ff9a] border border-[#17ff9a]/20'
                      : 'text-gray-400 hover:text-white hover:bg-[#1a1a1a]'
                    }
                  `}
                >
                  {section.icon}
                  {section.title}
                  {isActive(section.path) && (
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  )}
                </Link>
              ))}
            </div>
          </nav>
        </aside>

        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
