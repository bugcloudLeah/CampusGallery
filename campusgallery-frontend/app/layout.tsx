import Link from "next/link";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen">
          {/* Ultra Modern Floating Navigation */}
          <header className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-6">
            <nav className="modern-glass-effect rounded-3xl px-8 py-4 shadow-2xl">
              <div className="flex items-center justify-between">
                {/* Logo & Brand */}
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-pulse-slow">
                    <span className="text-white font-black text-2xl">🎓</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black text-modern-gradient">画廊空间</h1>
                    <p className="text-xs text-slate-500 font-semibold">Gallery Space</p>
                  </div>
                </div>

                {/* Navigation Pills */}
                <div className="hidden md:flex items-center space-x-3">
                  <Link href="/" className="nav-modern-link">
                    <span className="text-lg mr-2">🏛️</span>
                    空间
                  </Link>
                  <Link href="/upload" className="nav-modern-link">
                    <span className="text-lg mr-2">✨</span>
                    创作
                  </Link>
                  <Link href="/rank" className="nav-modern-link">
                    <span className="text-lg mr-2">🚀</span>
                    排行
                  </Link>
                  <Link href="/me" className="nav-modern-link">
                    <span className="text-lg mr-2">💫</span>
                    我的
                  </Link>
                </div>

                {/* Mobile Menu */}
                <button className="md:hidden btn-modern-outline p-3">
                  <span className="text-xl">⚡</span>
                </button>
              </div>
            </nav>
          </header>

          {/* Main Content with top padding for floating nav */}
          <main className="pt-32 pb-16">
            <div className="container mx-auto px-6">
              {children}
            </div>
          </main>

          {/* Ultra Modern Footer */}
          <footer className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-t border-indigo-200/50 mt-20">
            <div className="container mx-auto px-6 py-16">
              <div className="text-center mb-12">
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl animate-pulse-slow">
                  <span className="text-white text-3xl">🎓</span>
                </div>
                <h3 className="text-2xl font-black text-modern-gradient mb-3">画廊空间</h3>
                <p className="text-slate-600 text-lg max-w-2xl mx-auto leading-relaxed">
                  基于 FHEVM 同态加密技术的下一代校园创作展示平台
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
                <div className="text-center">
                  <div className="text-2xl mb-2">🔒</div>
                  <div className="font-semibold text-slate-700">隐私保护</div>
                  <div className="text-sm text-slate-500">FHE 加密</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">⛓️</div>
                  <div className="font-semibold text-slate-700">去中心化</div>
                  <div className="text-sm text-slate-500">区块链存储</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">🎓</div>
                  <div className="font-semibold text-slate-700">校园专属</div>
                  <div className="text-sm text-slate-500">学生创作</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-2">✨</div>
                  <div className="font-semibold text-slate-700">创新体验</div>
                  <div className="text-sm text-slate-500">现代设计</div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-slate-400 font-medium">
                  © 2024 画廊空间 · 让创意在区块链上闪耀
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

