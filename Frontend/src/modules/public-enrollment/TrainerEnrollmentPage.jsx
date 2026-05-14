import React, { lazy, Suspense, useState } from 'react';
import apiClient from '../../shared/api/client';
import { 
  MdCheckCircle, 
  MdError, 
  MdChevronRight, 
  MdChevronLeft, 
  MdPersonOutline, 
  MdWorkOutline, 
  MdFolderOpen, 
  MdAssignmentTurnedIn,
  MdShield,
  MdFileUpload
} from 'react-icons/md';
import { Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
const LegalModal = lazy(() => import('./LegalModal'));

export default function TrainerEnrollmentPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, type: 'tc' });
  
  const [formData, setFormData] = useState({
    trainer_name: '',
    trainer_email: '',
    trainer_mobile: '',
    specialization: '',
    experience_years: '',
    bio: '',
    certifications: '',
    language: '',
    role: '',
    resume: null,
    aadhar_card: null,
    photo: null,
    employee_id: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.trainer_name || !formData.trainer_email || !formData.trainer_mobile) {
        toast.error('Identity fields are required');
        return;
      }
    }
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => setCurrentStep(prev => prev - 1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error('Please accept the agreement');
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) data.append(key, formData[key]);
      });
      await apiClient.post('/api/enrollment/trainer', data);
      setSubmitted(true);
      toast.success('Application Submitted');
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
          <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-200/40 rounded-full blur-[130px]" />
          <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[110px]" />
        </div>

        <div className="relative z-10 bg-white/80 backdrop-blur-2xl p-12 md:p-16 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] border border-white max-w-lg w-full text-center animate-in zoom-in duration-700">
          <div className="w-20 h-20 bg-orange-50 text-orange-600 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner transform rotate-6 animate-pulse">
            <MdCheckCircle size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Instructor Enrollment</h2>
          <p className="text-slate-500 mb-10 text-lg font-medium leading-relaxed">Your professional credentials have been received. Our evaluation board will review your profile and contact you shortly.</p>
          <button 
            onClick={() => window.location.href = '/enroll/trainer'} 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-orange-600 transition-all hover:shadow-[0_20px_40px_-10px_rgba(234,88,12,0.3)] active:scale-[0.98] uppercase tracking-widest text-xs"
          >
            Submit Another Enrollment
          </button>
        </div>
      </div>
    );
  }

  const steps = [
    { label: 'Identity', icon: <MdPersonOutline /> },
    { label: 'Experience', icon: <MdWorkOutline /> },
    { label: 'Credentialing', icon: <MdFolderOpen /> },
    { label: 'Agreement', icon: <MdAssignmentTurnedIn /> }
  ];

  return (
    <div className="min-h-screen premium-mesh-bg flex flex-col font-inter text-slate-900 relative overflow-hidden">
      <Toaster position="top-center" />

      {/* Mesh Background Blobs */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-orange-200/40 rounded-full blur-[130px] animate-pulse duration-[10s]" />
        <div className="absolute bottom-[-5%] right-[-5%] w-[40%] h-[40%] bg-amber-100/40 rounded-full blur-[110px]" />
      </div>
      
      <header className="py-6 px-8 max-w-6xl mx-auto w-full flex justify-between items-center bg-white/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 transform rotate-6 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-black text-xl">I</span>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none"><span className="text-orange-600 uppercase">Instructor Enrollment</span></h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.3em] mt-1.5 opacity-80">Faculty Credentialing Portal</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-8">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-2 transition-all duration-500 ${currentStep === i + 1 ? 'opacity-100 scale-105' : 'opacity-30'}`}>
              <span className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-lg font-bold transition-all ${currentStep >= i + 1 ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' : 'bg-white/50 text-slate-400 border border-slate-100'}`}>
                {i + 1}
              </span>
              <span className={`text-[11px] font-black uppercase tracking-widest ${currentStep === i + 1 ? 'text-orange-700' : 'text-slate-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full p-6 md:p-10">
        <form onSubmit={handleSubmit} className="bg-white/90 backdrop-blur-sm border border-white rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.05)] ring-1 ring-slate-200/50">
          <div className="h-1.5 bg-slate-100 w-full overflow-hidden">
            <div className="h-full bg-orange-600 shadow-[0_0_15px_rgba(234,88,12,0.3)] transition-all duration-700 ease-in-out" style={{ width: `${(currentStep / steps.length) * 100}%` }} />
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
              {/* Identity Details */}
              {currentStep === 1 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Primary Identity</h2>
                    <p className="text-sm text-slate-500 mt-1">Foundational information for your instructor profile.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name <span className="text-red-500">*</span></label>
                      <input type="text" name="trainer_name" value={formData.trainer_name} onChange={handleChange} placeholder="Dr. Jane Smith" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:bg-white focus:border-slate-900 transition-all"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email <span className="text-red-500">*</span></label>
                      <input type="email" name="trainer_email" value={formData.trainer_email} onChange={handleChange} placeholder="jane@faculty.edu" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact No <span className="text-red-500">*</span></label>
                      <input type="tel" name="trainer_mobile" value={formData.trainer_mobile} onChange={handleChange} placeholder="9876543210" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Languages Known</label>
                      <input type="text" name="language" value={formData.language} onChange={handleChange} placeholder="English, German, etc." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Experience */}
              {currentStep === 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Professional Background</h2>
                    <p className="text-sm text-slate-500 mt-1">Specify your areas of expertise and tenure.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Current Designation</label>
                      <input type="text" name="role" value={formData.role} onChange={handleChange} placeholder="Senior Consultant" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Work Experience (Years)</label>
                      <input type="number" name="experience_years" value={formData.experience_years} onChange={handleChange} placeholder="5 years" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Employee ID</label>
                      <input type="text" name="employee_id" value={formData.employee_id} onChange={handleChange} placeholder="Internal usage" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Certifications</label>
                      <input type="text" name="certifications" value={formData.certifications} onChange={handleChange} placeholder="PMP, ITIL, Azure, etc." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm"/>
                    </div>
                    {/* <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Domain Specialization</label>
                      <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Data Engineering / Cognitive Psychology" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg outline-none text-sm focus:bg-white focus:border-slate-900 transition-all" />
                    </div> */}
                    <div className="md:col-span-2">
                       <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Professional Statement (Bio)</label>
                       <textarea name="bio" value={formData.bio} onChange={handleChange} rows="4" className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm resize-none focus:bg-white focus:border-orange-600/50 transition-all shadow-sm" placeholder="Briefly summarize your teaching philosophy and experience..." />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Verification */}
              {currentStep === 3 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-10">
                    <h2 className="text-xl font-semibold text-slate-800">Documents</h2>
                    <p className="text-sm text-slate-500 mt-1">Upload supporting documentation for your appointment.</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Passport size photo</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group">
                        <input type="file" name="photo" onChange={handleChange} accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.photo ? formData.photo.name : 'Upload JPEG/PNG'}</span>
                       </div>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Curriculum Vitae (CV)</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group">
                        <input type="file" name="resume" onChange={handleChange} accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.resume ? formData.resume.name : 'Upload PDF/Doc'}</span>
                       </div>
                    </div>
                    <div className="md:col-span-2 flex flex-col gap-2">
                       <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aadhaar Card</label>
                       <div className="relative border border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 hover:bg-slate-50 transition-colors text-center group">
                        <input type="file" name="aadhar_card" onChange={handleChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <MdFileUpload className="mx-auto text-slate-400 group-hover:text-slate-600 mb-2" size={24} />
                        <span className="text-xs font-medium text-slate-600">{formData.aadhar_card ? formData.aadhar_card.name : 'Identity Verification Scan'}</span>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: End */}
              {currentStep === 4 && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="mb-12 text-center">
                    <h2 className="text-xl font-semibold text-slate-800">Final Review</h2>
                    <p className="text-sm text-slate-500 mt-1">Please confirm your registration to join the faculty.</p>
                  </div>

                  <div className="max-w-xl mx-auto space-y-6">
                    <div className="bg-slate-50/80 rounded-[1.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-full blur-2xl -mr-8 -mt-8 opacity-60" />
                      
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <span className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <span className="text-sm">✅</span>
                        </span>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Formal Declaration</h3>
                      </div>

                      <div className="flex items-start gap-5 relative z-10">
                        <div className="flex-shrink-0 pt-1">
                          <input 
                            type="checkbox" 
                            id="terms" 
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="w-6 h-6 accent-orange-600 cursor-pointer rounded-lg border-slate-200 transition-all hover:scale-110"
                          />
                        </div>
                        <label htmlFor="terms" className="text-[13px] text-slate-600 leading-relaxed font-semibold cursor-pointer select-none">
                          I confirm that I have read, understood, and agreed to the above 
                          <button type="button" onClick={() => setModalConfig({ isOpen: true, type: 'trainer-tc' })} className="mx-1.5 text-orange-600 font-bold hover:underline underline-offset-4">Trainer Terms & Conditions</button> 
                          and 
                          <button type="button" onClick={() => setModalConfig({ isOpen: true, type: 'privacy' })} className="mx-1.5 text-orange-600 font-bold hover:underline underline-offset-4">Privacy Charter</button>.
                          <span className="block mt-4 text-slate-500 font-medium">
                            I acknowledge that violation of these terms may result in termination of my association and legal action where applicable.
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-orange-50/30 rounded-xl border border-orange-100/50">
                      <MdShield className="text-orange-600/60" size={18} />
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                        Institutional Integrity & Data Sovereignty Protocol Active
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-16 flex justify-between items-center border-t border-slate-100 pt-8">
              <button 
                type="button" 
                onClick={prevStep} 
                disabled={currentStep === 1 || loading}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${currentStep === 1 ? 'invisible' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
              >
                <MdChevronLeft size={20} /> Back
              </button>
              
              {currentStep < 4 ? (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="px-12 py-3.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:shadow-lg transition-all active:scale-95"
                >
                  Continue
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading || !agreedToTerms} 
                  className="px-12 py-3.5 text-sm font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-all shadow-xl shadow-slate-900/10"
                >
                  {loading ? 'Processing...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </div>
        </form>
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
