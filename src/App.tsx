import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import HeroImage from './assets/doctor-hero.jpg'; 
import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Edit, Trash, Plus, Save, LogOut } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

interface Doctor {
  id?: number;
  name: string;
  title: string;
  qualifications: string;
  experience: string;
  specialization: string;
  affiliation: string;
  email: string;
  phone: string;
  imageUrl: string;
  bio: string;
  summary: string;
}

// Utility to clean and join URLs to avoid double slashes and 404 errors
const joinUrl = (base: string, ...parts: string[]) => {
  const cleanBase = base.replace(/\/+$/, '');
  const cleanParts = parts.map(p => p.toString().replace(/^\/+/, '').replace(/\/+$/, ''));
  return [cleanBase, ...cleanParts].join('/');
};

export interface ProcedureObject {
  id?: number;
  name?: string;
  description?: string;
}
export type Procedure = ProcedureObject | string;

export interface Testimonial {
  id: number;
  content?: string;
  message?: string;
  author?: string;
  name?: string;
}

export interface Clinic {
  id?: number;
  hospitalName?: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  imo?: string;
  email?: string;
}

export default function App() {
  // Global Data State
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);

  // Fetch Data from Backend API
  const fetchData = async () => {
    try {
      const docRes = await fetch(joinUrl(API_BASE, "doctor"));
      const docData = await docRes.json();
      setDoctor(docData);

      const servRes = await fetch(joinUrl(API_BASE, "services"));
      const servData = await servRes.json();
      setProcedures(servData);

      const testRes = await fetch(joinUrl(API_BASE, "testimonials"));
      const testData = await testRes.json();
      setTestimonials(testData);

      const clinRes = await fetch(joinUrl(API_BASE, "clinics"));
      const clinData = await clinRes.json();
      setClinics(clinData);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home doctor={doctor} procedures={procedures} clinics={clinics} testimonials={testimonials} />} />
        <Route path="/admin" element={<AdminPanel fetchData={fetchData} doctor={doctor} procedures={procedures} clinics={clinics} testimonials={testimonials} />} />
      </Routes>
    </Router>
  );
}

// Admin Panel Component
function AdminPanel({ fetchData, doctor, procedures, clinics, testimonials }: { fetchData: () => void, doctor: Doctor | null, procedures: any[], clinics: any[], testimonials: any[] }) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") { // Correct password as requested
      setIsAdmin(true);
    } else {
      alert("Incorrect password");
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-lg shadow-md w-96">
          <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 rounded mb-4" />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-lg shadow-sm">
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <div className="space-x-4">
            <button onClick={() => navigate("/")} className="text-blue-600 hover:underline">View Site</button>
            <button onClick={() => setIsAdmin(false)} className="bg-red-500 text-white px-4 py-2 rounded flex items-center gap-2"><LogOut size={16}/> Logout</button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Doctor Profile CRUD */}
          <Section title="Doctor Profile">
             <DoctorForm doctor={doctor} onSave={fetchData} />
          </Section>

          {/* Services CRUD */}
          <Section title="Treatments & Services">
             <CRUDList items={procedures} type="services" onUpdate={fetchData} />
          </Section>

          {/* Clinics CRUD */}
          <Section title="Clinics">
             <CRUDList items={clinics} type="clinics" onUpdate={fetchData} />
          </Section>

          {/* Testimonials CRUD */}
          <Section title="Testimonials">
             <CRUDList items={testimonials} type="testimonials" onUpdate={fetchData} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h2 className="text-xl font-bold mb-6 pb-2 border-b">{title}</h2>
      {children}
    </div>
  );
}

