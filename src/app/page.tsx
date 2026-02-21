"use client";

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Package, 
  AlertTriangle, 
  Search, 
  Plus, 
  Minus,
  Edit2, 
  Trash2, 
  LayoutGrid, 
  List as ListIcon, 
  X, 
  Save,
  Archive,
  Lock,
  Unlock
} from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  requiredQuantity: number;
  createdAt: string;
  updatedAt: string;
}

const Home: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [newEquipment, setNewEquipment] = useState({ name: '', description: '', quantity: '' as string | number, requiredQuantity: '' as string | number });
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // Admin Authentication State
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    // Check for saved password in localStorage
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
      setAdminPassword(savedPassword);
      setIsAdmin(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword) {
      localStorage.setItem('adminPassword', adminPassword);
      setIsAdmin(true);
      setShowLoginModal(false);
      toast.success('編集モードになりました');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminPassword');
    setAdminPassword('');
    setIsAdmin(false);
    setIsFormOpen(false);
    toast.success('閲覧モードに戻りました');
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('備品データの取得に失敗しました');
      const data: Equipment[] = await res.json();
      setEquipmentList(data);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const filteredEquipment = useMemo(() => {
    return equipmentList.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [equipmentList, searchQuery]);

  // Statistics
  const totalItems = useMemo(() => equipmentList.length, [equipmentList]);
  const lowStockCount = useMemo(() => equipmentList.filter(e => e.quantity < e.requiredQuantity).length, [equipmentList]);

  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    const promise = fetch('/api/products', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({
        ...newEquipment,
        quantity: parseInt(newEquipment.quantity as string, 10),
        requiredQuantity: parseInt(newEquipment.requiredQuantity as string, 10) || 0
      }),
    }).then(async res => {
      if (!res.ok) {
        if (res.status === 401) throw new Error('パスワードが正しくありません');
        throw new Error('備品の追加に失敗しました');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '棚にしまっています...',
      success: () => {
        setNewEquipment({ name: '', description: '', quantity: '', requiredQuantity: '' });
        fetchEquipment();
        setIsFormOpen(false);
        return '棚に新しい備品を追加しました！';
      },
      error: (err) => `エラー: ${err.message}`,
    });
  };

  const handleUpdateEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEquipment) return;

    const promise = fetch(`/api/products/${editingEquipment.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword
      },
      body: JSON.stringify({
        ...editingEquipment,
        quantity: parseInt(editingEquipment.quantity as unknown as string, 10),
        requiredQuantity: parseInt(editingEquipment.requiredQuantity as unknown as string, 10)
      }),
    }).then(async res => {
      if (!res.ok) {
        if (res.status === 401) throw new Error('パスワードが正しくありません');
        throw new Error('備品の更新に失敗しました');
      }
      return res.json();
    });

    toast.promise(promise, {
      loading: '備品を整理中...',
      success: () => {
        setEditingEquipment(null);
        fetchEquipment();
        setIsFormOpen(false);
        return '備品の情報が更新されました！';
      },
      error: (err) => `エラー: ${err.message}`,
    });
  };

  const handleDeleteEquipment = (id: string) => {
    if(!confirm('本当に削除しますか？')) return;
    const promise = fetch(`/api/products/${id}`, { 
      method: 'DELETE',
      headers: { 'x-admin-password': adminPassword }
    }).then(res => {
      if (!res.ok) {
        if (res.status === 401) throw new Error('パスワードが正しくありません');
        throw new Error('削除に失敗しました');
      }
      return res;
    });

    toast.promise(promise, {
      loading: '棚から取り出しています...',
      success: () => {
        fetchEquipment();
        return '備品を削除しました！';
      },
      error: (err) => `エラー: ${err.message}`,
    });
  };
  
  const handleEditClick = (equipment: Equipment) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    setEditingEquipment(equipment);
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleQuickQuantityChange = async (equipment: Equipment, delta: number) => {
    if (!isAdmin) {
      setShowLoginModal(true);
      return;
    }
    const newQuantity = Math.max(0, equipment.quantity + delta);
    if (newQuantity === equipment.quantity) return;

    // Optimistic update
    setEquipmentList(prev => prev.map(e => e.id === equipment.id ? { ...e, quantity: newQuantity } : e));

    try {
      const res = await fetch(`/api/products/${equipment.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (!res.ok) throw new Error('更新に失敗しました');
      
      const updated = await res.json();
      // Ensure state is synced with server
      setEquipmentList(prev => prev.map(e => e.id === equipment.id ? updated : e));
    } catch (err) {
      // Revert optimistic update on error
      fetchEquipment();
      toast.error('数量の更新に失敗しました');
    }
  };
  
  // --- アニメーション設定 ---
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { type: 'spring', stiffness: 200, damping: 20 } 
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-retro-bg font-sans pb-20">
      <div className="container mx-auto p-4 sm:p-8 max-w-7xl">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-5xl font-serif text-retro-secondary mb-2">
              備品管理
            </h1>
            <p className="text-retro-secondary/60 flex items-center justify-center md:justify-start gap-2">
              <Archive className="w-4 h-4" /> 備品保管庫マネージャー
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-4">
            {/* Admin Status / Login Button */}
            <button 
              onClick={() => isAdmin ? handleLogout() : setShowLoginModal(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${
                isAdmin 
                ? 'bg-retro-accent/10 border-retro-accent/20 text-retro-accent hover:bg-retro-accent/20' 
                : 'bg-white border-retro-secondary/10 text-retro-secondary/60 hover:bg-retro-secondary/5'
              }`}
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {isAdmin ? '管理者（ログアウト）' : '管理者ログイン'}
            </button>

             {/* Stats Cards */}
            <div className="bg-white p-4 rounded-xl shadow-sm border-2 border-retro-secondary/5 flex items-center gap-3 min-w-[140px]">
               <div className="p-2 bg-retro-accent/20 rounded-lg text-retro-accent">
                 <Package className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-xs text-retro-secondary/60 font-bold">総アイテム</div>
                 <div className="text-2xl font-serif text-retro-secondary">{totalItems}</div>
               </div>
            </div>
            
            <div className={`bg-white p-4 rounded-xl shadow-sm border-2 flex items-center gap-3 min-w-[140px] ${lowStockCount > 0 ? 'border-retro-primary/20 bg-red-50' : 'border-retro-secondary/5'}`}>
               <div className={`p-2 rounded-lg ${lowStockCount > 0 ? 'bg-retro-primary/20 text-retro-primary' : 'bg-gray-100 text-gray-400'}`}>
                 <AlertTriangle className="w-6 h-6" />
               </div>
               <div>
                 <div className="text-xs text-retro-secondary/60 font-bold">在庫不足</div>
                 <div className={`text-2xl font-serif ${lowStockCount > 0 ? 'text-retro-primary' : 'text-retro-secondary'}`}>{lowStockCount}</div>
               </div>
            </div>
          </div>
        </header>

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 sticky top-4 z-20 bg-retro-bg/90 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-retro-secondary/5">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-retro-secondary/40 w-5 h-5 group-focus-within:text-retro-primary transition-colors" />
            <input
              type="text"
              placeholder="備品を検索..."
              className="w-full pl-10 pr-4 py-3 bg-white border-2 border-retro-secondary/10 rounded-xl focus:border-retro-primary focus:outline-none transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
             <button 
               onClick={() => {
                 if (!isAdmin) {
                   setShowLoginModal(true);
                   return;
                 }
                 setIsFormOpen(!isFormOpen);
               }}
               className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold shadow-md transition-all active:scale-95 w-full sm:w-auto justify-center ${
                 isFormOpen ? 'bg-retro-secondary text-white' : 'bg-retro-primary text-white hover:bg-retro-primary/90'
               }`}
             >
               {isFormOpen ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
               {isFormOpen ? '閉じる' : (isAdmin ? '追加する' : 'ログインして追加')}
             </button>
             
             <div className="flex bg-white p-1 rounded-xl border-2 border-retro-secondary/10 ml-auto sm:ml-2">
               <button 
                 onClick={() => setViewMode('grid')}
                 className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-retro-secondary/10 text-retro-secondary' : 'text-retro-secondary/40 hover:text-retro-secondary'}`}
               >
                 <LayoutGrid className="w-5 h-5" />
               </button>
               <button 
                 onClick={() => setViewMode('list')}
                 className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-retro-secondary/10 text-retro-secondary' : 'text-retro-secondary/40 hover:text-retro-secondary'}`}
               >
                 <ListIcon className="w-5 h-5" />
               </button>
             </div>
          </div>
        </div>

        {/* Add/Edit Form (Collapsible) */}
        <AnimatePresence>
          {isFormOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginBottom: 0 }}
              animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
              exit={{ height: 0, opacity: 0, marginBottom: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg border-2 border-retro-secondary/5">
                <h2 className="text-xl font-bold text-retro-secondary mb-6 flex items-center gap-2">
                  {editingEquipment ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingEquipment ? '備品情報を編集' : '新しい備品を登録'}
                </h2>
                <form onSubmit={editingEquipment ? handleUpdateEquipment : handleAddEquipment} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-retro-secondary/60 mb-1 uppercase tracking-wider">備品名</label>
                      <input
                        type="text"
                        placeholder="例: バスケットボール"
                        className="w-full p-3 bg-retro-bg/30 border-2 border-retro-secondary/10 rounded-lg focus:border-retro-primary focus:ring-0 transition-colors"
                        value={editingEquipment ? editingEquipment.name : newEquipment.name}
                        onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, name: e.target.value }) : setNewEquipment({ ...newEquipment, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-retro-secondary/60 mb-1 uppercase tracking-wider">現在数</label>
                       <input
                        type="number"
                        placeholder="0"
                        className="w-full p-3 bg-retro-bg/30 border-2 border-retro-secondary/10 rounded-lg focus:border-retro-primary focus:ring-0 transition-colors font-mono"
                        value={editingEquipment ? editingEquipment.quantity : newEquipment.quantity}
                        onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, quantity: parseInt(e.target.value, 10) }) : setNewEquipment({ ...newEquipment, quantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-retro-secondary/60 mb-1 uppercase tracking-wider">要求数</label>
                       <input
                        type="number"
                        placeholder="0"
                        className="w-full p-3 bg-retro-bg/30 border-2 border-retro-secondary/10 rounded-lg focus:border-retro-primary focus:ring-0 transition-colors font-mono"
                        value={editingEquipment ? editingEquipment.requiredQuantity : newEquipment.requiredQuantity}
                        onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, requiredQuantity: parseInt(e.target.value, 10) }) : setNewEquipment({ ...newEquipment, requiredQuantity: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-4">
                      <label className="block text-xs font-bold text-retro-secondary/60 mb-1 uppercase tracking-wider">説明</label>
                      <input
                        type="text"
                        placeholder="詳細や保管場所など"
                        className="w-full p-3 bg-retro-bg/30 border-2 border-retro-secondary/10 rounded-lg focus:border-retro-primary focus:ring-0 transition-colors"
                        value={editingEquipment ? editingEquipment.description || '' : newEquipment.description || ''}
                        onChange={(e) => editingEquipment ? setEditingEquipment({ ...editingEquipment, description: e.target.value }) : setNewEquipment({ ...newEquipment, description: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {editingEquipment && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingEquipment(null); setIsFormOpen(false); }} 
                        className="px-6 py-3 rounded-lg font-bold text-retro-secondary/60 hover:bg-retro-bg transition-colors"
                      >
                        キャンセル
                      </button>
                    )}
                    <button 
                      type="submit" 
                      className="flex items-center gap-2 px-8 py-3 rounded-lg font-bold bg-retro-secondary text-white shadow-lg hover:bg-retro-secondary/90 transition-all active:scale-95"
                    >
                      <Save className="w-4 h-4" />
                      {editingEquipment ? '更新を保存' : '棚に追加'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-50">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-retro-primary mb-4"></div>
             <p className="font-serif text-xl text-retro-secondary">棚を整理しています...</p>
          </div>
        ) : (
          <motion.div 
            layout
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            transition={{ 
              layout: { type: 'spring', stiffness: 200, damping: 25, mass: 0.5 } 
            }}
            className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "flex flex-col gap-3"}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {filteredEquipment.map((equipment) => {
                const isLowStock = equipment.quantity < equipment.requiredQuantity;

                if (viewMode === 'list') {
                  return (
                    <motion.div
                      key={equipment.id}
                      layoutId={`card-${equipment.id}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ 
                        layout: { type: 'spring', stiffness: 200, damping: 25, mass: 0.5 } 
                      }}
                      className={`group flex items-center justify-between p-4 bg-white border-l-4 rounded-r-xl shadow-sm hover:shadow-md transition-all overflow-hidden ${isLowStock ? 'border-retro-primary' : 'border-retro-accent'}`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div layout="position" className="flex items-center bg-retro-bg/50 rounded-lg p-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleQuickQuantityChange(equipment, -1); }}
                            className="p-1 hover:text-retro-primary transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <div className={`w-12 h-8 flex items-center justify-center font-bold text-sm ${isLowStock ? 'text-retro-primary' : 'text-retro-accent'}`}>
                             {equipment.quantity}<span className="text-[10px] mx-0.5 opacity-40">/</span>{equipment.requiredQuantity}
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleQuickQuantityChange(equipment, 1); }}
                            className="p-1 hover:text-retro-accent transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </motion.div>
                        <div>
                          <motion.h3 layout="position" className="font-bold text-retro-secondary">{equipment.name}</motion.h3>
                          {equipment.description && <motion.p layout="position" className="text-sm text-retro-secondary/50">{equipment.description}</motion.p>}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => handleEditClick(equipment)} className="p-2 text-retro-secondary/60 hover:text-retro-primary hover:bg-retro-primary/10 rounded-full transition-colors">
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button onClick={() => handleDeleteEquipment(equipment.id)} className="p-2 text-retro-secondary/60 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                           <Trash2 className="w-4 h-4" />
                         </button>
                      </div>
                    </motion.div>
                  )
                }

                // Grid View Card
                return (
                  <div
                    key={equipment.id}
                    className="relative group h-full"
                  >
                    {/* Shelf Shadow Base */}
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute top-2 left-2 w-full h-full bg-retro-secondary/5 rounded-2xl -z-10 transition-transform group-hover:translate-x-1 group-hover:translate-y-1 duration-300"
                    ></motion.div>

                    <motion.div 
                      layoutId={`card-${equipment.id}`}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={{ 
                        layout: { type: 'spring', stiffness: 200, damping: 25, mass: 0.5 } 
                      }}
                      className={`relative flex flex-col h-full bg-white p-6 rounded-2xl border-2 transition-all duration-300 group-hover:-translate-y-1 overflow-hidden ${
                        isLowStock ? 'border-retro-primary/20 shadow-[0_0_20px_rgba(224,122,95,0.1)]' : 'border-retro-secondary/5 shadow-sm'
                      }`}
                    >
                      
                      {/* Quantity Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <motion.div 
                          layout="position"
                          className={`flex flex-col items-center justify-center min-w-[4rem] py-1 px-2 rounded-xl font-bold text-sm border-2 ${
                            isLowStock ? 'bg-retro-primary/10 text-retro-primary border-retro-primary/20 animate-pulse' : 'bg-retro-accent/10 text-retro-accent border-retro-accent/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 mb-1">
                             <button 
                              onClick={(e) => { e.stopPropagation(); handleQuickQuantityChange(equipment, -1); }}
                              className="hover:scale-125 transition-transform"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                             <div className="text-xl leading-none">{equipment.quantity}</div>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleQuickQuantityChange(equipment, 1); }}
                               className="hover:scale-125 transition-transform"
                             >
                               <Plus className="w-3 h-3" />
                             </button>
                          </div>
                          <div className="text-[10px] opacity-60 border-t border-current w-full text-center pt-1">要求数: {equipment.requiredQuantity}</div>
                        </motion.div>
                        {isLowStock && (
                          <motion.div layout="position" className="text-retro-primary" title="在庫が不足しています">
                            <AlertTriangle className="w-5 h-5" />
                          </motion.div>
                        )}
                      </div>

                      <div className="mb-6 flex-grow">
                        <motion.h3 layout="position" className="text-xl font-bold text-retro-secondary mb-2 leading-tight">
                          {equipment.name}
                        </motion.h3>
                        <motion.p layout="position" className="text-sm text-retro-secondary/60 line-clamp-3 leading-relaxed">
                          {equipment.description || '説明はありません。'}
                        </motion.p>
                      </div>

                      {/* Actions */}
                      <motion.div layout="position" className="flex gap-2 pt-4 border-t border-retro-secondary/5">
                        <button 
                          onClick={() => handleEditClick(equipment)} 
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold text-retro-secondary/70 hover:bg-retro-secondary/5 hover:text-retro-secondary transition-colors"
                        >
                          <Edit2 className="w-4 h-4" /> 編集
                        </button>
                        <button 
                          onClick={() => handleDeleteEquipment(equipment.id)} 
                          className="flex items-center justify-center p-2 rounded-lg text-retro-secondary/40 hover:bg-red-50 hover:text-red-500 transition-colors"
                          title="削除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    </motion.div>
                  </div>
                );
              })}
            </AnimatePresence>
            
            {!loading && filteredEquipment.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="col-span-full py-20 flex flex-col items-center justify-center text-retro-secondary/40"
              >
                <Package className="w-16 h-16 mb-4 opacity-20" />
                <p className="font-serif text-xl">備品が見つかりませんでした</p>
                <p className="text-sm mt-2">別のキーワードで検索するか、新しい備品を追加してください。</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-retro-secondary/40 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl border-2 border-retro-secondary/5"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-serif text-retro-secondary flex items-center gap-2">
                    <Lock className="w-6 h-6 text-retro-primary" /> 管理者ログイン
                  </h2>
                  <button onClick={() => setShowLoginModal(false)} className="text-retro-secondary/40 hover:text-retro-secondary">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <p className="text-retro-secondary/60 mb-8 text-sm">
                  備品の追加・編集・削除を行うには管理者パスワードを入力してください。
                </p>

                <form onSubmit={handleLogin} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-retro-secondary/60 mb-2 uppercase tracking-wider">パスワード</label>
                    <input
                      type="password"
                      autoFocus
                      placeholder="パスワードを入力..."
                      className="w-full p-4 bg-retro-bg/30 border-2 border-retro-secondary/10 rounded-xl focus:border-retro-primary focus:outline-none transition-all"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-4 bg-retro-secondary text-white rounded-xl font-bold shadow-lg hover:bg-retro-secondary/90 transition-all active:scale-[0.98]"
                  >
                    認証する
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Home;