import React, { lazy, Suspense, useEffect, useState } from 'react';
import apiClient from '../../shared/api/client';
import { 
  MdCheckCircle, 
  MdError, 
  MdChevronRight, 
  MdChevronLeft, 
  MdPersonOutline, 
  MdSchool, 
  MdFolderOpen, 
  MdDoneAll,
  MdShield,
  MdFileUpload,
  MdInfoOutline
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
const LegalModal = lazy(() => import('./LegalModal'));

export default function StudentEnrollmentPage() {
  const [courses, setCourses] = useState([]);
  const [courseTypes, setCourseTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'tc' });
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country_code: '+91',
    mobile_number: '',
    college: '',
    school_college_id: '',
    location: '',
    course_id: '',
    additional_info: '',
    language: '',
    resume: null,
    aadhar_card: null,
    photo: null
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses/filter/courses');
        if (response.data.success) {
          const courseData = response.data.courses;
          setCourses(courseData);
          const types = [...new Set(courseData.map(c => c.course_type))].sort();
          setCourseTypes(types);
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedType) {
      const filtered = courses.filter(c => c.course_type === selectedType);
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  }, [selectedType, courses]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.name || !formData.mobile_number) {
        toast.error('Required fields are missing');
        return;
      }
    } else if (currentStep === 2) {
      if (!selectedType || !formData.course_id) {
        toast.error('Course selection is required');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error('Please agree to terms');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      await apiClient.post('/api/enrollment/student', data);
      setSubmitted(true);
      toast.success('Successfully Enrolled');
    } catch (err) {
      setError(err.response?.data?.error || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen premium-mesh-bg flex items-center justify-center p-6 relative overflow-hidden font-inter">
        {/* Mesh Background Blobs */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-200/40 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[110px]" />
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-2xl p-12 md:p-16 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white max-w-lg w-full text-center animate-in zoom-in duration-700">
          <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner transform -rotate-6 animate-pulse">
            <MdCheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Registration Success</h2>
          <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">Your academic registration has been confirmed. Welcome to the cohort! Check your inbox for orientation details.</p>
          <button 
            onClick={() => window.location.href = '/enroll/student'} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-indigo-600 transition-all hover:shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            Submit Another Registration
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Basic Details', icon: <MdPersonOutline /> },
    { label: 'Academic', icon: <MdSchool /> },
    { label: 'Documents', icon: <MdFolderOpen /> },
    { label: 'Review', icon: <MdDoneAll /> }
  ];

  return (
    <div className="min-h-screen premium-mesh-bg flex flex-col font-inter text-slate-900 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Mesh Background Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-200/40 rounded-full blur-[130px] animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[110px]" />
      </div>
      
      <header className="py-6 px-8 max-w-6xl mx-auto w-full flex justify-between items-center bg-white/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-black text-xl">S</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none"> <span className="text-indigo-600 uppercase">Student Registration</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1.5 opacity-80">Student Registration Portal</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 transition-all duration-500 ${currentStep === i + 1 ? 'opacity-100 scale-105' : 'opacity-30'}`}>
              <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-lg font-bold transition-all ${currentStep >= i + 1 ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white/50 text-slate-400 border border-slate-100'}`}>
                {i + 1}
              </span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${currentStep === i + 1 ? 'text-indigo-700' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10">
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50">
          {/* Progress Bar (Subtle) */}
          <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all duration-700 ease-in-out" 
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-8 md:p-12 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 -tr-y-1/2 tr-x-1/2 w-64 h-64 bg-slate-50 rounded-full blur-3xl opacity-50 -z-10" />
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
                <MdError /> {error}
              </div>
            )}

            <div className="min-h-[380px]">
              {/* Step 1: Identity */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Basic Information</h2>
                    <p className="text-sm text-slate-500 mt-1">Please provide your contact and personal information.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@company.com" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900/10 focus:border-slate-900 outline-none transition-all text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Mobile Number <span className="text-red-500">*</span></label>
                      <div className="flex gap-2">
                        <select name="country_code" value={formData.country_code} onChange={handleChange} className="w-20 px-2 py-3 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none">
                          <option value="+91">IN (+91)</option>
                          <option value="+1">US (+1)</option>
                        </select>
                        <input type="tel" name="mobile_number" value={formData.mobile_number} onChange={handleChange} placeholder="9876543210" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferred Languages</label>
                      <input type="text" name="language" value={formData.language} onChange={handleChange} placeholder="English, Tamil, etc." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Location</label>
                      <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, State" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Education */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Academic & Course Selection</h2>
                    <p className="text-sm text-slate-500 mt-1">Select the course you wish to enroll in.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Institution (College/School Name)</label>
                      <input type="text" name="college" value={formData.college} onChange={handleChange} placeholder="University Name" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Student ID / Roll No.</label>
                      <input type="text" name="school_college_id" value={formData.school_college_id} onChange={handleChange} placeholder="Optional" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Course Track <span className="text-red-500">*</span></label>
                      <select name="course_type" value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setFormData(p => ({...p, course_id: ''})) }} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm">
                        <option value="">Select Category</option>
                        {courseTypes.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Specific Course <span className="text-red-500">*</span></label>
                      <select name="course_id" value={formData.course_id} onChange={handleChange} disabled={!selectedType} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm disabled:opacity-40">
                        <option value="">{selectedType ? 'Choose Course' : 'Select Track First'}</option>
                        {filteredCourses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Files */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Verification Documents</h2>
                    <p className="text-sm text-slate-500 mt-1">Upload necessary files for identity verification.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passport Photo</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
                        <input type="file" name="photo" onChange={handleChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.photo ? formData.photo.name : 'Click to upload image'}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Resume</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
                        <input type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.resume ? formData.resume.name : 'Click to upload PDF'}</span>
                       </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Identity Proof (Aadhaar)</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
                        <input type="file" name="aadhar_card" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.aadhar_card ? formData.aadhar_card.name : 'Upload Aadhaar Card Copy'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Final */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Final Confirmation</h2>
                    <p className="text-sm text-slate-500 mt-1">Review your details before final submission.</p>
                  </div>
                  
                  <div className="max-w-xl mx-auto space-y-8">

                    <div className="bg-slate-50/80 rounded-[1.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-60" />
                      
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-sm">✅</span>
                        </span>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Declaration of Intent</h3>
                      </div>

                      <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 pt-1">
                          <input 
                            type="checkbox" 
                            id="terms" 
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-6 h-6 accent-indigo-600 cursor-pointer rounded-lg border-slate-200 transition-all hover:scale-110"
                          />
                        </div>
                        <label htmlFor="terms" className="text-[13px] text-slate-600 leading-relaxed font-semibold cursor-pointer select-none">
                          I confirm that I have read, understood, and agreed to the 
                          <button type="button" onClick={() => setModalConfig({ isOpen: true, type: 'tc' })} className="mx-1.5 text-indigo-600 font-bold hover:underline underline-offset-4">Student Terms & Conditions</button> 
                          and 
                          <button type="button" onClick={() => setModalConfig({ isOpen: true, type: 'privacy' })} className="mx-1.5 text-indigo-600 font-bold hover:underline underline-offset-4">Data Privacy Charter</button>.
                          <span className="block mt-4 text-slate-500 font-medium">
                            I acknowledge that providing false information or violating institutional policies may lead to immediate disqualification or termination of my enrollment.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-indigo-50/30 rounded-xl border border-indigo-100/50">
                      <MdShield className="text-indigo-600/60" size={18} />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                        Institutional Integrity & Data Sovereignty Protocol Active
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-16 flex justify-between items-center border-t border-slate-100 pt-8">
              <button 
                type="button" 
                onClick={prevStep} 
                disabled={currentStep === 1 || loading}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${currentStep === 1 ? 'invisible' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <MdChevronLeft size={20} /> Preview
              </button>
              
              {currentStep < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex items-center gap-2 px-10 py-3 text-sm font-bold bg-slate-900 text-white rounded-lg hover:shadow-lg transition-all active:scale-95"
                >
                  Continue <MdChevronRight size={20} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading || !agreedToTerms} 
                  className="flex items-center gap-2 px-10 py-3 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all active:scale-95 shadow-xl shadow-slate-900/10"
                >
                  {loading ? 'Submitting...' : 'Confirm Enrollment'}
                </button>
              )}
            </div>
          </div>
        </form>
        
        <footer className="mt-12 text-center pb-12 border-t border-slate-100/50 pt-12">
            <div className="flex items-center justify-center gap-8 mb-6 opacity-30 invert">
              <div className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] border border-slate-900 px-2 py-0.5 rounded">Verified Partner</div>
              <div className="text-[9px] font-black text-slate-900 uppercase tracking-[0.2em] border border-slate-900 px-2 py-0.5 rounded">AES-256 Encrypted</div>
            </div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] opacity-50">
              &copy; 2026 LMS GLOBAL <span className="mx-2">|</span> Institutional Faculty of Excellence
            </p>
        </footer>
      </main>

      {modalConfig.isOpen && (
        <Suspense fallback={null}>
          <LegalModal
            isOpen={modalConfig.isOpen}
            onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
            type={modalConfig.type}
          />
        </Suspense>
      )}
    </div>
  );
}
