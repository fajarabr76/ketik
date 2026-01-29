import React, { useState } from 'react';
import { AppSettings, Scenario, ConsumerType, ConsumerDifficulty, ConsumerIdentitySettings } from '../types';
import { DEFAULT_SCENARIOS, DEFAULT_CONSUMER_TYPES } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [activeTab, setActiveTab] = useState<'scenarios' | 'consumers' | 'identity'>('scenarios');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // Scenario Form State
  const [editingScenarioId, setEditingScenarioId] = useState<string | null>(null);
  const [newScenarioCategory, setNewScenarioCategory] = useState('');
  const [isNewCategoryInput, setIsNewCategoryInput] = useState(false);
  const [newScenarioTitle, setNewScenarioTitle] = useState('');
  const [newScenarioDesc, setNewScenarioDesc] = useState('');
  const [newScenarioScript, setNewScenarioScript] = useState('');
  const [newScenarioConsumerType, setNewScenarioConsumerType] = useState('random');
  const [newScenarioImages, setNewScenarioImages] = useState<string[]>([]);

  // Consumer Form State
  const [editingConsumerId, setEditingConsumerId] = useState<string | null>(null);
  const [newConsumerName, setNewConsumerName] = useState('');
  const [newConsumerDesc, setNewConsumerDesc] = useState('');
  const [newConsumerDifficulty, setNewConsumerDifficulty] = useState<ConsumerDifficulty>(ConsumerDifficulty.Random);

  // Identity Form State (Directly manipulating localSettings for simplicity, or we can use separate state)
  const handleIdentityChange = (field: keyof ConsumerIdentitySettings, value: string) => {
    setLocalSettings(prev => ({
        ...prev,
        identitySettings: {
            ...prev.identitySettings!,
            [field]: value
        }
    }));
  };

  if (!isOpen) return null;

  const categories = Array.from(new Set(localSettings.scenarios.map(s => s.category)));

  const handleToggleScenario = (id: string) => {
    setLocalSettings(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s)
    }));
  };

  const handleUpdateScenarioConsumerType = (id: string, typeId: string) => {
    setLocalSettings(prev => ({
      ...prev,
      scenarios: prev.scenarios.map(s => s.id === id ? { ...s, consumerTypeId: typeId } : s)
    }));
  };

  const handleEditScenario = (scenario: Scenario) => {
    setEditingScenarioId(scenario.id);
    setNewScenarioCategory(scenario.category);
    setNewScenarioTitle(scenario.title);
    setNewScenarioDesc(scenario.description);
    setNewScenarioScript(scenario.script || '');
    setNewScenarioConsumerType(scenario.consumerTypeId || 'random');
    setNewScenarioImages(scenario.images || []);
    setIsNewCategoryInput(!categories.includes(scenario.category));
    
    // Scroll form into view
    const formElement = document.getElementById('scenario-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetScenarioForm = () => {
    setEditingScenarioId(null);
    setNewScenarioTitle('');
    setNewScenarioDesc('');
    setNewScenarioScript('');
    setNewScenarioCategory('');
    setNewScenarioConsumerType('random');
    setNewScenarioImages([]);
    setIsNewCategoryInput(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      const MAX_SIZE = 500 * 1024; // 500KB limit per image

      files.forEach(file => {
        if (file.size > MAX_SIZE) {
          alert(`File ${file.name} terlalu besar (>500KB). Mohon kompres gambar terlebih dahulu.`);
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setNewScenarioImages(prev => [...prev, base64String]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setNewScenarioImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveScenario = () => {
    if (!newScenarioTitle || !newScenarioDesc) return;
    const category = isNewCategoryInput ? newScenarioCategory : newScenarioCategory || "Umum";
    
    if (editingScenarioId) {
      setLocalSettings(prev => ({
        ...prev,
        scenarios: prev.scenarios.map(s => 
          s.id === editingScenarioId 
            ? { 
                ...s, 
                category, 
                title: newScenarioTitle, 
                description: newScenarioDesc, 
                script: newScenarioScript,
                consumerTypeId: newScenarioConsumerType,
                images: newScenarioImages
              }
            : s
        )
      }));
    } else {
      const newScenario: Scenario = {
        id: `s-${Date.now()}`,
        category,
        title: newScenarioTitle,
        description: newScenarioDesc,
        script: newScenarioScript,
        isActive: true,
        consumerTypeId: newScenarioConsumerType,
        images: newScenarioImages
      };
      setLocalSettings(prev => ({
        ...prev,
        scenarios: [...prev.scenarios, newScenario]
      }));
    }
    resetScenarioForm();
  };

  const handleEditConsumer = (consumer: ConsumerType) => {
    setEditingConsumerId(consumer.id);
    setNewConsumerName(consumer.name);
    setNewConsumerDesc(consumer.description);
    setNewConsumerDifficulty(consumer.difficulty);
    
    const formElement = document.getElementById('consumer-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const resetConsumerForm = () => {
    setEditingConsumerId(null);
    setNewConsumerName('');
    setNewConsumerDesc('');
    setNewConsumerDifficulty(ConsumerDifficulty.Random);
  };

  const handleSaveConsumer = () => {
    if (!newConsumerName || !newConsumerDesc) return;

    if (editingConsumerId) {
      setLocalSettings(prev => ({
        ...prev,
        consumerTypes: prev.consumerTypes.map(c => 
          c.id === editingConsumerId 
            ? { ...c, name: newConsumerName, description: newConsumerDesc, difficulty: newConsumerDifficulty }
            : c
        )
      }));
    } else {
      const newConsumer: ConsumerType = {
        id: `c-${Date.now()}`,
        name: newConsumerName,
        description: newConsumerDesc,
        difficulty: newConsumerDifficulty,
        isCustom: true
      };
      setLocalSettings(prev => ({
        ...prev,
        consumerTypes: [...prev.consumerTypes, newConsumer]
      }));
    }
    resetConsumerForm();
  };

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleResetDefaults = () => {
      if (window.confirm("Apakah Anda yakin ingin mereset semua pengaturan (skenario & karakteristik) ke awal? Data yang Anda buat akan hilang.")) {
          setLocalSettings({
              scenarios: DEFAULT_SCENARIOS,
              consumerTypes: DEFAULT_CONSUMER_TYPES,
              identitySettings: {
                  displayName: '',
                  signatureName: '',
                  phoneNumber: '',
                  city: ''
              }
          });
      }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-5xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Pengaturan Simulasi</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl">&times;</button>
        </div>

        <div className="flex border-b dark:border-gray-700">
          <button 
            className={`px-6 py-3 transition-colors ${activeTab === 'scenarios' ? 'border-b-2 border-whatsapp-teal text-whatsapp-teal font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('scenarios')}
          >
            Daftar Masalah & Skenario
          </button>
          <button 
            className={`px-6 py-3 transition-colors ${activeTab === 'consumers' ? 'border-b-2 border-whatsapp-teal text-whatsapp-teal font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('consumers')}
          >
            Karakteristik Konsumen
          </button>
          <button 
            className={`px-6 py-3 transition-colors ${activeTab === 'identity' ? 'border-b-2 border-whatsapp-teal text-whatsapp-teal font-bold' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            onClick={() => setActiveTab('identity')}
          >
            Identitas Konsumen
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {activeTab === 'scenarios' && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-700 dark:text-gray-200">Skenario Tersedia</h3>
                  <span className="text-xs text-gray-500">Checklist untuk aktifkan | Klik Nama untuk Edit</span>
                </div>
                
                <div className="border rounded-lg dark:border-gray-700 divide-y dark:divide-gray-700 overflow-hidden">
                  <div className="grid grid-cols-12 gap-4 bg-gray-50 dark:bg-gray-900 p-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                    <div className="col-span-1 flex justify-center items-center">Aktif</div>
                    <div className="col-span-6">Judul & Deskripsi Skenario</div>
                    <div className="col-span-4 text-center">Karakteristik Pelanggan</div>
                    <div className="col-span-1 text-center">Aksi</div>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto divide-y dark:divide-gray-700">
                    {localSettings.scenarios.map(scenario => (
                      <div key={scenario.id} className={`grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors items-center ${editingScenarioId === scenario.id ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-inset ring-yellow-400' : ''}`}>
                        <div className="col-span-1 flex justify-center">
                          <input 
                            type="checkbox" 
                            checked={scenario.isActive} 
                            onChange={() => handleToggleScenario(scenario.id)}
                            className="h-5 w-5 text-whatsapp-teal rounded border-gray-300 focus:ring-whatsapp-teal cursor-pointer"
                          />
                        </div>
                        <div className="col-span-6">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] bg-whatsapp-teal/10 text-whatsapp-teal px-2 py-0.5 rounded font-bold uppercase">
                              {scenario.category}
                            </span>
                            <span className="font-bold text-gray-800 dark:text-gray-100">{scenario.title}</span>
                            {scenario.images && scenario.images.length > 0 && (
                                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">
                                    📷 {scenario.images.length}
                                </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{scenario.description}</p>
                        </div>
                        <div className="col-span-4">
                          <select 
                            value={scenario.consumerTypeId || 'random'}
                            onChange={(e) => handleUpdateScenarioConsumerType(scenario.id, e.target.value)}
                            className="w-full text-xs p-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 shadow-sm focus:border-whatsapp-teal focus:ring-whatsapp-teal"
                          >
                            <option value="random">🎲 Karakteristik Random</option>
                            {localSettings.consumerTypes.map(type => (
                              <option key={type.id} value={type.id}>👤 {type.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <button 
                            onClick={() => handleEditScenario(scenario)}
                            className="p-2 text-gray-500 hover:text-whatsapp-teal transition-colors"
                            title="Edit Skenario"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div id="scenario-form" className={`p-6 rounded-xl border-2 border-dashed transition-colors ${editingScenarioId ? 'bg-yellow-50/50 border-yellow-300 dark:bg-yellow-900/10 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'}`}>
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                  <span className={`p-1 text-white rounded-full text-[10px] ${editingScenarioId ? 'bg-yellow-500' : 'bg-green-500'}`}>
                    {editingScenarioId ? '✎' : '＋'}
                  </span>
                  {editingScenarioId ? 'Edit Skenario Masalah' : 'Tambah Skenario Masalah Baru'}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Kategori</label>
                    {!isNewCategoryInput ? (
                      <select 
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                        value={newScenarioCategory}
                        onChange={(e) => {
                          if (e.target.value === 'NEW') {
                            setIsNewCategoryInput(true);
                            setNewScenarioCategory('');
                          } else {
                            setNewScenarioCategory(e.target.value);
                          }
                        }}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        <option value="NEW">+ Tambah Kategori Lainnya</option>
                      </select>
                    ) : (
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                          placeholder="Nama Kategori Baru"
                          value={newScenarioCategory}
                          onChange={(e) => setNewScenarioCategory(e.target.value)}
                        />
                        <button 
                          onClick={() => setIsNewCategoryInput(false)}
                          className="text-xs text-red-500 font-bold hover:underline"
                        >
                          Batal
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Karakteristik Bawaan</label>
                    <select 
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                      value={newScenarioConsumerType}
                      onChange={(e) => setNewScenarioConsumerType(e.target.value)}
                    >
                      <option value="random">Karakteristik Random (Default)</option>
                      {localSettings.consumerTypes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Judul Masalah</label>
                    <input 
                      type="text"
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                      placeholder="Contoh: Gagal Transfer Antar Bank"
                      value={newScenarioTitle}
                      onChange={(e) => setNewScenarioTitle(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Deskripsi Masalah</label>
                    <textarea 
                      className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                      rows={2}
                      placeholder="Jelaskan detail masalah yang akan dihadapi agen..."
                      value={newScenarioDesc}
                      onChange={(e) => setNewScenarioDesc(e.target.value)}
                    />
                  </div>
                  
                  {/* Script Section */}
                  <div className="col-span-2">
                     <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">
                        Skrip Percakapan (Opsional)
                     </label>
                     <textarea 
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                        rows={4}
                        placeholder="Tuliskan contoh dialog atau poin-poin penting yang harus disampaikan konsumen. AI akan menggunakan ini sebagai referensi alur, bukan dibaca kaku."
                        value={newScenarioScript}
                        onChange={(e) => setNewScenarioScript(e.target.value)}
                     />
                     <p className="text-[10px] text-gray-400 mt-1">
                        Skrip ini berfungsi sebagai panduan alur. AI akan mengimprovisasi gaya bicaranya sesuai karakteristik konsumen.
                     </p>
                  </div>

                  {/* Image Upload Section */}
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Lampiran Gambar (Bukti Masalah)</label>
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                accept="image/*" 
                                multiple
                                onChange={handleImageUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-whatsapp-teal/10 file:text-whatsapp-teal hover:file:bg-whatsapp-teal/20"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">Maksimal 500KB per gambar untuk menjaga performa aplikasi.</p>
                        
                        {newScenarioImages.length > 0 && (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-2">
                                {newScenarioImages.map((img, idx) => (
                                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border dark:border-gray-600 bg-gray-100">
                                        <img src={img} alt={`Lampiran ${idx}`} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Hapus gambar"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </button>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 text-center truncate">
                                            [IMG: {idx}]
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end gap-2 mt-2">
                    {editingScenarioId && (
                      <button 
                        onClick={resetScenarioForm}
                        className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        Batal Edit
                      </button>
                    )}
                    <button 
                      onClick={handleSaveScenario}
                      disabled={!newScenarioTitle || !newScenarioDesc || (!newScenarioCategory && !isNewCategoryInput)}
                      className={`${editingScenarioId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-whatsapp-teal hover:bg-opacity-90'} text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50`}
                    >
                      {editingScenarioId ? 'Perbarui Skenario' : 'Simpan Skenario Baru'}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'consumers' && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg flex gap-3 items-start border border-blue-100 dark:border-blue-800">
                <span className="text-xl">💡</span>
                <p className="text-sm text-blue-800 dark:text-blue-100">
                  <strong>Penting:</strong> Klik tombol pensil pada kartu karakteristik untuk mengubah perilaku konsumen yang sudah ada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {localSettings.consumerTypes.map(c => (
                  <div key={c.id} className={`border dark:border-gray-700 p-4 rounded-xl shadow-sm group hover:border-whatsapp-teal transition-all relative ${editingConsumerId === c.id ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-1 ring-yellow-400' : 'bg-white dark:bg-gray-800'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2 pr-8">
                        <span className="w-2 h-2 rounded-full bg-whatsapp-teal"></span>
                        {c.name}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                          c.difficulty === ConsumerDifficulty.Easy ? 'bg-green-100 text-green-700' :
                          c.difficulty === ConsumerDifficulty.Medium ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {c.difficulty}
                        </span>
                        <button 
                          onClick={() => handleEditConsumer(c)}
                          className="text-gray-400 hover:text-whatsapp-teal transition-colors"
                          title="Edit Karakteristik"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{c.description}</p>
                  </div>
                ))}
              </div>

              <div id="consumer-form" className={`border-t pt-6 dark:border-gray-700 transition-colors p-6 rounded-xl border-2 border-dashed ${editingConsumerId ? 'bg-yellow-50/50 border-yellow-300 dark:bg-yellow-900/10 dark:border-yellow-700' : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'}`}>
                 <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span className={`p-1 text-white rounded-full text-[10px] ${editingConsumerId ? 'bg-yellow-500' : 'bg-green-500'}`}>
                      {editingConsumerId ? '✎' : '＋'}
                    </span>
                    {editingConsumerId ? 'Edit Karakteristik Konsumen' : 'Tambah Karakteristik Baru'}
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Nama Tipe/Karakter</label>
                      <input 
                        type="text"
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                        placeholder="Contoh: Konsumen Lansia"
                        value={newConsumerName}
                        onChange={(e) => setNewConsumerName(e.target.value)}
                      />
                    </div>
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Tingkat Kesulitan (Gaya Bahasa)</label>
                      <select 
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                        value={newConsumerDifficulty}
                        onChange={(e) => setNewConsumerDifficulty(e.target.value as ConsumerDifficulty)}
                      >
                        <option value={ConsumerDifficulty.Easy}>Mudah (Sopan & Jelas)</option>
                        <option value={ConsumerDifficulty.Medium}>Sedang (Sedikit Emosional)</option>
                        <option value={ConsumerDifficulty.Hard}>Sulit (Marah/Kritis/Gaptek)</option>
                        <option value={ConsumerDifficulty.Random}>Random</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1">Deskripsi Perilaku (System Prompt AI)</label>
                      <textarea 
                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-800 shadow-sm p-2.5 text-sm dark:text-white"
                        rows={3}
                        placeholder="Jelaskan bagaimana AI harus berperilaku (gaya bicara, tingkat kesabaran, singkatan yang sering dipakai, dll)..."
                        value={newConsumerDesc}
                        onChange={(e) => setNewConsumerDesc(e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex justify-end gap-2">
                      {editingConsumerId && (
                        <button 
                          onClick={resetConsumerForm}
                          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-bold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Batal
                        </button>
                      )}
                      <button 
                        onClick={handleSaveConsumer}
                        disabled={!newConsumerName || !newConsumerDesc}
                        className={`${editingConsumerId ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-whatsapp-teal hover:bg-opacity-90'} text-white px-8 py-2.5 rounded-lg font-bold shadow-md transition-all active:scale-95 disabled:opacity-50`}
                      >
                        {editingConsumerId ? 'Perbarui Karakter' : 'Simpan Karakteristik'}
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
             <div className="space-y-6">
                <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-lg flex gap-3 items-start border border-green-100 dark:border-green-800">
                    <span className="text-xl">👤</span>
                    <p className="text-sm text-green-800 dark:text-green-100">
                        <strong>Atur Identitas Konsumen:</strong> Anda bisa menentukan nama dan detail konsumen secara spesifik. Jika dikosongkan, sistem akan menggunakan data acak (dummy).
                    </p>
                </div>

                <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Detail Identitas Konsumen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Nama Pengirim (Display Name)
                            </label>
                            <input 
                                type="text"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm p-3 text-sm dark:text-white focus:ring-whatsapp-teal focus:border-whatsapp-teal"
                                placeholder="Contoh: Agus Setiawan"
                                value={localSettings.identitySettings?.displayName || ''}
                                onChange={(e) => handleIdentityChange('displayName', e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Nama yang muncul di header pesan/profil WhatsApp.</p>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Nama Panggilan (Di dalam chat)
                            </label>
                            <input 
                                type="text"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm p-3 text-sm dark:text-white focus:ring-whatsapp-teal focus:border-whatsapp-teal"
                                placeholder="Contoh: Agus"
                                value={localSettings.identitySettings?.signatureName || ''}
                                onChange={(e) => handleIdentityChange('signatureName', e.target.value)}
                            />
                            <p className="text-[10px] text-gray-400 mt-1">Nama singkat yang akan digunakan konsumen saat memperkenalkan diri.</p>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Nomor Telepon
                            </label>
                            <input 
                                type="text"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm p-3 text-sm dark:text-white focus:ring-whatsapp-teal focus:border-whatsapp-teal"
                                placeholder="Contoh: 081234567890"
                                value={localSettings.identitySettings?.phoneNumber || ''}
                                onChange={(e) => handleIdentityChange('phoneNumber', e.target.value)}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">
                                Kota / Kabupaten
                            </label>
                            <input 
                                type="text"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-900 shadow-sm p-3 text-sm dark:text-white focus:ring-whatsapp-teal focus:border-whatsapp-teal"
                                placeholder="Contoh: Jakarta Selatan"
                                value={localSettings.identitySettings?.city || ''}
                                onChange={(e) => handleIdentityChange('city', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
             </div>
          )}
        </div>

        <div className="p-4 border-t dark:border-gray-700 flex justify-between gap-3 bg-gray-50 dark:bg-gray-900/30">
          <button
              onClick={handleResetDefaults}
              className="px-4 py-2.5 text-red-500 text-sm font-bold hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
              Reset ke Default
          </button>
          <div className="flex gap-3">
              <button 
                onClick={onClose} 
                className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
              <button 
                onClick={handleSave} 
                className="px-8 py-2.5 bg-whatsapp-teal text-white rounded-lg font-bold hover:bg-opacity-90 shadow-lg transition-all active:scale-95"
              >
                Terapkan Perubahan
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};