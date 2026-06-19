import React, { useState } from 'react';
import { Search, UserPlus, X, User, Check, ScanLine, Smartphone, Mail, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

// Mock initial data (since we don't have a robust Customer store yet)
const MOCK_CUSTOMERS: Customer[] = [
  { id: 'c-1', name: 'John Doe', phone: '08012345678', email: 'john@example.com' },
  { id: 'c-2', name: 'Jane Smith', phone: '08123456789', email: 'jane@example.com' },
  { id: 'c-3', name: 'Samuel Adams', phone: '07098765432' },
];

interface CustomerSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  selectedCustomerId?: string;
  onSkip?: () => void;
}

export function CustomerSelectorModal({ isOpen, onClose, onSelectCustomer, selectedCustomerId, onSkip }: CustomerSelectorModalProps) {
  const [activeTab, setActiveTab] = useState<'search' | 'new' | 'nfc' | 'qr'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Customer Form State
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Scanning State
  const [isScanning, setIsScanning] = useState(false);

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.phone.includes(searchQuery)
  );

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    
    const newCustomer = {
      id: `c-${Date.now()}`,
      name: newName,
      phone: newPhone,
      email: newEmail || undefined
    };
    
    onSelectCustomer(newCustomer);
    onClose();
  };

  const simulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      onSelectCustomer(MOCK_CUSTOMERS[0]); // Simulate finding John Doe via scan
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-gray-900">Attach Customer</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">Capture details before checkout</p>
          </div>
          <div className="flex items-center gap-3">
            {onSkip && (
              <button 
                onClick={onSkip}
                className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
              >
                Skip / Walk-in
              </button>
            )}
            <button onClick={onClose} className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex border-b border-gray-100 px-6 shrink-0 gap-6">
          <button 
            onClick={() => setActiveTab('search')}
            className={cn("py-4 text-[11px] font-black uppercase tracking-widest transition-colors relative", activeTab === 'search' ? 'text-[#066CF4]' : 'text-gray-400 hover:text-gray-600')}
          >
            Search
            {activeTab === 'search' && <motion.div layoutId="tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#066CF4]" />}
          </button>
          <button 
            onClick={() => setActiveTab('new')}
            className={cn("py-4 text-[11px] font-black uppercase tracking-widest transition-colors relative", activeTab === 'new' ? 'text-[#066CF4]' : 'text-gray-400 hover:text-gray-600')}
          >
            Add New
            {activeTab === 'new' && <motion.div layoutId="tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#066CF4]" />}
          </button>
          <button 
            onClick={() => setActiveTab('nfc')}
            className={cn("py-4 text-[11px] font-black uppercase tracking-widest transition-colors relative", activeTab === 'nfc' ? 'text-[#066CF4]' : 'text-gray-400 hover:text-gray-600')}
          >
            NFC / QR
            {activeTab === 'nfc' && <motion.div layoutId="tab" className="absolute bottom-0 inset-x-0 h-0.5 bg-[#066CF4]" />}
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by name or phone..." 
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                />
              </div>

              <div className="space-y-2 mt-4">
                {filteredCustomers.map(customer => {
                  const isSelected = selectedCustomerId === customer.id;
                  return (
                    <div 
                      key={customer.id}
                      onClick={() => {
                        onSelectCustomer(customer);
                        onClose();
                      }}
                      className={cn(
                        "flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border",
                        isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-100 hover:border-[#066CF4]/30 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("size-10 rounded-full flex items-center justify-center", isSelected ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500")}>
                          <User size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900">{customer.name}</p>
                          <p className="text-[10px] font-bold text-gray-500 mt-0.5">{customer.phone}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="text-blue-600" size={18} />}
                    </div>
                  );
                })}
                {filteredCustomers.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm font-bold text-gray-400 mb-4">No customers found</p>
                    <button onClick={() => setActiveTab('new')} className="text-[#066CF4] text-[11px] font-black uppercase tracking-widest hover:underline">
                      Create New Customer instead
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'new' && (
            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="e.g. John Doe" 
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Phone Number</label>
                <div className="relative">
                  <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="tel" 
                    required
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="e.g. 08012345678" 
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Email Address (Optional)</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email" 
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g. john@example.com" 
                    className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 text-sm font-bold placeholder:font-medium focus:outline-none focus:border-[#066CF4] focus:ring-2 focus:ring-[#066CF4]/10"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full h-12 mt-4 bg-[#066CF4] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-600 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus size={16} />
                Save & Attach Customer
              </button>
            </form>
          )}

          {activeTab === 'nfc' && (
            <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
              <div className="relative">
                {isScanning && (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute inset-0 bg-[#066CF4] rounded-full"
                  />
                )}
                <div className={cn("size-24 rounded-full flex items-center justify-center relative z-10 transition-colors", isScanning ? "bg-[#066CF4] text-white" : "bg-gray-100 text-gray-400")}>
                  {isScanning ? <CreditCard size={32} /> : <ScanLine size={32} />}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{isScanning ? 'Scanning...' : 'Ready to Scan'}</h3>
                <p className="text-sm font-medium text-gray-500 max-w-[250px] mx-auto">
                  {isScanning ? 'Hold NFC card or QR code near the device...' : 'Tap customer NFC card or scan their profile QR code to instantly capture details.'}
                </p>
              </div>

              <button 
                onClick={simulateScan}
                disabled={isScanning}
                className={cn("h-12 px-8 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all", isScanning ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-900 text-white hover:bg-gray-800 active:scale-95")}
              >
                Simulate Scan
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