function DoctorForm({ doctor, onSave }: { doctor: Doctor | null, onSave: () => void }) {
  const [form, setForm] = useState<Doctor>(doctor || { name: "", title: "", qualifications: "", experience: "", specialization: "", affiliation: "", email: "", phone: "", imageUrl: "", bio: "", summary: "" });
  
  useEffect(() => { if (doctor) setForm(doctor); }, [doctor]);

  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(joinUrl(API_BASE, "upload"), {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (data.url) {
        setForm({ ...form, imageUrl: data.url });
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Image upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = doctor?.id ? { ...form, id: doctor.id } : form;
    
    await fetch(joinUrl(API_BASE, "doctor"), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    onSave();
    alert("Profile Updated Successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
      <Input label="Name" value={form.name} onChange={v => setForm({...form, name: v})} />
      <Input label="Job Title" value={form.title} onChange={v => setForm({...form, title: v})} />
      <Input label="Degree / Qualifications" value={form.qualifications} onChange={v => setForm({...form, qualifications: v})} colSpan={2} />
      <Input label="Experience" value={form.experience} onChange={v => setForm({...form, experience: v})} />
      <Input label="Specialization" value={form.specialization} onChange={v => setForm({...form, specialization: v})} />
      <Input label="Affiliation" value={form.affiliation} onChange={v => setForm({...form, affiliation: v})} colSpan={2} />
      <Input label="Email" value={form.email} onChange={v => setForm({...form, email: v})} />
      <Input label="Phone" value={form.phone} onChange={v => setForm({...form, phone: v})} />
      
      <div className="col-span-2 space-y-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase">Profile Photo</label>
        <div className="flex items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-gray-50 hover:bg-white transition-colors">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
            <img src={form.imageUrl ? joinUrl(API_BASE, form.imageUrl) : HeroImage} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1">
            <input type="file" onChange={handleFileUpload} className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer w-full" />
            <p className="text-[10px] text-gray-400 mt-1">Accepts JPG, PNG. Max size 5MB.</p>
          </div>
          {uploading && <div className="text-blue-600 animate-spin">⌛</div>}
        </div>
      </div>
      
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Hero Summary / Motto</label>
        <textarea value={form.summary || ""} onChange={e => setForm({...form, summary: e.target.value})} className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none" rows={2} placeholder="e.g. With over 10 years of experience, Ahnaf is committed to..." />
      </div>
      
      <div className="col-span-2">
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">About / Bio</label>
        <textarea 
          value={form.bio || ""} 
          onChange={e => setForm({...form, bio: e.target.value})} 
          rows={6}
          className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none"
          placeholder="Describe your expertise and experience..."
        />
      </div>

      <button type="submit" className="col-span-2 bg-blue-600 text-white p-4 rounded-xl mt-4 flex items-center justify-center gap-2 font-bold shadow-lg hover:bg-blue-700 transition-all">
        <Save size={20}/> Update Professional Profile
      </button>
    </form>
  );
}

function CRUDList({ items, type, onUpdate }: { items: any[], type: string, onUpdate: () => void }) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        const url = joinUrl(API_BASE, type, id.toString());
        console.log("Attempting to delete at URL:", url);
        const response = await fetch(url, { method: 'DELETE' });
        if (response.ok) {
          onUpdate();
          alert("Item deleted successfully!");
        } else {
          alert(`Failed to delete. Server returned: ${response.status}`);
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Delete failed. Please check your connection.");
      }
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setForm(item);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(joinUrl(API_BASE, type), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (response.ok) {
        setEditingItem(null);
        setForm({});
        onUpdate();
        alert("Saved successfully!");
      } else {
        alert(`Save failed. Server returned: ${response.status}`);
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Save failed. Please check your connection.");
    }
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setForm({});
  };

  return (
    <div className="space-y-4">
      <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
        {items.map(item => (
          <div key={item.id} className={`border p-4 rounded-lg flex justify-between items-start transition-all ${editingItem?.id === item.id ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-gray-50'}`}>
            <div className="flex-1">
              {type === "services" && <><h4 className="font-bold text-gray-800">{item.name}</h4><p className="text-sm text-gray-600 line-clamp-2">{item.description}</p></>}
              {type === "clinics" && <><h4 className="font-bold text-blue-800">{item.hospitalName}</h4><p className="text-sm text-gray-600">{item.address}</p><p className="text-xs font-semibold text-gray-500">{item.phone}</p></>}
              {type === "testimonials" && <><p className="italic text-sm text-gray-700">"{item.content || item.message}"</p><h4 className="font-bold text-xs mt-1 text-gray-900">- {item.author || item.name}</h4></>}
            </div>
            <div className="flex gap-2 ml-4">
              <button onClick={() => handleEdit(item)} className="text-blue-500 hover:bg-blue-100 p-2 rounded-full transition-colors" title="Edit"><Edit size={16}/></button>
              <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:bg-red-100 p-2 rounded-full transition-colors" title="Delete"><Trash size={16}/></button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-center text-gray-400 py-4 italic">No items found. Add one below!</p>}
      </div>
      
      <div className="border-t pt-6 bg-white p-4 rounded-b-lg">
        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
          {editingItem ? <><Edit size={18} className="text-blue-600"/> Edit Existing</> : <><Plus size={18} className="text-green-600"/> Add New {type.slice(0, -1)}</>}
        </h4>
        <form onSubmit={handleSave} className="space-y-3">
          {type === "services" && (
            <>
              <input value={form.name || ""} placeholder="Service Name (e.g. Laser Surgery)" onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" required/>
              <textarea value={form.description || ""} placeholder="Description / Details" onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" rows={3} required/>
            </>
          )}
          {type === "clinics" && (
            <div className="grid grid-cols-2 gap-2">
              <input value={form.hospitalName || ""} placeholder="Hospital Name" onChange={e => setForm({...form, hospitalName: e.target.value})} className="col-span-2 border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" required/>
              <input value={form.address || ""} placeholder="Full Address" onChange={e => setForm({...form, address: e.target.value})} className="col-span-2 border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" required/>
              <input value={form.phone || ""} placeholder="Phone / Appointment Number" onChange={e => setForm({...form, phone: e.target.value})} className="border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" required/>
              <input value={form.whatsapp || ""} placeholder="WhatsApp Number" onChange={e => setForm({...form, whatsapp: e.target.value})} className="border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none"/>
            </div>
          )}
          {type === "testimonials" && (
            <>
              <textarea value={form.content || ""} placeholder="Testimonial Content / Quote" onChange={e => setForm({...form, content: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" rows={3} required/>
              <input value={form.author || ""} placeholder="Author Name" onChange={e => setForm({...form, author: e.target.value})} className="w-full border p-2 rounded text-sm focus:ring-1 focus:ring-blue-400 outline-none" required/>
            </>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" className={`flex-1 text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${editingItem ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700 font-bold'}`}>
              {editingItem ? <><Save size={18}/> Update Item</> : <><Plus size={18}/> Create Item</>}
            </button>
            {editingItem && (
              <button type="button" onClick={cancelEdit} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, colSpan = 1 }: { label: string, value: string, onChange: (v: string) => void, colSpan?: number }) {
  return (
    <div className={colSpan === 2 ? "col-span-2" : ""}>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</label>
      <input value={value || ""} onChange={e => onChange(e.target.value)} className="w-full border rounded p-2 text-sm focus:ring-1 focus:ring-blue-400 outline-none" />
    </div>
  );
}

// Separate Home component to prevent focus loss on state changes
function Home({ doctor, procedures, clinics, testimonials }: { doctor: Doctor | null, procedures: Procedure[], clinics: Clinic[], testimonials: Testimonial[] }) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const appointmentRef = useRef<HTMLElement | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { 
    setFormData({ ...formData, [e.target.name]: e.target.value }); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(joinUrl(API_BASE, "contact"), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowSuccess(true);
        setFormData({ name: '', email: '', message: '' });
      } else {
        alert("Failed to send message. Please try again later.");
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      alert("Error reaching the server. Please check your connection.");
    }
  };

  const nextTestimonial = () => {
    setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const scrollToAppointment = () => {
    const section = document.getElementById("appointment");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="font-sans">
      {/* Navbar */}
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 cursor-pointer">{doctor?.name || "Dr. Md. Sumon Ali"}</h1>
          <ul className="hidden md:flex space-x-6 items-center">
            <li><a href="#services" className="hover:text-blue-500 transition">Treatments & Services</a></li>
            <li><a href="#about" className="hover:text-blue-500 transition">About</a></li>
            <li><a href="#testimonials" className="hover:text-blue-500 transition">Testimonials</a></li>
            <li><a href="#appointment" className="hover:text-blue-500 transition">Appointment</a></li>
            <li>
              <a href={`https://wa.me/${doctor?.phone || "01930029495"}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 hover:text-green-600 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .5C5.64.5.5 5.64.5 12c0 2.11.55 4.14 1.6 5.93L.5 23.5l5.72-1.58A11.46 11.46 0 0 0 12 23.5c6.36 0 11.5-5.14 11.5-11.5S18.36.5 12 .5Zm0 20.67c-1.75 0-3.46-.46-4.95-1.34l-.35-.21-3.4.94.91-3.32-.23-.36a9.45 9.45 0 0 1-1.43-5.03c0-5.26 4.28-9.54 9.54-9.54s9.54 4.28 9.54 9.54S17.26 21.17 12 21.17Zm5.4-7.08c-.29-.14-1.71-.84-1.97-.93-.27-.1-.47-.14-.67.14-.19.29-.77.93-.94 1.12-.17.19-.34.21-.63.07-.29-.14-1.22-.45-2.33-1.43-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.13-.59.13-.13.29-.34.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.67-1.62-.92-2.22-.24-.57-.48-.5-.67-.51h-.57c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.44 0 1.44 1.02 2.84 1.16 3.04.14.19 2 3.04 4.86 4.26.68.29 1.21.46 1.62.59.68.22 1.3.19 1.79.12.55-.08 1.71-.7 1.95-1.38.24-.67.24-1.24.17-1.38-.07-.12-.26-.19-.55-.34Z" /></svg>
                <span>{doctor?.phone || "01930 029495"}</span>
              </a>
            </li>
          </ul>
          <button className="md:hidden text-blue-600 focus:outline-none" onClick={() => setIsOpen(!isOpen)}>{isOpen ? <X size={28} /> : <Menu size={28} />}</button>
        </div>
        {isOpen && (
          <ul className="md:hidden bg-white shadow-md px-6 py-4 space-y-4 text-center">
            <li><a href="#services" className="block hover:text-blue-500 transition">Procedures</a></li>
            <li><a href="#about" className="block hover:text-blue-500 transition">About</a></li>
            <li><a href="#testimonials" className="block hover:text-blue-500 transition">Testimonials</a></li>
            <li><a href="#appointment" className="block hover:text-blue-500 transition">Appointment</a></li>
            <li><a href="#contact" className="block hover:text-blue-500 transition">Contact</a></li>
          </ul>
        )}
      </nav>

      {/* Hero Section */}
      <header className="relative w-full bg-gradient-to-r from-blue-50 via-white to-blue-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 items-center gap-12 px-6">
          <div className="space-y-6 text-center md:text-left animate-fadeIn">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 leading-tight">{doctor?.name || "Dr. Md. Sumon Ali"}</h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-blue-600">{doctor?.title || "The Best Piles Doctor you can Trust"}</h2>
            <p className="text-gray-600 text-lg md:text-xl leading-relaxed text-justify">
              <span className="font-semibold text-gray-900">{doctor?.qualifications || "MBBS, BCS (Health), MS, Colorectal Surgery, Bangladesh Medical University (PG Hospital)"}</span> <br />
              {doctor?.affiliation || "Specialist Colorectal Surgeon, Dhaka Medical College Hospital"}
            </p>
            <p className="text-gray-600 text-lg leading-relaxed text-justify">
              {doctor?.specialization || "Providing advanced treatment for piles, hemorrhoids, anal fissures, fistula, colorectal cancer and other colorectal diseases."} 
              {doctor?.summary ? (
                ` ${doctor.summary}`
              ) : (
                <> With over <span className="font-semibold">{doctor?.experience || "7 years of experience"}</span>, {doctor?.name || "Dr. Sumon Ali"} is committed to delivering compassionate, precise, and reliable surgical care.</>
              )}
            </p>
            <button onClick={scrollToAppointment} className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:from-indigo-600 hover:to-blue-500 transition-all duration-500 shadow-lg hover:shadow-2xl">Book Appointment</button>
          </div>
          <div className="relative flex justify-center md:justify-end">
            <div className="relative z-10 w-full max-w-sm aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl border-4 border-white transform hover:scale-[1.02] transition-transform duration-500">
              <img src={doctor?.imageUrl ? joinUrl(API_BASE, doctor.imageUrl) : HeroImage} alt="Doctor" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/40 to-transparent"></div>
            </div>
            <div className="absolute -z-10 w-80 h-80 md:w-[28rem] md:h-[28rem] rounded-full bg-blue-100 top-4 right-0 animate-pulse"></div>
          </div>
        </div>
      </header>

      {/* Procedures Section */}
      <section id="services" className="max-w-7xl mx-auto px-4 py-20 bg-gray-50">
        <h3 className="text-3xl font-bold text-center mb-12 text-gray-800">Treatments & Services</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
          {procedures.length > 0 ? procedures.map((procedure, idx) => {
            const procName = typeof procedure === 'string' ? procedure : (procedure.name || 'Service');
            const procDesc = typeof procedure === 'string' ? `Expert care for ${procedure.toLowerCase()}` : (procedure.description || `Expert care for ${procName.toLowerCase()}`);
            const procId = typeof procedure === 'string' ? idx : (procedure.id || idx);
            return (
              <div key={procId} className="relative bg-white border-2 border-teal-400/50 p-8 rounded-xl shadow-md hover:shadow-xl hover:-translate-y-2 transform transition-all duration-300 flex flex-col items-center justify-center">
                <div className="bg-gradient-to-r from-teal-400 to-blue-400 text-white rounded-full w-16 h-16 flex items-center justify-center mb-4 text-2xl font-bold shadow-md">{procName.charAt(0)}</div>
                <h4 className="font-bold text-xl text-center text-gray-800">{procName}</h4>
                <p className="text-center mt-2 text-gray-600 text-sm">{procDesc}</p>
              </div>
            );
          }) : <p className="text-center text-gray-500 col-span-3">Loading services...</p>}
        </div>
      </section>

      {/* Appointment Section */}
      <section ref={appointmentRef} id="appointment" className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Book an Appointment</h2>
          <div className="grid md:grid-cols-2 gap-10">
            {clinics.length > 0 ? clinics.map((c, i) => (
              <div key={c.id || i} className="bg-white shadow-lg rounded-2xl p-6 border hover:shadow-xl transition">
                <h3 className="text-xl font-semibold text-blue-700 mb-4">{c.hospitalName}</h3>
                <p className="text-gray-700 mb-1"><strong>Address:</strong> {c.address}</p>
                <p className="text-gray-700 mb-1"><strong>For Appoinment:</strong> {c.phone}</p>
                {c.whatsapp && <p className="text-gray-700 mb-1"><strong>WhatsApp:</strong> {c.whatsapp}</p>}
                {c.imo && <p className="text-gray-700 mb-1"><strong>IMO:</strong> {c.imo}</p>}
                <p className="text-gray-700 mb-1"><strong>Email:</strong> {c.email || doctor?.email || 'mdsumonalirpmc@gmail.com'}</p>
              </div>
            )) : <p className="text-center text-gray-500 col-span-2">Loading clinics...</p>}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-4 text-justify">
          <h3 className="text-3xl font-bold mb-6 text-center text-gray-900">About {doctor?.name || "Dr. Md. Sumon Ali"}</h3>
          <div className="text-gray-700 leading-relaxed space-y-4 whitespace-pre-line">
            {doctor?.bio && doctor.bio.trim().length > 0 ? (
              doctor.bio
            ) : (
              <>
                <p>
                  <span className="font-semibold text-gray-900">{doctor?.name || "Dr. Md. Sumon Ali"}</span> is a Consultant Colorectal Surgeon with extensive expertise in laparoscopic and colorectal surgeries.
                  He is a specialist in treating piles, anal fissures, fistula, colon & rectal cancer, inflammatory bowel disease (IBD), intestinal tuberculosis, and provides advanced laser treatments.
                </p>
                <p>
                  With over <span className="font-semibold">{doctor?.experience || "7 years of experience"}</span>, {doctor?.name || "Dr. Sumon Ali"} is committed to delivering personalized, precise, and compassionate care.
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="max-w-4xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-12">Testimonials</h3>
        {testimonials.length > 0 ? (
          <div className="bg-white shadow-lg p-8 rounded-lg text-center relative">
            <p className="text-gray-700 mb-4 italic">"{testimonials[testimonialIndex]?.content || testimonials[testimonialIndex]?.message}"</p>
            <h4 className="font-bold text-lg">- {testimonials[testimonialIndex]?.author || testimonials[testimonialIndex]?.name}</h4>
            <div className="flex justify-between mt-6">
              <button onClick={prevTestimonial} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Prev</button>
              <button onClick={nextTestimonial} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">Next</button>
            </div>
          </div>
        ) : <p className="text-center text-gray-500">Loading testimonials...</p>}
      </section>

      {/* Contact Section */}
      <section id="contact" className="max-w-4xl mx-auto px-4 py-20">
        <h3 className="text-3xl font-bold text-center mb-8">Contact Us</h3>
        {showSuccess ? <div className="bg-green-100 text-green-700 p-6 rounded-lg shadow text-center font-semibold animate-fadeIn">✅ Your message has been submitted successfully.</div> : (
          <form onSubmit={handleSubmit} className="bg-white shadow-lg p-8 rounded-lg grid gap-6">
            <input type="text" name="name" placeholder="Your Name" value={formData.name} onChange={handleChange} className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            <input type="email" name="email" placeholder="Your Email" value={formData.email} onChange={handleChange} className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            <textarea name="message" placeholder="Your Message" value={formData.message} onChange={handleChange} rows={5} className="border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-blue-400" required />
            <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition">Send Message</button>
          </form>
        )}
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-6 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2025 {doctor?.name || "Dr. MD. Sumon Ali"}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
