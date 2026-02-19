"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// Define the Equipment type based on our Prisma schema
interface Equipment { // Renamed from Product to Equipment
  id: string;
  name: string; // 備品名
  description: string | null; // 説明
  quantity: number; // 数量
  createdAt: string;
  updatedAt: string;
}

const LOW_STOCK_THRESHOLD = 10; // 在庫僅少の閾値

const Home: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]); // Renamed from products to equipmentList
  const [newEquipment, setNewEquipment] = useState({ name: '', description: '', quantity: '' as string | number }); // Removed price
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null); // Renamed
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // --- 備品データの取得 ---
  const fetchEquipment = async () => { // Renamed
    setLoading(true);
    try {
      const res = await fetch('/api/products'); // API path remains /api/products for consistency unless user wants to rename it
      if (!res.ok) throw new Error('備品データの取得に失敗しました');
      const data: Equipment[] = await res.json();
      setEquipmentList(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // --- 検索でフィルタリングされた備品リスト ---
  const filteredEquipment = useMemo(() => { // Renamed
    return equipmentList.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [equipmentList, searchQuery]);

  // --- API呼び出しハンドラとトースト通知 ---
  const handleAddEquipment = (e: React.FormEvent) => { // Renamed
    e.preventDefault();
    const promise = fetch('/api/products', { // API path remains /api/products
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newEquipment,
        quantity: parseInt(newEquipment.quantity as string, 10)
      }),
    }).then(res => {
      if (!res.ok) throw new Error('備品の追加に失敗しました');
      return res.json();
    });

    toast.promise(promise, {
      loading: '備品を追加中...',
      success: () => {
        setNewEquipment({ name: '', description: '', quantity: '' });
        fetchEquipment();
        return '備品が追加されました！';
      },
      error: (err) => `エラー: ${err.toString()}`,
    });
  };

  const handleUpdateEquipment = (e: React.FormEvent) => { // Renamed
    e.preventDefault();
    if (!editingEquipment) return;

    const promise = fetch(`/api/products/${editingEquipment.id}`, { // API path remains /api/products
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editingEquipment,
        quantity: parseInt(editingEquipment.quantity as unknown as string, 10)
      }),
    }).then(res => {
      if (!res.ok) throw new Error('備品の更新に失敗しました');
      return res.json();
    });

    toast.promise(promise, {
      loading: '備品を更新中...',
      success: () => {
        setEditingEquipment(null);
        fetchEquipment();
        return '備品が更新されました！';
      },
      error: (err) => `エラー: ${err.toString()}`,
    });
  };

  const handleDeleteEquipment = (id: string) => { // Renamed
    const promise = fetch(`/api/products/${id}`, { method: 'DELETE' }); // API path remains /api/products
    toast.promise(promise, {
      loading: '備品を削除中...',
      success: () => {
        fetchEquipment();
        return '備品が削除されました！';
      },
      error: '備品の削除に失敗しました',
    });
  };
  
  const handleEditClick = (equipment: Equipment) => { // Renamed
    setEditingEquipment(equipment);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // --- アニメーション設定 ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div
      className="container mx-auto p-4 sm:p-8 font-sans"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <header className="text-center mb-12">
        <motion.h1 variants={itemVariants} className="text-5xl sm:text-6xl font-serif text-retro-secondary mb-2">
          部活の備品管理
        </motion.h1>
        <motion.p variants={itemVariants} className="text-retro-secondary/70">
          レトロな雰囲気の備品管理パネル
        </motion.p>
      </header>

      {/* 備品フォーム (追加/編集) */}
      <motion.div variants={itemVariants} className="mb-12 p-6 sm:p-8 border-2 border-retro-secondary/20 rounded-lg shadow-lg bg-white/50 backdrop-blur-sm">
        <h2 className="text-3xl font-serif text-retro-primary mb-6">{editingEquipment ? '備品を編集' : '新しい備品を追加'}</h2>
        <form onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              placeholder="備品名"
              className="w-full p-3 bg-retro-bg/50 border-2 border-retro-secondary/10 rounded focus:border-retro-primary focus:ring-0"
              value={editingEquipment ? editingEquipment.name : newEquipment.name}
              onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, name: e.target.value }) : setNewEquipment({ ...newEquipment, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="説明（任意）"
              className="w-full p-3 bg-retro-bg/50 border-2 border-retro-secondary/10 rounded focus:border-retro-primary focus:ring-0 md:col-span-2"
              value={editingEquipment ? editingEquipment.description || '' : newEquipment.description || ''}
              onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, description: e.target.value }) : setNewEquipment({ ...newEquipment, description: e.target.value })}
            />
            {/* Price field removed */}
            <input
              type="number"
              placeholder="数量"
              className="w-full p-3 bg-retro-bg/50 border-2 border-retro-secondary/10 rounded focus:border-retro-primary focus:ring-0"
              value={editingEquipment ? editingEquipment.quantity : newEquipment.quantity}
              onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, quantity: parseInt(e.target.value, 10) }) : setNewEquipment({ ...newEquipment, quantity: e.target.value })}
              required
            />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" className="font-bold bg-retro-primary text-white py-3 px-6 rounded shadow-md hover:bg-retro-primary/80 transition-transform duration-200 hover:scale-105">
              {editingEquipment ? '備品を更新' : '備品を追加'}
            </button>
            {editingEquipment && (
              <button type="button" onClick={() => setEditingEquipment(null)} className="font-bold text-retro-secondary/60 py-3 px-6 rounded hover:bg-retro-bg transition">
                キャンセル
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* 備品リストセクション */}
      <motion.div variants={itemVariants} className="p-6 sm:p-8 border-2 border-retro-secondary/20 rounded-lg shadow-lg bg-white/50 backdrop-blur-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h2 className="text-3xl font-serif text-retro-primary">現在の備品</h2>
            <input
                type="text"
                placeholder="備品を検索..."
                className="w-full sm:w-64 p-3 bg-retro-bg/50 border-2 border-retro-secondary/10 rounded focus:border-retro-primary focus:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
        </div>
        
        {loading ? (
            <div className="text-center py-8">読み込み中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b-2 border-retro-secondary/20">
                <tr>
                  <th className="p-4 font-bold">備品名</th>
                  <th className="p-4 font-bold hidden md:table-cell">説明</th>
                  <th className="p-4 font-bold">数量</th>
                  <th className="p-4 font-bold">操作</th>
                </tr>
              </thead>
              <AnimatePresence>
                {filteredEquipment.map((equipment) => (
                  <motion.tr
                    key={equipment.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -10 }}
                    className={`border-b border-retro-secondary/10 ${equipment.quantity < LOW_STOCK_THRESHOLD ? 'bg-retro-primary/10' : ''}`}
                  >
                    <td className="p-4 font-semibold">{equipment.name}</td>
                    <td className="p-4 text-retro-secondary/70 hidden md:table-cell">{equipment.description}</td>
                    <td className={`p-4 font-bold ${equipment.quantity < LOW_STOCK_THRESHOLD ? 'text-retro-primary' : ''}`}>{equipment.quantity}</td>
                    <td className="p-4 flex gap-2">
                      <button onClick={() => handleEditClick(equipment)} className="font-bold text-retro-accent hover:underline">編集</button>
                      <button onClick={() => handleDeleteEquipment(equipment.id)} className="font-bold text-retro-primary/80 hover:underline">削除</button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </table>
            {filteredEquipment.length === 0 && (
                <div className="text-center py-8 text-retro-secondary/50">備品が見つかりません。</div>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default Home;