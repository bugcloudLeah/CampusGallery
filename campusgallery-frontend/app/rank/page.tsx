"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { CampusGalleryABI } from "@/abi/CampusGalleryABI";
import { CampusGalleryAddresses } from "@/abi/CampusGalleryAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";

const categories = [
  { id: "campus-classic", name: "🏛️ 学院派传统" },
  { id: "campus-modern", name: "🎨 现代设计" },
  { id: "campus-creative", name: "🧩 创意海报" },
  { id: "campus-calligraphy", name: "🖋️ 书法" },
];

export default function RankPage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [category, setCategory] = useState("campus-classic");
  const [rows, setRows] = useState<{ id: number; title: string; handle: string; clear?: bigint | string; artist: string }[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [decrypting, setDecrypting] = useState(false);

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

  const { instance, status } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const addr = useMemo(() => (chainId ? (CampusGalleryAddresses as any)[chainId.toString()]?.address : undefined), [chainId]);

  const refresh = async () => {
    if (!provider || !addr) return;
    setLoading(true);
    setMsg("");
    try {
      const bp = new ethers.BrowserProvider(provider);
      const rp = await bp;
      const contract = new ethers.Contract(addr, CampusGalleryABI.abi, rp);
      const ids: bigint[] = await contract.getAllArtworks();
      const arr: { id: number; title: string; handle: string; artist: string }[] = [];
      
      console.log(`[Rank] 找到 ${ids.length} 个作品，当前类别: ${category}`);
      
      for (const idb of ids) {
        const id = Number(idb);
        const art = await contract.getArtwork(id);
        const artCategories = art[6]; // categories 字段
        
        console.log(`[Rank] 作品 #${id} (${art[2]}) 的类别:`, artCategories);
        
        const belongsToCategory = artCategories.includes(category);
        if (belongsToCategory) {
          const handle = await contract.getVotes(id, category);
          arr.push({ id, title: art[2], handle, artist: art[1] });
          console.log(`[Rank] 添加作品 #${id} 到榜单`);
        } else {
          console.log(`[Rank] 作品 #${id} 不属于类别 ${category}`);
        }
      }
      
      setRows(arr);
      setMsg(arr.length === 0 ? `📭 当前类别 \"${getCategoryName(category)}\" 下暂无画作` : `✅ 找到 ${arr.length} 件作品`);
    } catch (e: any) {
      setMsg("❌ " + (e?.message ?? String(e)));
      console.error("[Rank] 刷新失败:", e);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (catId: string) => categories.find(c => c.id === catId)?.name.replace(/🏛️|🎨|🧩|🖋️/, '').trim() || catId;

  const decryptAll = async () => {
    if (!provider || !addr || !instance || rows.length === 0) return;
    setDecrypting(true);
    setMsg("");
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const { publicKey, privateKey } = instance.generateKeypair();
      const sig = await FhevmDecryptionSignature.new(instance, [addr], publicKey, privateKey, s);
      if (!sig) throw new Error("解密签名失败");
      const validPairs = rows
        .filter((r) => r.handle && r.handle !== "0x0000000000000000000000000000000000000000000000000000000000000000")
        .map((r) => ({ handle: r.handle, contractAddress: addr! }));
      if (validPairs.length === 0) {
        setMsg("📭 当前类别下没有背书数据可解密");
        return;
      }
      const res = await instance.userDecrypt(validPairs, sig.privateKey, sig.publicKey, sig.signature, sig.contractAddresses, sig.userAddress, sig.startTimestamp, sig.durationDays);
      setRows((old) => old.map((r) => ({
        ...r,
        clear: r.handle && r.handle !== "0x0000000000000000000000000000000000000000000000000000000000000000"
          ? res[r.handle] as any
          : 0
      })));
      setMsg(`✅ 解密完成，共解密 ${validPairs.length} 个有效背书数据`);
    } catch (e: any) { 
      setMsg("❌ 解密失败: " + (e?.message ?? String(e))); 
    } finally {
      setDecrypting(false);
    }
  };

  useEffect(() => { refresh(); }, [provider, addr, category]);

  const sorted = [...rows].sort((a, b) => Number(b.clear ?? 0) - Number(a.clear ?? 0));
  const currentCategory = categories.find(c => c.id === category) || categories[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-campus-lg animate-float">
            <span className="text-white text-2xl">🏆</span>
          </div>
          <h1 className="text-campus-title">校园榜单</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4">发现最受欢迎的校园画作</p>
        <div className="inline-flex items-center gap-2 campus-alert-info max-w-fit">
          <span>FHEVM 状态:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Category Selection - Vertical Tab Style */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Sidebar - Category Menu */}
        <div className="lg:col-span-1">
          <div className="campus-card p-6 sticky top-24">
            <h3 className="text-lg font-bold text-campus-gradient mb-4">📂 分类筛选</h3>
            <div className="space-y-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg'
                      : 'bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 hover:border-orange-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{cat.name.split(' ')[0]}</span>
                    <div>
                      <div className="font-medium">{getCategoryName(cat.id)}</div>
                      {category === cat.id && (
                        <div className="text-xs opacity-90">正在查看</div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Content - Rankings */}
        <div className="lg:col-span-3 space-y-6">
          {/* Controls Bar */}
          <div className="modern-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{currentCategory.name.split(' ')[0]}</span>
                <div>
                  <h2 className="text-2xl font-black text-modern-gradient">{getCategoryName(currentCategory.id)}</h2>
                  <p className="text-slate-500 font-medium">共 {sorted.length} 件作品</p>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={refresh} disabled={loading} className="btn-modern-secondary">
                  {loading ? (
                    <>
                      <span className="modern-loading w-4 h-4 mr-2"></span>
                      刷新
                    </>
                  ) : (
                    "🔄 刷新"
                  )}
                </button>
                <button onClick={decryptAll} disabled={decrypting || rows.length === 0} className="btn-modern-primary">
                  {decrypting ? (
                    <>
                      <span className="modern-loading w-4 h-4 mr-2"></span>
                      解密中
                    </>
                  ) : (
                    "🔓 解密背书"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Message */}
          {msg && (
            <div className={`modern-alert ${msg.includes('✅') ? 'modern-alert-success' : 'modern-alert-error'}`}>
              <p className="font-bold text-lg">{msg}</p>
            </div>
          )}

          {/* All Rankings - Always Show */}
          <div className="modern-card p-8">
            <h3 className="text-2xl font-black text-modern-gradient mb-6 text-center">
              📊 {getCategoryName(category)} 榜单
            </h3>
            
            {sorted.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-8xl mb-6 animate-bounce-gentle">📚</div>
                <h3 className="text-3xl font-black text-modern-gradient mb-4">暂无榜单数据</h3>
                <p className="text-slate-600 text-xl mb-8">还没有作品获得背书，快去支持你喜欢的画作吧！</p>
                <a href="/" className="btn-modern-primary">🏛️ 前往展馆</a>
              </div>
            ) : (
              <div className="space-y-6">
                {sorted.map((item, index) => (
                  <div key={item.id} className={`modern-card-glass p-6 flex items-center gap-6 ${
                    index === 0 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-300' :
                    index === 1 ? 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300' :
                    index === 2 ? 'bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300' :
                    'border border-slate-200'
                  }`}>
                    {/* Rank Badge */}
                    <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-slate-400 to-slate-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white' :
                      'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'
                    }`}>
                      {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                    </div>

                    {/* Artwork Info */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="badge-modern">#{item.id}</span>
                        <h3 className="text-xl font-bold text-slate-800 truncate">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-slate-600">
                        创作者: <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">
                          {item.artist.slice(0, 6)}...{item.artist.slice(-4)}
                        </span>
                      </p>
                    </div>

                    {/* Score Display */}
                    <div className="flex-shrink-0 text-center">
                      <div className={`text-4xl font-black mb-2 ${
                        item.clear !== undefined ? 
                          (index < 3 ? 'text-indigo-600' : 'text-slate-700') : 
                          'text-slate-400'
                      }`}>
                        {item.clear !== undefined ? String(item.clear) : '?'}
                      </div>
                      <div className="text-sm text-slate-500 font-medium">背书数</div>
                      {index < 3 && (
                        <div className="text-xs text-indigo-600 mt-1 font-bold">
                          {index === 0 ? '🏆 冠军' : index === 1 ? '🥈 亚军' : '🥉 季军'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


