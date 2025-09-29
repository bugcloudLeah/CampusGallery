"use client";

import { useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useFhevm } from "@/fhevm/useFhevm";
import { CampusGalleryABI } from "@/abi/CampusGalleryABI";
import { CampusGalleryAddresses } from "@/abi/CampusGalleryAddresses";

export default function UploadPage() {
  const [provider, setProvider] = useState<ethers.Eip1193Provider | undefined>(undefined);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState("");
  const [descHash, setDescHash] = useState("");
  const [fileHash, setFileHash] = useState("");
  const [tags, setTags] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [msg, setMsg] = useState("");
  const [uploading, setUploading] = useState(false);

  const categories = [
    { id: "campus-classic", name: "学院派传统", icon: "🏛️" },
    { id: "campus-modern", name: "现代设计", icon: "🎨" },
    { id: "campus-creative", name: "创意海报", icon: "🧩" },
    { id: "campus-calligraphy", name: "书法", icon: "🖋️" },
  ];

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

  const { status } = useFhevm({ provider, chainId, initialMockChains: { 31337: "http://localhost:8545" }, enabled: true });
  const addr = useMemo(() => (chainId ? (CampusGalleryAddresses as any)[chainId.toString()]?.address : undefined), [chainId]);

  const onUpload = async () => {
    if (!provider || !addr || !title.trim() || selectedCategories.length === 0) return;
    setUploading(true);
    setMsg("");
    try {
      const bp = new ethers.BrowserProvider(provider);
      const s = await bp.getSigner();
      const contract = new ethers.Contract(addr, CampusGalleryABI.abi, s);
      const tagArr = tags.trim() ? tags.split(",").map((t) => t.trim()) : [];
      setMsg("正在上传到区块链...");
      const tx = await contract.submitPainting(title, descHash, fileHash, tagArr, selectedCategories);
      setMsg("等待交易确认...");
      await tx.wait();
      setMsg("✅ 画作上传成功！");
      setTitle("");
      setDescHash("");
      setFileHash("");
      setTags("");
      setSelectedCategories([]);
    } catch (e: any) {
      setMsg("❌ 上传失败: " + (e?.message ?? String(e)));
    } finally {
      setUploading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const fillExample = () => {
    setTitle("校园黄昏速写");
    setDescHash("ipfs://QmExampleDescriptionHash123");
    setFileHash("ipfs://QmExampleFileHash456");
    setTags("校园, 速写, 傍晚, 林荫");
    setSelectedCategories(["campus-classic"]);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));
  const canProceed = (step: number) => {
    switch(step) {
      case 1: return title.trim().length > 0;
      case 2: return fileHash.trim().length > 0;
      case 3: return selectedCategories.length > 0;
      default: return true;
    }
  };

  const steps = [
    { number: 1, title: "画作信息", icon: "📝" },
    { number: 2, title: "文件上传", icon: "📁" },
    { number: 3, title: "分类标签", icon: "🏷️" },
    { number: 4, title: "确认提交", icon: "✅" }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center shadow-campus-lg animate-float">
            <span className="text-white text-2xl">🖌️</span>
          </div>
          <h1 className="text-campus-title">投稿画作</h1>
        </div>
        <p className="text-xl text-gray-600 mb-4">将你的校园画作匿名上传到区块链展览</p>
        <div className="inline-flex items-center gap-2 campus-alert-info max-w-fit">
          <span>FHEVM 状态:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${status === 'ready' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="campus-card p-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center gap-3 ${currentStep >= step.number ? 'text-orange-600' : 'text-gray-400'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all duration-300 ${
                  currentStep >= step.number 
                    ? 'bg-gradient-to-r from-orange-400 to-red-400 text-white shadow-lg' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <div className="hidden md:block">
                  <div className="font-semibold">{step.title}</div>
                  <div className="text-xs opacity-75">步骤 {step.number}</div>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-4 rounded-full transition-colors duration-300 ${
                  currentStep > step.number ? 'bg-orange-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">
          {currentStep === 1 && (
            <div className="space-y-6 animate-bounce-gentle">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-2xl font-bold text-campus-gradient mb-2">画作基本信息</h3>
                <p className="text-gray-600">为你的画作起个好听的名字吧</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    🎨 画作标题 *
                  </label>
                  <input
                    type="text"
                    placeholder="为你的画作起个名字..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-campus w-full text-lg"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    💡 一个好的标题能让更多人发现你的作品
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    📝 简介哈希 (可选)
                  </label>
                  <input
                    type="text"
                    placeholder="ipfs://QmYourDescriptionHash..."
                    value={descHash}
                    onChange={(e) => setDescHash(e.target.value)}
                    className="input-campus w-full"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    将画作简介上传到 IPFS 后填入哈希值
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6 animate-bounce-gentle">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">📁</div>
                <h3 className="text-2xl font-bold text-campus-gradient mb-2">上传画作文件</h3>
                <p className="text-gray-600">将你的画作文件存储到去中心化网络</p>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    🖼️ 文件哈希 *
                  </label>
                  <input
                    type="text"
                    placeholder="ipfs://QmYourFileHash..."
                    value={fileHash}
                    onChange={(e) => setFileHash(e.target.value)}
                    className="input-campus w-full text-lg"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    将画作文件上传到 IPFS/Arweave 后填入哈希值
                  </p>
                </div>

                <div className="campus-card-alt p-6">
                  <h4 className="font-semibold text-gray-700 mb-3">🔗 推荐的存储平台</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-white/50 p-4 rounded-xl">
                      <div className="font-medium mb-1">IPFS</div>
                      <div className="text-gray-600">去中心化文件存储</div>
                    </div>
                    <div className="bg-white/50 p-4 rounded-xl">
                      <div className="font-medium mb-1">Arweave</div>
                      <div className="text-gray-600">永久存储网络</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6 animate-bounce-gentle">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🏷️</div>
                <h3 className="text-2xl font-bold text-campus-gradient mb-2">分类与标签</h3>
                <p className="text-gray-600">选择合适的分类，添加相关标签</p>
              </div>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-gray-700 font-semibold mb-4 text-lg">
                    🎯 作品类别 * (可多选)
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        disabled={uploading}
                        className={`p-6 rounded-2xl border-2 transition-all duration-200 ${
                          selectedCategories.includes(cat.id)
                            ? 'bg-orange-100 border-orange-300 text-orange-700 shadow-md'
                            : 'bg-white/50 border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200'
                        }`}
                      >
                        <div className="text-3xl mb-2">{cat.icon}</div>
                        <div className="font-semibold">{cat.name}</div>
                        {selectedCategories.includes(cat.id) && (
                          <div className="text-sm text-orange-600 mt-2">✓ 已选择</div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-3 text-lg">
                    🏷️ 标签
                  </label>
                  <input
                    type="text"
                    placeholder="速写, 水彩, 展板, 海报"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="input-campus w-full"
                    disabled={uploading}
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    用逗号分隔多个标签，便于其他同学发现你的作品
                  </p>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6 animate-bounce-gentle">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-campus-gradient mb-2">确认提交</h3>
                <p className="text-gray-600">请检查你的画作信息</p>
              </div>
              
              <div className="campus-card-alt p-8 space-y-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">画作标题</div>
                  <div className="text-xl font-bold text-gray-800">{title || "未填写"}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">文件哈希</div>
                  <div className="font-mono text-sm bg-gray-100 p-2 rounded break-all">
                    {fileHash || "未填写"}
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-2">选择的类别</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.length === 0 ? (
                      <span className="text-gray-400">未选择</span>
                    ) : (
                      selectedCategories.map((catId) => {
                        const cat = categories.find(c => c.id === catId);
                        return (
                          <span key={catId} className="badge-campus">
                            {cat?.icon} {cat?.name}
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
                
                {tags && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">标签</div>
                    <div className="flex flex-wrap gap-2">
                      {tags.split(',').map((tag, idx) => (
                        <span key={idx} className="campus-tag">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-8 border-t-2 border-gray-100">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="btn-campus-outline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← 上一步
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={fillExample}
              disabled={uploading}
              className="btn-campus-secondary"
            >
              📋 填入示例
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                disabled={!canProceed(currentStep)}
                className="btn-campus-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一步 →
              </button>
            ) : (
              <button
                onClick={onUpload}
                disabled={!title.trim() || !fileHash.trim() || selectedCategories.length === 0 || uploading || status !== 'ready'}
                className="btn-campus-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <span className="campus-loading w-5 h-5 mr-2"></span>
                    上传中...
                  </>
                ) : (
                  "🚀 确认上传"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Display */}
      {msg && (
        <div className={`campus-alert ${
          msg.includes('✅') 
            ? 'campus-alert-success' 
            : msg.includes('❌')
            ? 'campus-alert-error'
            : 'campus-alert-info'
        }`}>
          <p className="font-medium">{msg}</p>
        </div>
      )}

      {/* Tips */}
      <div className="campus-card p-8">
        <h3 className="text-xl font-bold text-campus-gradient mb-6">💡 投稿须知</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-lg">🔒</span>
            <div>
              <div className="font-medium mb-1">隐私保护</div>
              <div>鼓掌和背书数据通过 FHE 同态加密保护</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-lg">⛓️</span>
            <div>
              <div className="font-medium mb-1">永久存储</div>
              <div>作品一旦上传到区块链将无法删除或修改</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-lg">🎭</span>
            <div>
              <div className="font-medium mb-1">匿名创作</div>
              <div>你的身份完全匿名，仅通过钱包地址识别</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-orange-500 text-lg">🌐</span>
            <div>
              <div className="font-medium mb-1">去中心化</div>
              <div>建议使用 IPFS 或 Arweave 等去中心化存储</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


