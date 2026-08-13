import React, { useState } from 'react';
import { 
  Search, MapPin, Truck, Calendar, Clock, AlertCircle, ArrowRight, User, 
  UserCheck, Package, CreditCard, Copy, Check, ShieldCheck, Globe, 
  Box, Zap, Navigation, ChevronDown, RefreshCw, Share2, Building2, Calculator,
  CheckCircle2, AlertTriangle, ArrowUpRight, Headphones, Send, Sparkles, Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Shipment, ShipmentStatus } from '../types';
import { cn } from '../lib/utils';

export default function PublicTracking() {
  const [activeTab, setActiveTab] = useState<'track' | 'rate' | 'pincode' | 'partner'>('track');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);

  // Rate calculator state
  const [originPincode, setOriginPincode] = useState('110001');
  const [destPincode, setDestPincode] = useState('400001');
  const [weight, setWeight] = useState('1.5');
  const [rateResult, setRateResult] = useState<{ base: number; fuel: number; gst: number; total: number; estDays: string } | null>(null);

  // Pincode serviceability state
  const [checkPincode, setCheckPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<{
    code: string;
    city: string;
    state: string;
    express: boolean;
    cod: boolean;
    reversePickup: boolean;
    heavyFreight: boolean;
  } | null>(null);

  // Partner form state
  const [partnerType, setPartnerType] = useState('SME Merchant');
  const [partnerSubmitted, setPartnerSubmitted] = useState(false);

  const sampleTrackings = ['SP-100234', 'IND-882190', 'DL-402911'];

  const handleSearch = async (e?: React.FormEvent, customId?: string) => {
    e?.preventDefault();
    const idToSearch = (customId || trackingNumber).trim();
    if (!idToSearch) return;

    if (customId) {
      setTrackingNumber(customId);
    }

    setLoading(true);
    setError(null);
    setShipment(null);

    try {
      const docRef = doc(db, 'shipments', idToSearch);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setShipment({ id: docSnap.id, ...docSnap.data() } as Shipment);
      } else {
        setError(`No shipment record found for AWB / Waybill ID "${idToSearch}". Please verify the tracking number.`);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'shipments/' + idToSearch);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRate = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(weight) || 1;
    const base = Math.round(w * 85 + 120);
    const fuel = Math.round(base * 0.15);
    const gst = Math.round((base + fuel) * 0.18);
    const total = base + fuel + gst;
    
    setRateResult({
      base,
      fuel,
      gst,
      total,
      estDays: w > 5 ? '3 - 4 Business Days' : '1 - 2 Business Days'
    });
  };

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPincode || checkPincode.length < 6) return;

    // Simulated pin code database response
    const lastDigit = parseInt(checkPincode.slice(-1)) || 0;
    setPincodeResult({
      code: checkPincode,
      city: lastDigit % 2 === 0 ? 'Delhi NCR Hub' : 'Mumbai Metro Zone',
      state: lastDigit % 2 === 0 ? 'Delhi' : 'Maharashtra',
      express: true,
      cod: true,
      reversePickup: true,
      heavyFreight: lastDigit > 2
    });
  };

  const handleCopyLink = () => {
    if (!shipment) return;
    navigator.clipboard.writeText(window.location.origin + '/?tracking=' + shipment.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status: ShipmentStatus) => {
    switch (status) {
      case 'Delivered':
        return { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' };
      case 'In Transit':
        return { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', dot: 'bg-blue-500' };
      case 'Out for Delivery':
        return { color: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-500' };
      case 'Delayed':
        return { color: 'bg-rose-500/10 text-rose-400 border-rose-500/30', dot: 'bg-rose-500' };
      case 'In Warehouse':
        return { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' };
      default:
        return { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', dot: 'bg-zinc-500' };
    }
  };

  const getStepProgress = (status: ShipmentStatus) => {
    switch (status) {
      case 'Pending': return 0;
      case 'In Warehouse': return 1;
      case 'In Transit': return 2;
      case 'Out for Delivery': return 3;
      case 'Delivered': return 4;
      default: return 2;
    }
  };

  const currentStep = shipment ? getStepProgress(shipment.status) : 0;

  const faqs = [
    {
      q: 'How do I track my Delhivery shipment using AWB Number?',
      a: 'Enter your 12-digit Waybill / AWB Number or Order ID in the track input box above. You will see real-time package scan updates, current sorting hub, and estimated delivery schedule.'
    },
    {
      q: 'What is Delhivery Express Parcel vs Partial Truckload (PTL)?',
      a: 'Express Parcel caters to door-to-door B2C and C2C individual packages under 50kg with cash-on-delivery options. PTL (Partial Truckload) is designed for bulk commercial B2B freight with palletized cargo.'
    },
    {
      q: 'How can I check if Delhivery delivers to my Pincode?',
      a: 'Use our instant "Pincode Serviceability" tab in the action widget above. Enter your 6-digit Indian PIN code to check Express Parcel, COD, and Reverse Pickup coverage across 18,600+ pin codes.'
    },
    {
      q: 'What should I do if my package status shows "Out for Delivery"?',
      a: 'When your status updates to "Out for Delivery", an assigned delivery agent is en route to your address. You will receive an SMS containing the agent phone number and secure OTP verification code.'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-500 pb-28">
      {/* Top Delhivery Brand Banner Bar */}
      <div className="bg-gradient-to-r from-red-950/80 via-zinc-950 to-zinc-950 border border-red-500/20 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>DELHIVERY LOGISTICS NETWORK • INDIA</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              India's Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-500">Express Freight</span> Engine
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-xl font-medium">
              Seamless AWB tracking, instant rate calculation, 18,600+ pincode serviceability, and nationwide express shipping.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center min-w-[110px]">
              <p className="text-2xl font-black text-white">18.6K+</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Pin Codes</p>
            </div>
            <div className="bg-zinc-900/90 border border-zinc-800 p-3 rounded-2xl text-center min-w-[110px]">
              <p className="text-2xl font-black text-red-400">3B+</p>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Packages</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Delhivery Action Widget (Tabs: Track | Rate Calculator | Pincode | Partner) */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'track', label: 'Track Shipment', icon: Search },
            { id: 'rate', label: 'Calculate Shipping Cost', icon: Calculator },
            { id: 'pincode', label: 'Check Serviceability', icon: MapPin },
            { id: 'partner', label: 'Partner With Us', icon: Building2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all whitespace-nowrap shrink-0',
                  isActive 
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30' 
                    : 'bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-900'
                )}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div className="pt-6">
          {/* TAB 1: TRACK SHIPMENT */}
          {activeTab === 'track' && (
            <div className="space-y-6">
              <form onSubmit={(e) => handleSearch(e)} className="space-y-4">
                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400">
                  <span className="text-white">Search by:</span>
                  <label className="flex items-center gap-1.5 cursor-pointer text-red-400">
                    <input type="radio" name="searchType" defaultChecked className="accent-red-600" />
                    <span>Waybill / AWB Number</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer hover:text-white transition-colors">
                    <input type="radio" name="searchType" className="accent-red-600" />
                    <span>Order Ref ID</span>
                  </label>
                </div>

                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-amber-600 rounded-2xl blur-md opacity-20 group-focus-within:opacity-40 transition-all" />
                  <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-2xl p-2 focus-within:border-red-500 transition-all">
                    <Search className="ml-4 text-zinc-500 group-focus-within:text-red-400" size={20} />
                    <input
                      type="text"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter AWB or Tracking ID (e.g. SP-100234)..."
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white text-base font-semibold placeholder:text-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 py-3.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20 active:scale-95 shrink-0"
                    >
                      {loading ? (
                        <motion.div 
                          animate={{ rotate: 360 }} 
                          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} 
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" 
                        />
                      ) : (
                        <>
                          <span>Track AWB</span>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>

              {/* Sample tracking IDs */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-500 font-medium">Demo Tracking Waybills:</span>
                {sampleTrackings.map((sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleSearch(undefined, sample)}
                    className="px-3 py-1 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-500/50 text-zinc-300 font-mono font-bold transition-all hover:text-white"
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: RATE CALCULATOR */}
          {activeTab === 'rate' && (
            <div className="space-y-6">
              <form onSubmit={handleCalculateRate} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Origin Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={originPincode}
                    onChange={(e) => setOriginPincode(e.target.value)}
                    placeholder="e.g. 110001"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-mono font-bold focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Destination Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={destPincode}
                    onChange={(e) => setDestPincode(e.target.value)}
                    placeholder="e.g. 400001"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-mono font-bold focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Package Weight (KG)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="Weight in kg"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-sm font-bold focus:border-red-500 outline-none"
                    required
                  />
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                  >
                    <Calculator size={18} />
                    <span>Calculate Express Fare</span>
                  </button>
                </div>
              </form>

              {rateResult && (
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4 animate-in fade-in duration-300">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider">Estimated Shipping Fare</span>
                    <span className="text-xs font-bold text-zinc-400">Transit: {rateResult.estDays}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-zinc-500 block">Base Freight</span>
                      <span className="text-white font-extrabold text-base">₹{rateResult.base}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Fuel Surcharge (15%)</span>
                      <span className="text-white font-extrabold text-base">₹{rateResult.fuel}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">GST (18%)</span>
                      <span className="text-white font-extrabold text-base">₹{rateResult.gst}</span>
                    </div>
                    <div className="bg-red-600/10 border border-red-500/30 p-2.5 rounded-xl text-right">
                      <span className="text-red-400 block text-[10px] font-bold uppercase">Total Estimated Fare</span>
                      <span className="text-red-400 font-black text-xl">₹{rateResult.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PINCODE SERVICEABILITY */}
          {activeTab === 'pincode' && (
            <div className="space-y-6">
              <form onSubmit={handleCheckPincode} className="flex gap-4">
                <input
                  type="text"
                  maxLength={6}
                  value={checkPincode}
                  onChange={(e) => setCheckPincode(e.target.value)}
                  placeholder="Enter 6-digit Indian PIN code (e.g. 560001)..."
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-base font-mono font-bold focus:border-red-500 outline-none"
                  required
                />
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-red-600/20"
                >
                  <MapPin size={18} />
                  <span>Check Availability</span>
                </button>
              </form>

              {pincodeResult && (
                <div className="bg-zinc-900/80 border border-zinc-800 p-6 rounded-2xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-400" />
                      <span className="text-white font-bold text-sm">Pincode {pincodeResult.code} ({pincodeResult.city}, {pincodeResult.state}) is FULLY SERVICED</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <p className="text-zinc-500 font-bold mb-1">Express Parcel</p>
                      <span className="text-emerald-400 font-black uppercase text-xs">Active Doorstep</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <p className="text-zinc-500 font-bold mb-1">Cash on Delivery (COD)</p>
                      <span className="text-emerald-400 font-black uppercase text-xs">Supported</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <p className="text-zinc-500 font-bold mb-1">Reverse Pickup</p>
                      <span className="text-emerald-400 font-black uppercase text-xs">Available</span>
                    </div>
                    <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                      <p className="text-zinc-500 font-bold mb-1">Heavy Freight</p>
                      <span className="text-red-400 font-black uppercase text-xs">Hub Connected</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PARTNER WITH US */}
          {activeTab === 'partner' && (
            <div className="space-y-6">
              {partnerSubmitted ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
                  <p className="text-white font-extrabold text-lg">Partner Application Received!</p>
                  <p className="text-zinc-400 text-xs">Our enterprise logistics onboarding team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setPartnerSubmitted(true); }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Partnership Type</label>
                    <select
                      value={partnerType}
                      onChange={(e) => setPartnerType(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-red-500 outline-none"
                    >
                      <option>SME / E-Commerce Shipper</option>
                      <option>Franchise Delivery Partner</option>
                      <option>Fleet Owner / Driver</option>
                      <option>Warehouse Supplier</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Company / Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Acme Enterprises Ltd"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-red-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 98765 43210"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-red-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase mb-2">City Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Bengaluru"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white text-xs font-bold focus:border-red-500 outline-none"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2 flex justify-end">
                    <button
                      type="submit"
                      className="bg-red-600 hover:bg-red-500 text-white font-extrabold px-8 py-3 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-red-600/20"
                    >
                      <Send size={16} />
                      <span>Submit Partnership Application</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SEARCH RESULTS DISPLAY CARD */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm max-w-3xl mx-auto shadow-lg"
          >
            <AlertCircle size={20} className="shrink-0" />
            <p className="font-semibold">{error}</p>
          </motion.div>
        )}

        {shipment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {/* Main Result Card */}
            <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-red-600/5 rounded-full blur-[100px] pointer-events-none" />

              {/* Header Info Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-6">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">AWB / Waybill ID</span>
                    <span className="text-2xl font-black font-mono text-white tracking-wider">{shipment.id}</span>
                    <button
                      onClick={handleCopyLink}
                      className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
                      title="Copy Tracking Link"
                    >
                      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copied ? 'Copied' : 'Share'}</span>
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 font-medium mt-1">
                    Booked on {shipment.createdAt?.seconds ? new Date(shipment.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'}
                  </p>
                </div>

                <div className="flex items-center gap-4 flex-wrap">
                  {/* Status Badge */}
                  {(() => {
                    const badge = getStatusBadge(shipment.status);
                    return (
                      <div className={cn('px-4 py-2 rounded-xl border flex items-center gap-2.5 font-bold uppercase text-xs tracking-wider shadow-sm', badge.color)}>
                        <div className={cn('w-2.5 h-2.5 rounded-full animate-pulse', badge.dot)} />
                        <span>{shipment.status}</span>
                      </div>
                    );
                  })()}

                  {/* Estimated Delivery */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 flex items-center gap-3">
                    <Calendar size={18} className="text-red-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Est. Delivery</p>
                      <p className="text-white font-bold text-sm mt-0.5">{shipment.estimatedDeliveryDate || 'TBD'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Stepper */}
              <div className="py-8 border-b border-zinc-800">
                <p className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Navigation size={14} className="text-red-400" />
                  <span>Shipment Routing Progression</span>
                </p>

                <div className="relative">
                  <div className="absolute top-5 left-6 right-6 h-1 bg-zinc-800 rounded-full hidden sm:block" />
                  <div 
                    className="absolute top-5 left-6 h-1 bg-gradient-to-r from-red-600 to-emerald-500 rounded-full transition-all duration-700 hidden sm:block"
                    style={{ width: `${(currentStep / 4) * 90}%` }}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 relative z-10">
                    {[
                      { label: 'Booked', desc: shipment.origin },
                      { label: 'Sorting Hub', desc: 'Central Terminal' },
                      { label: 'In Transit', desc: shipment.lastUpdatedLocation || 'In Flight/Road' },
                      { label: 'Out for Delivery', desc: shipment.destination },
                      { label: 'Delivered', desc: 'Completed' }
                    ].map((step, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;

                      return (
                        <div key={idx} className="flex sm:flex-col items-center gap-3 sm:gap-2 text-left sm:text-center">
                          <div className={cn(
                            'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all border shrink-0',
                            isCompleted 
                              ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-600/30' 
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600',
                            isCurrent && 'ring-4 ring-red-500/20 scale-105'
                          )}>
                            {isCompleted ? <Check size={16} strokeWidth={3} /> : idx + 1}
                          </div>
                          <div>
                            <p className={cn('text-xs font-extrabold uppercase tracking-tight', isCompleted ? 'text-white' : 'text-zinc-600')}>
                              {step.label}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-medium truncate max-w-[120px]">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sender & Destination Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Route Corridor</p>
                      <p className="text-white font-extrabold text-sm">{shipment.origin} → {shipment.destination}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Dispatch Origin</span>
                      <span className="text-zinc-200 font-bold">{shipment.origin}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Destination Hub</span>
                      <span className="text-zinc-200 font-bold">{shipment.destination}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                      <UserCheck size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Consignment Parties</p>
                      <p className="text-white font-extrabold text-sm">{shipment.senderName} to {shipment.recipientName}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-800/50 pt-3 text-xs">
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Shipper</span>
                      <span className="text-zinc-200 font-bold truncate block">{shipment.senderName}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block text-[10px] font-bold uppercase">Consignee</span>
                      <span className="text-zinc-200 font-bold truncate block">{shipment.recipientName}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Extra Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl">
                  <p className="text-zinc-500 text-[10px] font-extrabold uppercase mb-1">Service Tier</p>
                  <p className="text-white font-bold text-xs">{shipment.shipmentType || 'Express Parcel'}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl">
                  <p className="text-zinc-500 text-[10px] font-extrabold uppercase mb-1">Payment Mode</p>
                  <p className="text-emerald-400 font-bold text-xs">{shipment.paymentMode || 'Prepaid COD'}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl">
                  <p className="text-zinc-500 text-[10px] font-extrabold uppercase mb-1">Current Terminal</p>
                  <p className="text-white font-bold text-xs truncate">{shipment.lastUpdatedLocation || shipment.origin}</p>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800/50 p-4 rounded-xl">
                  <p className="text-zinc-500 text-[10px] font-extrabold uppercase mb-1">Last Scan</p>
                  <p className="text-white font-bold text-xs truncate">{shipment.lastUpdatedDate || 'Just now'}</p>
                </div>
              </div>

              {/* History Timeline */}
              {shipment.history && shipment.history.length > 0 && (
                <div className="mt-8 border-t border-zinc-800 pt-6">
                  <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Clock size={14} className="text-red-400" />
                    <span>Scan Event Audit History ({shipment.history.length})</span>
                  </h4>
                  <div className="space-y-3">
                    {shipment.history.slice().reverse().map((item, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs bg-zinc-900/30 p-3 rounded-xl border border-zinc-800">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-bold text-white uppercase">{item.status}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {new Date(item.updatedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-zinc-400 text-[11px] mt-0.5">Location: {item.location || 'Hub Terminal'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELHIVERY SERVICE VERTICALS GRID */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Delhivery Service Verticals</h2>
          <p className="text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto">
            Full-stack logistics infrastructure built for consumer brands, industrial manufacturers, and global trade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Express Parcel',
              desc: 'High-speed door-to-door B2C express shipping, automated cash-on-delivery (COD) reconciliation, and reverse pickup logistics.',
              tag: 'B2C & C2C'
            },
            {
              title: 'Partial Truckload (PTL)',
              desc: 'Door-to-door commercial freight shipping with barcode tracking, density rating, and automated weight auditing.',
              tag: 'SME & Enterprise'
            },
            {
              title: 'Full Truckload (FTL)',
              desc: 'Dedicated container fleets with real-time GPS route tracking, smart lock verification, and automated dispatch management.',
              tag: 'Bulk Freight'
            },
            {
              title: 'Cross Border Shipping',
              desc: 'Global express air cargo, ocean freight forwarding, express customs clearance, and overseas warehousing.',
              tag: 'International'
            },
            {
              title: 'Warehousing & Fulfillment',
              desc: 'Over 18M sq. ft. of tech-enabled fulfillment centers, inventory management, and same-day dispatch capabilities.',
              tag: 'Supply Chain'
            },
            {
              title: 'Delhivery One Platform',
              desc: 'Unified API stack, automated label printing, bulk CSV booking, and intelligent NDR management for merchants.',
              tag: 'SaaS Platform'
            }
          ].map((vert, idx) => (
            <div key={idx} className="bg-zinc-950 border border-zinc-800 p-6 rounded-2xl flex flex-col justify-between hover:border-red-500/40 transition-all group">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-red-600/10 text-red-400 border border-red-500/20 inline-block mb-3">
                  {vert.tag}
                </span>
                <h3 className="text-white font-black text-lg mb-2 group-hover:text-red-400 transition-colors">{vert.title}</h3>
                <p className="text-zinc-400 text-xs leading-relaxed">{vert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELHIVERY ENTERPRISE BANNER */}
      <div className="bg-gradient-to-r from-red-600 to-amber-600 rounded-3xl p-8 md:p-10 text-zinc-950 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2 text-center md:text-left">
          <span className="text-xs font-black uppercase tracking-widest bg-zinc-950/20 px-3 py-1 rounded-full inline-block">
            Powering 30,000+ Businesses Across India
          </span>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Ready to Scale Your E-Commerce Freight?</h3>
          <p className="text-zinc-900/90 text-sm max-w-xl font-medium">
            Open a Delhivery One business account in 2 minutes. Enjoy pre-negotiated express rates, free COD settlement, and automated NDR workflows.
          </p>
        </div>

        <button 
          onClick={() => setActiveTab('partner')}
          className="bg-zinc-950 hover:bg-zinc-900 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-2xl shrink-0 flex items-center gap-2 text-xs uppercase tracking-wider"
        >
          <span>Create Business Account</span>
          <ArrowRight size={16} />
        </button>
      </div>

      {/* FREQUENTLY ASKED QUESTIONS */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">Delhivery Help & Support FAQs</h3>
          <p className="text-zinc-500 text-xs mt-1">Frequently asked questions regarding express shipping, AWB tracking, and serviceability.</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div key={idx} className="border border-zinc-800 rounded-2xl overflow-hidden bg-zinc-900/30">
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full text-left p-4 flex items-center justify-between text-xs sm:text-sm font-bold text-white hover:text-red-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown size={16} className={cn('transition-transform text-zinc-500', activeFaq === idx && 'rotate-180 text-red-400')} />
              </button>
              {activeFaq === idx && (
                <div className="px-4 pb-4 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
