"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { CampusGalleryABI } from "@/abi/CampusGalleryABI";
import { CampusGalleryAddresses } from "@/abi/CampusGalleryAddresses";

export default function MePage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [items, setItems] = useState<any[]>([]);
  const [addr0, setAddr0] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const detectProvider = () => {
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const eth = (window as any).ethereum as ethers.Eip1193Provider;
        setProvider(eth);
        eth.request({ method: "eth_chainId" }).then((cid) => setChainId(parseInt(cid as string, 16)));
        return true;
      }
      return false;
    };

    if (!detectProvider()) {
      const timer = setInterval(() => {
        if (detectProvider()) clearInterval(timer);
      }, 100);
      setTimeout(() => clearInterval(timer), 5000);
    }
  }, []);

  const addr = useMemo(() => (chainId ? (CampusGalleryAddresses as any)[chainId.toString()]?.address : undefined), [chainId]);

  const refreshMine = async () => {
    if (!provider || !addr) return;
    setLoading(true);
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const my = await s.getAddress();
      setAddr0(my);
      const rp = await bp;
      const contract = new ethers.Contract(addr, CampusGalleryABI.abi, rp);
      const ids: bigint[] = await contract.getAllArtworks();
      const mine: any[] = [];
      for (const idb of ids) {
        const id = Number(idb);
        const art = await contract.getArtwork(id);
        if (String(art[1]).toLowerCase() === my.toLowerCase()) {
          mine.push({ 
            id, 
            title: art[2], 
            descriptionHash: art[3],
            fileHash: art[4], 
            tags: art[5],
            ts: Number(art[7])
          });
        }
      }
      setItems(mine.sort((a, b) => b.ts - a.ts));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshMine(); }, [provider, addr]);

  const formatDate = (timestamp: number) => new Date(timestamp * 1000).toLocaleString('zh-CN');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-campus-lg animate-float">
            <span className="text-white text-2xl">👤</span>
          </div>
          <h1 className="text-campus-title">我的画作</h1>
        </div>
        <p className="text-xl text-gray-600 mb-6">管理你上传的校园画作</p>
        
        {addr0 && (
          <div className="campus-card p-6 inline-block max-w-md">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">👤</span>
              </div>
              <div className="text-left">
                <p className="text-sm text-gray-500 font-medium">钱包地址</p>
                <p className="font-mono text-orange-600 font-semibold">{addr0.slice(0, 8)}...{addr0.slice(-4)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button onClick={refreshMine} disabled={loading} className="btn-campus-primary">
          {loading ? (
            <>
              <span className="campus-loading w-5 h-5 mr-2"></span>
              加载中...
            </>
          ) : (
            "🔄 刷新我的画作"
          )}
        </button>
      </div>

      {items.length === 0 ? (
        <div className="campus-card p-16 text-center">
          <div className="text-8xl mb-6 animate-bounce-gentle">🖌️</div>
          <h3 className="text-3xl font-bold text-campus-gradient mb-4">还没有上传画作</h3>
          <p className="text-gray-600 text-lg mb-8">开始你的校园创作之旅吧！</p>
          <a href="/upload" className="btn-campus-primary">
            📤 投稿第一件画作
          </a>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Dashboard Stats */}
          <div className="campus-card p-8">
            <h2 className="text-2xl font-bold text-campus-gradient mb-6 text-center">📊 创作仪表盘</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="campus-stat-card group hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-black text-orange-600 mb-2">{items.length}</div>
                <div className="text-sm text-gray-500 font-medium">总画作数</div>
                <div className="text-xs text-orange-500 mt-1">📈 持续创作</div>
              </div>
              <div className="campus-stat-card group hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-black text-green-600 mb-2">{items.reduce((acc, item) => acc + item.tags.length, 0)}</div>
                <div className="text-sm text-gray-500 font-medium">总标签数</div>
                <div className="text-xs text-green-500 mt-1">🏷️ 丰富标签</div>
              </div>
              <div className="campus-stat-card group hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-black text-purple-600 mb-2">
                  {items.length > 0 ? Math.floor((Date.now() / 1000 - Math.min(...items.map(i => i.ts))) / (24 * 60 * 60)) : 0}
                </div>
                <div className="text-sm text-gray-500 font-medium">创作天数</div>
                <div className="text-xs text-purple-500 mt-1">⏰ 创作历程</div>
              </div>
              <div className="campus-stat-card group hover:scale-105 transition-all duration-200">
                <div className="text-3xl font-black text-blue-600 mb-2">
                  {items.length > 0 ? Math.round(items.reduce((acc, item) => acc + item.tags.length, 0) / items.length * 10) / 10 : 0}
                </div>
                <div className="text-sm text-gray-500 font-medium">平均标签</div>
                <div className="text-xs text-blue-500 mt-1">🎯 标签密度</div>
              </div>
            </div>
          </div>

          {/* Artwork Gallery */}
          <div className="campus-card p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-campus-gradient">🎨 我的画作集</h3>
              <span className="badge-campus">{items.length} 件作品</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="campus-artwork-card group">
                  {/* Artwork Visual */}
                  <div className="w-full h-48 bg-gradient-to-br from-orange-100 via-yellow-100 to-red-100 rounded-2xl mb-4 flex items-center justify-center border-2 border-orange-200/50 group-hover:border-orange-300 transition-colors">
                    <div className="text-center">
                      <div className="text-4xl mb-2 animate-float">🖼️</div>
                      <div className="badge-campus">画作 #{item.id}</div>
                    </div>
                  </div>
                  
                  {/* Artwork Info */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-xl font-bold text-campus-gradient mb-2">{item.title}</h4>
                      <div className="text-sm text-gray-500 mb-3">
                        📅 {formatDate(item.ts)}
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag: string, idx: number) => (
                        <span key={idx} className="campus-tag text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span>📝</span>
                        <span className="truncate">{item.descriptionHash || '无简介'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🔗</span>
                        <span className="truncate font-mono text-xs">{item.fileHash || '无文件'}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t-2 border-gray-100">
                      <a 
                        href={`/?id=${item.id}`} 
                        target="_blank" 
                        className="btn-campus-secondary w-full group-hover:scale-105 transition-transform"
                      >
                        👁️ 在展馆查看
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <div className="campus-card p-8">
            <h3 className="text-xl font-bold text-campus-gradient mb-6">💡 创作者小贴士</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg">🎭</span>
                <div>
                  <div className="font-medium mb-1">匿名创作</div>
                  <div>你的身份完全匿名，仅通过钱包地址识别</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg">⛓️</span>
                <div>
                  <div className="font-medium mb-1">永久保存</div>
                  <div>作品上链后无法删除或修改，请谨慎上传</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg">🔒</span>
                <div>
                  <div className="font-medium mb-1">隐私保护</div>
                  <div>鼓掌和背书数据通过 FHE 加密保护</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-orange-500 text-lg">🏷️</span>
                <div>
                  <div className="font-medium mb-1">标签优化</div>
                  <div>使用有意义的标签帮助观众发现作品</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


