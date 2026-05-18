"use client";

import { useEffect, useState, useMemo } from "react";
import { LayoutDashboard, Users, CalendarDays, DollarSign, LogOut, Search, Bell, Settings, MessageSquare, Lock, Hotel, PlusCircle, Loader2, Trash2, BarChart3, Image as ImageIcon, CheckCircle, Clock, AlertTriangle, MapPin, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { format, parseISO, isToday, isTomorrow, isThisMonth, isThisYear } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { motion, AnimatePresence } from "framer-motion"; // <-- INI IMPORT YANG TERTINGGAL TADI!

export default function AdminDashboard() {
  // Authentication States
  const [session, setSession] = useState<any>(null);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState("overview");
  const [timeFilter, setTimeFilter] = useState("month"); 
  const [bookingFilter, setBookingFilter] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<string[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  // Data States
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [galleryImages, setGalleryImages] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<any>({
    whatsapp_number: "", facebook_url: "", instagram_url: "", tiktok_url: "", map_url: "", maintenance_mode: false, dynamic_pricing: true
  });
  const [loadingData, setLoadingData] = useState(true);

  // CMS Form States
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [roomForm, setRoomForm] = useState({ name: "", price: "", guests: "", description: "", amenities: "" });
  const [roomImagesFiles, setRoomImagesFiles] = useState<FileList | null>(null);
  const [uploadingRoomImg, setUploadingRoomImg] = useState(false);

  const [isAddingReview, setIsAddingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: "", location: "", text: "", rating: 5 });

  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // 1. CHECK SESSION ON LOAD
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true); setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: emailInput, password: passwordInput });
    if (error) setLoginError("Invalid credentials. Access denied.");
    setLoginLoading(false);
  };

  const handleLogout = async () => await supabase.auth.signOut();

  // 2. FETCH CHANNELS FROM SUPABASE
  useEffect(() => {
    if (!session) return; 
    async function fetchData() {
      const [bookingsRes, roomsRes, reviewsRes, galleryRes, settingsRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("rooms").select("*").order("created_at", { ascending: false }),
        supabase.from("reviews").select("*").order("created_at", { ascending: false }),
        supabase.from("gallery").select("*").order("created_at", { ascending: false }),
        supabase.from("site_settings").select("*").eq('id', 1).single()
      ]);
      if (bookingsRes.data) {
        setBookings(bookingsRes.data);
        const pendings = bookingsRes.data.filter(b => b.payment_status === "pending");
        if(pendings.length > 0) setNotifications([`You have ${pendings.length} pending bookings to track.`]);
      }
      if (roomsRes.data) setRooms(roomsRes.data);
      if (reviewsRes.data) setReviews(reviewsRes.data);
      if (galleryRes.data) setGalleryImages(galleryRes.data);
      if (settingsRes.data) setSiteSettings(settingsRes.data);
      setLoadingData(false);
    }
    fetchData();
  }, [session]);

  // 3. IMAGE UPLOADER LOGIC TO SUPABASE BUCKET
  const uploadImageToStorage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `public/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('inapmuse_images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('inapmuse_images').getPublicUrl(filePath);
    return data.publicUrl;
  };

  // 4. CMS ACTIONS
  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingRoomImg(true);
    try {
      let imageUrls: string[] = [];
      if (roomImagesFiles) {
        for (let i = 0; i < roomImagesFiles.length; i++) {
          const url = await uploadImageToStorage(roomImagesFiles[i]);
          imageUrls.push(url);
        }
      } else {
        imageUrls.push("https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80"); // fallback
      }

      const newRoom = {
        name: roomForm.name,
        price: Number(roomForm.price),
        guests: Number(roomForm.guests),
        description: roomForm.description,
        amenities: roomForm.amenities.split(",").map(a => a.trim()),
        images: imageUrls
      };

      const { data, error } = await supabase.from('rooms').insert([newRoom]).select();
      if (error) throw error;
      if (data) setRooms([data[0], ...rooms]);
      setIsAddingRoom(false);
      setRoomForm({ name: "", price: "", guests: "", description: "", amenities: "" });
      setRoomImagesFiles(null);
    } catch (err: any) {
      alert("Error adding room: " + err.message);
    } finally {
      setUploadingRoomImg(false);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase.from('reviews').insert([{
      name: reviewForm.name,
      location: reviewForm.location,
      text: reviewForm.text,
      rating: Number(reviewForm.rating)
    }]).select();
    
    if (!error && data) {
      setReviews([data[0], ...reviews]);
      setIsAddingReview(false);
      setReviewForm({ name: "", location: "", text: "", rating: 5 });
    } else alert("Error saving review to database.");
  };

  const handleUploadGallery = async () => {
    if (!galleryFile) return;
    setUploadingGallery(true);
    try {
      const publicUrl = await uploadImageToStorage(galleryFile);
      const { data, error } = await supabase.from('gallery').insert([{ image_url: publicUrl }]).select();
      if (!error && data) setGalleryImages([data[0], ...galleryImages]);
      setGalleryFile(null);
    } catch (err: any) {
      alert("Upload failed: " + err.message);
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    const { error } = await supabase.from('site_settings').update(siteSettings).eq('id', 1);
    setSavingSettings(false);
    if (!error) alert("Global configuration saved successfully!");
    else alert("Error saving configurations.");
  };

  const handleDelete = async (table: string, id: string) => {
    if(!confirm("Confirm item deletion?")) return;
    const { error } = await supabase.from(table).delete().eq('id', id);
    if (!error) {
      if(table === 'rooms') setRooms(rooms.filter(r => r.id !== id));
      if(table === 'reviews') setReviews(reviews.filter(r => r.id !== id));
      if(table === 'gallery') setGalleryImages(galleryImages.filter(g => g.id !== id));
    }
  };

  // 5. DATA FILTERS & SEARCH PROCESS
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const date = parseISO(b.created_at);
      if (activeTab === "overview") {
        if (timeFilter === "today") return isToday(date);
        if (timeFilter === "month") return isThisMonth(date);
        if (timeFilter === "year") return isThisYear(date);
      }
      
      if (activeTab === "bookings") {
        const checkInDate = parseISO(b.check_in);
        const checkOutDate = parseISO(b.check_out);
        if (bookingFilter === "checkin-today") return isToday(checkInDate);
        if (bookingFilter === "checkout-today") return isToday(checkOutDate);
        if (bookingFilter === "checkin-tomorrow") return isTomorrow(checkInDate);
        if (bookingFilter === "checkout-tomorrow") return isTomorrow(checkOutDate);
      }

      if (searchQuery) {
        return b.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               b.customer_email.toLowerCase().includes(searchQuery.toLowerCase());
      }

      return true;
    });
  }, [bookings, timeFilter, bookingFilter, activeTab, searchQuery]);

  const counters = useMemo(() => {
    return {
      pending: bookings.filter(b => b.payment_status === "pending").length,
      paid: bookings.filter(b => b.payment_status === "paid").length,
      cancelled: bookings.filter(b => b.payment_status === "cancelled").length,
    };
  }, [bookings]);

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.total_price), 0);
  const totalGuests = filteredBookings.reduce((sum, b) => sum + Number(b.guests), 0);

  const chartData = useMemo(() => {
    const dataMap: any = {};
    filteredBookings.forEach(b => {
      const dateKey = format(parseISO(b.created_at), timeFilter === "year" ? "MMM yyyy" : "MMM dd");
      if (!dataMap[dateKey]) dataMap[dateKey] = { name: dateKey, revenue: 0, bookings: 0 };
      dataMap[dateKey].revenue += Number(b.total_price);
      dataMap[dateKey].bookings += 1;
    });
    return Object.values(dataMap).reverse();
  }, [filteredBookings, timeFilter]);

  if (authLoading) return <div className="min-h-screen bg-muse-bg flex items-center justify-center"><Loader2 className="animate-spin text-muse-primary" size={48} /></div>;
  
  if (!session) {
    return (
      <div className="min-h-screen bg-muse-bg flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[32px] p-10 shadow-2xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-900"><Lock size={24} /></div>
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-500 text-sm mb-8">Encrypted access. Please enter your credentials.</p>
          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 pl-2">Admin Email</label><input type="email" required value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium outline-none focus:border-muse-primary focus:bg-white transition-all"/></div>
            <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1 pl-2">Password</label><input type="password" required value={passwordInput} onChange={e => setPasswordInput(e.target.value)} className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-medium outline-none focus:border-muse-primary focus:bg-white transition-all"/></div>
            {loginError && <p className="text-red-500 text-xs font-bold text-center pt-2">{loginError}</p>}
            <button disabled={loginLoading} type="submit" className="w-full bg-gray-900 text-white py-4 mt-4 rounded-2xl font-bold hover:bg-muse-primary transition-colors shadow-lg flex items-center justify-center gap-2">
              {loginLoading ? <><Loader2 className="animate-spin" size={18}/> Authenticating...</> : "Secure Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-serif text-2xl font-bold text-gray-900 tracking-tighter">INAP MUSE.</h1>
          <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">Control Center</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab("overview")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "overview" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><LayoutDashboard size={18} /> Overview & Analytics</button>
          <button onClick={() => setActiveTab("bookings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "bookings" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><CalendarDays size={18} /> Bookings & Control</button>
          <button onClick={() => setActiveTab("rooms")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "rooms" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><Hotel size={18} /> Manage Rooms (CMS)</button>
          <button onClick={() => setActiveTab("gallery")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "gallery" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><ImageIcon size={18} /> Website Gallery (CMS)</button>
          <button onClick={() => setActiveTab("reviews")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "reviews" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><MessageSquare size={18} /> Guest Reviews (CMS)</button>
          <button onClick={() => setActiveTab("settings")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors ${activeTab === "settings" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}><Settings size={18} /> Config & Platforms</button>
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm text-red-600 hover:bg-red-50 transition-colors"><LogOut size={18} /> Secure Sign Out</button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input type="text" placeholder="Live search guest name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 bg-gray-100 border-none rounded-full text-sm outline-none w-full" />
          </div>

          <div className="flex items-center gap-6 relative">
            <button onClick={() => setShowNotifDropdown(!showNotifDropdown)} className="relative text-gray-500 hover:text-gray-800">
              <Bell size={20} />
              {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
            </button>
            
            <AnimatePresence>
              {showNotifDropdown && (
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute right-12 top-8 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-50 text-xs">
                  <div className="font-bold text-gray-900 mb-2">Live Notifications</div>
                  {notifications.length === 0 ? <p className="text-gray-400">All quiet. No alerts.</p> : notifications.map((n, i) => <p key={i} className="text-gray-600 bg-red-50 p-2 rounded-lg font-medium">{n}</p>)}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="w-9 h-9 rounded-full bg-muse-primary text-white flex items-center justify-center font-bold text-sm">AD</div>
          </div>
        </header>

        <div className="p-8">
          {loadingData ? (
            <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-gray-400" size={48} /></div>
          ) : activeTab === "overview" ? (
            <>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-gray-900">Analytical Dashboard</h3>
                <div className="flex bg-gray-200 rounded-lg p-1">
                  {["today", "month", "year"].map(t => <button key={t} onClick={() => setTimeFilter(t)} className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${timeFilter === t ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>{t}</button>)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600"><DollarSign size={24}/></div>
                  <div><p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Revenue Stream</p><h3 className="text-3xl font-bold text-gray-900">RM {totalRevenue.toLocaleString()}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><CalendarDays size={24}/></div>
                  <div><p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Volume</p><h3 className="text-3xl font-bold text-gray-900">{filteredBookings.length}</h3></div>
                </div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm flex items-center gap-6">
                  <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Users size={24}/></div>
                  <div><p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">Occupancy Pax</p><h3 className="text-3xl font-bold text-gray-900">{totalGuests}</h3></div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-72">
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip/><Line type="monotone" dataKey="revenue" stroke="#AB1509" strokeWidth={3} dot={{fill:'#AB1509'}}/></LineChart></ResponsiveContainer></div>
                <div className="bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" /><XAxis dataKey="name" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="bookings" fill="#111827" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div>
              </div>
            </>
          ) : activeTab === "bookings" ? (
             <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800"><Clock/><div className="text-sm font-bold">Pending: {counters.pending}</div></div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-2xl flex items-center gap-4 text-green-800"><CheckCircle/><div className="text-sm font-bold">Paid Confirmed: {counters.paid}</div></div>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-4 text-red-800"><AlertTriangle/><div className="text-sm font-bold">Cancelled: {counters.cancelled}</div></div>
                </div>

                <div className="flex gap-2 bg-white p-2 rounded-xl border border-gray-200 w-max text-xs font-bold text-gray-500">
                  {["all", "checkin-today", "checkout-today", "checkin-tomorrow", "checkout-tomorrow"].map(f => <button key={f} onClick={() => setBookingFilter(f)} className={`px-4 py-2 rounded-lg capitalize ${bookingFilter === f ? 'bg-gray-900 text-white':''}`}>{f.replace('-', ' ')}</button>)}
                </div>

                <div className="bg-white border border-gray-200 rounded-[24px] shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-gray-50/50 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-100">
                          <th className="px-6 py-4">Guest</th><th className="px-6 py-4">Timeline</th><th className="px-6 py-4">Financials</th><th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-gray-100">
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-gray-50/50">
                            <td className="px-6 py-4"><div className="font-semibold text-gray-900">{b.customer_name}</div><div className="text-gray-500 text-xs">{b.customer_phone}</div></td>
                            <td className="px-6 py-4"><div className="text-gray-900">In: {b.check_in}</div><div className="text-gray-500 text-xs">Out: {b.check_out}</div></td>
                            <td className="px-6 py-4 font-bold">RM {b.total_price}</td>
                            <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${b.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.payment_status.toUpperCase()}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          ) : activeTab === "rooms" ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm">
                <div><h3 className="font-bold text-gray-900 text-lg">Inventory Node</h3><p className="text-xs text-gray-400">Direct integration upload system.</p></div>
                <button onClick={() => setIsAddingRoom(!isAddingRoom)} className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm hover:bg-muse-primary flex items-center gap-2">{isAddingRoom ? "Cancel" : <><PlusCircle size={16}/> Add New Room</>}</button>
              </div>

              {isAddingRoom && (
                <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm space-y-4">
                  <form onSubmit={handleAddRoom} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div><label className="text-xs font-bold text-gray-400 uppercase">Room Name</label><input required type="text" value={roomForm.name} onChange={e=>setRoomForm({...roomForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                      <div><label className="text-xs font-bold text-gray-400 uppercase">Rate per night</label><input required type="number" value={roomForm.price} onChange={e=>setRoomForm({...roomForm, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                      <div><label className="text-xs font-bold text-gray-400 uppercase">Pax Capacity</label><input required type="number" value={roomForm.guests} onChange={e=>setRoomForm({...roomForm, guests: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" /></div>
                    </div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Description</label><textarea required value={roomForm.description} onChange={e=>setRoomForm({...roomForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-20" /></div>
                    <div><label className="text-xs font-bold text-gray-400 uppercase">Amenities (Comma list)</label><input required type="text" value={roomForm.amenities} onChange={e=>setRoomForm({...roomForm, amenities: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="WiFi, Pool, Bath" /></div>
                    
                    <div className="p-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 flex flex-col items-center">
                      <Upload className="text-gray-400 mb-2" size={24}/>
                      <input type="file" multiple accept="image/*" onChange={e => setRoomImagesFiles(e.target.files)} className="text-xs" />
                      <p className="text-[10px] text-gray-400 mt-1">Select one or multiple photos to upload into Supabase Storage.</p>
                    </div>

                    <button type="submit" disabled={uploadingRoomImg} className="bg-muse-primary text-white px-8 py-4 rounded-xl font-bold shadow-md flex items-center gap-2">
                      {uploadingRoomImg ? <><Loader2 className="animate-spin"/> Executing Upload...</> : "Publish Complete Listing"}
                    </button>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-3 gap-6">
                {rooms.map(r => (
                  <div key={r.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm flex flex-col">
                    <img src={r.images?.[0]} className="h-44 w-full object-cover" alt="" />
                    <div className="p-6 flex flex-col flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-1">{r.name}</h4>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-4">RM {r.price} / Night</p>
                      <button onClick={() => handleDelete('rooms', r.id)} className="mt-auto text-red-500 flex items-center gap-1 text-xs font-bold"><Trash2 size={14}/> Eliminate Listing</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "gallery" ? (
            <div className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm space-y-8">
              <div><h3 className="font-bold text-gray-900 text-lg mb-1">Website Gallery Node</h3><p className="text-xs text-gray-400">Add physical media blocks directly to the public showcase layout.</p></div>
              
              <div className="p-6 border border-gray-200 bg-gray-50 rounded-2xl flex items-center gap-4">
                <input type="file" accept="image/*" onChange={e => setGalleryFile(e.target.files?.[0] || null)} className="text-xs" />
                <button onClick={handleUploadGallery} disabled={uploadingGallery || !galleryFile} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-xs flex items-center gap-2">
                  {uploadingGallery ? <Loader2 className="animate-spin" size={14}/> : <><Upload size={14}/> Inject Photo</>}
                </button>
              </div>

              <div className="grid grid-cols-4 gap-4">
                {galleryImages.map(g => (
                  <div key={g.id} className="relative rounded-xl overflow-hidden h-32 group">
                    <img src={g.image_url} className="w-full h-full object-cover" alt="" />
                    <button onClick={() => handleDelete('gallery', g.id)} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><Trash2/></button>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === "reviews" ? (
             <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-6 rounded-[24px] border border-gray-200 shadow-sm">
                 <div><h3 className="font-bold text-gray-900 text-lg">Reviews Engine</h3><p className="text-xs text-gray-400">Database connected manual injections.</p></div>
                 <button onClick={() => setIsAddingReview(!isAddingReview)} className="bg-gray-900 text-white px-5 py-3 rounded-xl font-bold text-sm">{isAddingReview ? "Cancel" : "Add Review"}</button>
               </div>

               {isAddingReview && (
                 <form onSubmit={handleAddReview} className="bg-white p-8 rounded-[24px] border border-gray-200 shadow-sm space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <input required placeholder="Guest Name" value={reviewForm.name} onChange={e=>setReviewForm({...reviewForm, name:e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200"/>
                      <input required placeholder="Country Location" value={reviewForm.location} onChange={e=>setReviewForm({...reviewForm, location:e.target.value})} className="px-4 py-3 bg-gray-50 rounded-xl text-sm border border-gray-200"/>
                    </div>
                    <textarea required placeholder="Review Text Body" value={reviewForm.text} onChange={e=>setReviewForm({...reviewForm, text:e.target.value})} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl h-20 text-sm"/>
                    <button type="submit" className="bg-muse-primary text-white px-6 py-3 rounded-xl font-bold text-xs">Save Securely</button>
                 </form>
               )}

               <div className="grid grid-cols-2 gap-4">
                  {reviews.map(r => (
                    <div key={r.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col relative">
                      <button onClick={() => handleDelete('reviews', r.id)} className="absolute top-4 right-4 text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                      <p className="text-gray-600 text-xs italic mb-4">"{r.text}"</p>
                      <div className="font-bold text-gray-900 text-xs mt-auto">{r.name} <span className="text-gray-400 font-medium">({r.location})</span></div>
                    </div>
                  ))}
               </div>
             </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-[24px] p-8 md:p-12 shadow-sm space-y-8">
              <div><h3 className="font-bold text-gray-900 text-lg mb-1">Platform Global Settings</h3><p className="text-xs text-gray-400">Configure global metadata endpoints dynamically.</p></div>
              
              <div className="max-w-xl space-y-4 text-sm text-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold text-gray-400 uppercase">WhatsApp Help Desk</label><input type="text" value={siteSettings.whatsapp_number} onChange={e=>setSiteSettings({...siteSettings, whatsapp_number: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1" /></div>
                  <div><label className="text-xs font-bold text-gray-400 uppercase">Google Map Link</label><input type="text" value={siteSettings.map_url} onChange={e=>setSiteSettings({...siteSettings, map_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1" /></div>
                </div>
                <div><label className="text-xs font-bold text-gray-400 uppercase">Facebook URL</label><input type="text" value={siteSettings.facebook_url} onChange={e=>setSiteSettings({...siteSettings, facebook_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase">Instagram URL</label><input type="text" value={siteSettings.instagram_url} onChange={e=>setSiteSettings({...siteSettings, instagram_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1" /></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase">TikTok URL</label><input type="text" value={siteSettings.tiktok_url} onChange={e=>setSiteSettings({...siteSettings, tiktok_url: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl mt-1" /></div>
                
                <button onClick={handleSaveSettings} disabled={savingSettings} className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md">
                  {savingSettings ? <Loader2 className="animate-spin" size={14}/> : "Commit All System Configuration"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}