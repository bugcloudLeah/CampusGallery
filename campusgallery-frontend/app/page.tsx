"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { useGallery } from "@/hooks/useGallery";

export default function Page() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const forceSepolia = process.env.NEXT_PUBLIC_FORCE_SEPOLIA === "1";
  const autoSwitchTriedRef = useState<{ tried: boolean }>({ tried: false })[0];

  useEffect(() => {
    const detectProvider = () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum as ethers.Eip1193Provider;
        setProvider(eth);
        eth.request({ method: "eth_chainId" }).then((cid) => {
          const chainIdNum = parseInt(cid as string, 16);
          setChainId(chainIdNum);
        });
        return true;
      }
      return false;
    };

    if (!detectProvider()) {
      const timer = setInterval(() => {
        if (detectProvider()) clearInterval(timer);
      }, 100);
      setTimeout(() => clearInterval(timer), 10000);
    }
  }, []);

  const { instance, status, error } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const gallery = useGallery({ instance, provider, chainId });

  const connect = async () => {
    if (!provider) return;
    await provider.request?.({ method: "eth_requestAccounts" });
  };

  const switchToSepolia = async () => {
    if (!provider) return;
    try {
      await provider.request?.({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }],
      });
    } catch (e: any) {
      if (e?.code === 4902) {
        await provider.request?.({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia",
            nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://rpc.sepolia.org"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
        await provider.request?.({ method: "wallet_switchEthereumChain", params: [{ chainId: "0xaa36a7" }] });
      }
    }
    const cid = await provider.request?.({ method: "eth_chainId" });
    if (cid) setChainId(parseInt(cid as string, 16));
  };

  useEffect(() => {
    if (!forceSepolia || !provider || chainId === undefined) return;
    if (chainId !== 11155111 && !autoSwitchTriedRef.tried) {
      autoSwitchTriedRef.tried = true;
      switchToSepolia();
    }
  }, [forceSepolia, provider, chainId]);

  const content = useMemo(() => {
    if (!provider) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="modern-card p-20 max-w-2xl text-center">
            <div className="mb-12">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl animate-bounce-gentle">
                <span className="text-4xl">🔗</span>
              </div>
              <h2 className="text-4xl font-black text-modern-gradient mb-6">连接你的钱包</h2>
              <p className="text-slate-600 text-xl leading-relaxed">开启去中心化的校园创作之旅</p>
            </div>
            <button onClick={connect} className="btn-modern-primary w-full">
              🚀 连接 MetaMask
            </button>
          </div>
        </div>
      );
    }
    
    if (status !== "ready") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
          <div className="modern-card p-16 text-center max-w-xl">
            <div className="modern-loading w-20 h-20 border-indigo-500 mx-auto mb-8"></div>
            <h3 className="text-3xl font-black text-modern-gradient mb-6">系统初始化中</h3>
            <p className="text-slate-600 text-lg mb-4">状态: {status}</p>
            {error && <p className="text-red-600 mt-6 font-semibold text-lg">{error.message}</p>}
            {provider && chainId !== undefined && chainId !== 11155111 && (
              <div className="mt-8 space-y-6">
                <p className="text-slate-600 text-lg">当前网络: {chainId}，请切换到 Sepolia</p>
                <button onClick={switchToSepolia} className="btn-modern-primary">一键切换到 Sepolia</button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-16">
        {provider && chainId !== 11155111 && (
          <div className="modern-alert-info">
            <div className="flex items-center justify-between gap-6">
              <p className="text-lg">当前网络: {chainId ?? '-'}，请切换到 Sepolia 以使用测试网</p>
              <button onClick={switchToSepolia} className="btn-modern-secondary">切换网络</button>
            </div>
          </div>
        )}

        {/* Ultra Modern Hero */}
        <div className="modern-hero-section text-center">
          <div className="mb-12">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-2xl animate-pulse-slow">
                <span className="text-white text-3xl">🎓</span>
              </div>
              <h1 className="text-modern-title mb-6">创作空间</h1>
              <p className="text-2xl text-slate-600 mb-12 max-w-4xl mx-auto leading-relaxed font-medium">
                ✨ 发现校园创作者的精彩作品，每一次互动都受到同态加密技术的隐私保护
              </p>
            </div>
            
            {/* Modern Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-4xl mx-auto">
              <div className="modern-stat-card group">
                <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">
                  {gallery.items.length}
                </div>
                <div className="text-slate-600 font-semibold">创作作品</div>
                <div className="text-xs text-indigo-500 mt-2">📈 持续增长</div>
              </div>
              <div className="modern-stat-card group">
                <div className="text-4xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
                  🔐
                </div>
                <div className="text-slate-600 font-semibold">隐私保护</div>
                <div className="text-xs text-purple-500 mt-2">FHE 加密</div>
              </div>
              <div className="modern-stat-card group">
                <div className="text-4xl font-black bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-3">
                  ⛓️
                </div>
                <div className="text-slate-600 font-semibold">去中心化</div>
                <div className="text-xs text-pink-500 mt-2">区块链</div>
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-6">
              <button 
                onClick={gallery.refreshArtworks} 
                disabled={!gallery.canRefresh || gallery.busy}
                className="btn-modern-primary"
              >
                {gallery.busy ? (
                  <>
                    <span className="modern-loading w-6 h-6 mr-3"></span>
                    加载中...
                  </>
                ) : (
                  <>🔄 刷新作品</>
                )}
              </button>
              <button 
                onClick={() => gallery.mockUpload()} 
                className="btn-modern-secondary"
              >
                ⚡ 快速创建示例
              </button>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {gallery.message && (
          <div className={`modern-alert ${
            gallery.message.includes('✅') ? 'modern-alert-success' : 
            gallery.message.includes('❌') ? 'modern-alert-error' : 
            'modern-alert-info'
          }`}>
            <p className="font-bold text-xl">{gallery.message}</p>
          </div>
        )}

        {/* Modern Masonry Gallery */}
        {gallery.items.length === 0 ? (
          <div className="modern-card p-20 text-center">
            <div className="text-9xl mb-8 animate-bounce-gentle">🎨</div>
            <h3 className="text-4xl font-black text-modern-gradient mb-6">暂无创作</h3>
            <p className="text-slate-600 text-xl mb-12 leading-relaxed">成为第一个分享作品的校园创作者吧！</p>
            <a href="/upload" className="btn-modern-primary">
              ✨ 开始创作
            </a>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 xl:columns-3 gap-8 space-y-8">
            {gallery.items.map((item, index) => (
              <div key={item.id} className="modern-artwork-card group break-inside-avoid mb-8" style={{height: 'fit-content'}}>
                {/* Modern Artwork Visual */}
                <div className={`w-full ${index % 3 === 0 ? 'h-64' : index % 3 === 1 ? 'h-48' : 'h-56'} bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 rounded-3xl mb-6 flex items-center justify-center border border-indigo-200/50 group-hover:border-purple-300 transition-all duration-500 relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                  <div className="text-center relative z-10">
                    <div className="text-6xl mb-4 animate-float">🖼️</div>
                    <div className="badge-modern">作品 #{item.id}</div>
                  </div>
                </div>

                {/* Modern Artwork Info */}
                <div className="space-y-6 mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-modern-gradient mb-3">{item.title}</h3>
                    <p className="text-slate-600 font-medium">
                      创作者: <span className="font-mono bg-slate-100 px-3 py-1 rounded-xl">{item.artist.slice(0, 6)}...{item.artist.slice(-4)}</span>
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="modern-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {item.categories.map((cat, idx) => (
                      <span key={idx} className="badge-modern">
                        ✨ {cat === 'campus-classic' ? '学院派' : 
                            cat === 'campus-modern' ? '现代设计' : 
                            cat === 'campus-creative' ? '创意海报' : 
                            cat === 'campus-calligraphy' ? '书法艺术' : cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Modern Action Buttons */}
                <div className="space-y-4">
                  <button 
                    onClick={() => gallery.like(item.id)} 
                    disabled={!gallery.canLike || gallery.busy || gallery.likedItems.has(item.id)}
                    className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all duration-300 ${
                      gallery.likedItems.has(item.id) 
                        ? 'bg-gradient-to-r from-emerald-100 to-green-100 border-2 border-emerald-300 text-emerald-700 cursor-not-allowed shadow-lg' 
                        : 'btn-modern-secondary hover:scale-105'
                    }`}
                  >
                    {gallery.likedItems.has(item.id) ? '✅ 已鼓掌' : '👏 鼓掌支持'}
                  </button>
                  
                  {item.categories.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm text-slate-500 font-semibold">背书类别:</p>
                      {item.categories.map((cat) => (
                        <button 
                          key={cat}
                          onClick={() => gallery.vote(item.id, cat)} 
                          disabled={!gallery.canVote || gallery.busy || gallery.votedItems.has(item.id)}
                          className={`w-full py-3 px-5 rounded-xl font-semibold transition-all duration-300 ${
                            gallery.votedItems.has(item.id) 
                              ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-2 border-purple-300 text-purple-700 cursor-not-allowed shadow-md' 
                              : 'btn-modern-outline hover:scale-105'
                          }`}
                        >
                          {gallery.votedItems.has(item.id) ? '✅ 已背书' : `🌟 背书 - ${
                            cat === 'campus-classic' ? '学院派' : 
                            cat === 'campus-modern' ? '现代设计' : 
                            cat === 'campus-creative' ? '创意海报' : 
                            cat === 'campus-calligraphy' ? '书法艺术' : cat
                          }`}
                        </button>
                      ))}
                    </div>
                  )}
                  
                  <button 
                    onClick={() => gallery.decryptLikes(item.id)} 
                    disabled={!gallery.canDecrypt || gallery.busy}
                    className="btn-modern-outline w-full"
                  >
                    🔓 解密数据
                  </button>

                  {/* Modern Decrypted Display */}
                  {gallery.likesClear[item.id] !== undefined && (
                    <div className="modern-alert-success text-center">
                      <p className="font-black text-2xl">
                        💎 {String(gallery.likesClear[item.id])} 次鼓掌
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }, [provider, status, error, gallery, chainId]);

  return content;
}

