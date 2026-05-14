import React from 'react';
import { MdClose, MdSecurity, MdGavel, MdLock } from 'react-icons/md';

const TC_CONTENT = [
  {
    id: 1,
    title: "Conduct & Discipline",
    content: "Students must maintain professional behavior. Any misconduct, abuse, harassment, or inappropriate behavior may lead to termination from the program without refund."
  },
  {
    id: 2,
    title: "Fee & Refund Policy",
    content: "All course fees paid are non-refundable and non-transferable under any circumstances. In case a student is unable to continue the enrolled batch, the student may opt for an alternate batch or service (subject to availability) within the validity period. Dropping out of the course midway does not make the student eligible for any fee refund. Fees once paid cannot be adjusted against any other student or third party."
  },
  {
    id: 3,
    title: "Batch & Attendance Policy",
    content: "Batches will continue as per schedule regardless of individual student absence. Student absence will not be a reason to pause, reschedule, or extend the batch. Recorded sessions (if applicable) will be shared for missed classes. Regular attendance and participation are mandatory for successful completion."
  },
  {
    id: 4,
    title: "Course Completion & Certification",
    content: "Certification (if applicable) will be issued only upon Successful completion of full training along with submission of required assignments/projects and Meeting attendance criteria."
  },
  {
    id: 5,
    title: "Placement Assistance Disclaimer",
    content: "We provide placement assistance. Placement opportunities depend upon Student performance, Skills and assessment results along with Market conditions."
  },
  {
    id: 6,
    title: "Company Hiring Requirements",
    content: "The company does not guarantee salary, designation, location, or timeline of placement. Final hiring decisions are solely made by the recruiting company."
  },
  {
    id: 7,
    title: "Intellectual Property",
    content: "Course materials, recordings, notes, and content are the intellectual property of the company. Sharing, distributing, copying, or reselling training content is strictly prohibited. Legal actions may be taken in case of any violation."
  },
  {
    id: 8,
    title: "Technical Requirements",
    content: "Students are responsible for having a working laptop/system and required software installations."
  },
  {
    id: 9,
    title: "Schedule Changes",
    content: "The company reserves the right to change trainers, reschedule sessions, and modify curriculum (to match industry standards). Any such change will be communicated in advance."
  },
  {
    id: 10,
    title: "Validity Period",
    content: "Course access and placement support are valid only for the defined duration from the date of enrollment."
  },
  {
    id: 11,
    title: "Liability Limitation",
    content: "The company shall not be liable for indirect or consequential losses, missed job opportunities, or market fluctuations affecting hiring."
  }
];

const TRAINER_TC_CONTENT = [
  {
    id: 1,
    title: "Professional Commitment",
    content: "Trainer must conduct sessions as per the approved batch schedule. Last-minute class cancellations (except genuine emergencies) are strictly prohibited. Trainer must inform the academic team at least 24 hours in advance for any rescheduling request. Repeated cancellations or irregular attendance may result in termination of association and payment recovery."
  },
  {
    id: 2,
    title: "Punctuality & Time Discipline",
    content: "Trainer must join sessions on time and utilize the complete scheduled duration. Frequent late joining, early exits, or reduced session hours will not be tolerated. Continuous delays may lead to payment deductions or removal from the batch."
  },
  {
    id: 3,
    title: "Course Completion Responsibility",
    content: "Trainer must complete the assigned syllabus within the defined course timeline. Unapproved extension of course duration (1–2 months or more) is strictly prohibited. Any requirement for extension must be formally approved by the management. Intentional delay in syllabus completion will be treated as professional misconduct."
  },
  {
    id: 4,
    title: "Academic Quality & Delivery Standards",
    content: "Trainer must follow the approved curriculum and training structure. Trainers are expected to provide structured lessons, assign practical tasks, conduct assessments where required, and maintain professional communication. Poor quality delivery or repeated student complaints may lead to review and removal."
  },
  {
    id: 5,
    title: "Non-Solicitation of Students (Strict Policy)",
    content: "Trainer shall NOT collect student phone numbers, emails, or personal contact details for personal use. Conducting private training sessions for enrolled students outside the organization, offering parallel courses or mentorship independently to current students, and direct or indirect student poaching are strictly prohibited. Violation will result in immediate termination and possible legal action."
  },
  {
    id: 6,
    title: "Financial Conduct & Fee Collection",
    content: "Trainer must NOT collect money directly from students for any reason, ask for additional payments for materials, doubt-clearing sessions, projects, certifications, or placement support, or promote paid external services to enrolled students. All financial transactions must go only through the organization. Any unauthorized financial dealing will lead to immediate termination and legal consequences."
  },
  {
    id: 7,
    title: "Confidentiality & Intellectual Property",
    content: "Training materials, student data, recordings, curriculum, and internal processes are confidential. Trainer shall not copy, reuse, resell, or distribute company materials without written approval. Student databases must not be stored or used for personal benefit."
  },
  {
    id: 8,
    title: "Conflict of Interest",
    content: "Trainer must disclose if they are working with competing organizations. Conducting similar training for direct competitors without disclosure may lead to termination. Trainers must not misuse company resources for personal brand promotion."
  },
  {
    id: 9,
    title: "Communication & Conduct",
    content: "Trainer must maintain professional behavior at all times. Abusive language, discrimination, harassment, or unprofessional behavior toward students or staff will not be tolerated. The organization reserves the right to suspend or terminate trainers based on verified complaints."
  },
  {
    id: 10,
    title: "Performance Monitoring",
    content: "Sessions may be monitored or recorded for quality and compliance purposes. Trainer performance will be evaluated based on student feedback, completion timelines, engagement levels, and professional discipline."
  },
  {
    id: 11,
    title: "Payment & Association Terms",
    content: "Payments are subject to compliance with schedule, course completion, and professional conduct. Non-compliance with the above policies may lead to payment hold, payment deduction, and immediate termination. The organization reserves the right to discontinue association without prior notice in case of serious misconduct."
  }
];

const PRIVACY_CONTENT = [
  {
    title: "1. Information Collection",
    content: "We collect personal information such as your name, email address, mobile number, and educational background specifically for the purpose of processing your enrollment and providing educational services."
  },
  {
    title: "2. Document Storage",
    content: "Uploaded documents (ID cards, photos, resumes) are stored securely and are only accessible by authorized personnel for verification and administrative purposes."
  },
  {
    title: "3. Data Sharing",
    content: "We do NOT share your personal information with any third-party marketing agencies. Your data is used exclusively for training and placement coordination."
  },
  {
    title: "4. Cookies & Tracking",
    content: "Our application uses session cookies to maintain your login state and provide a seamless navigation experience. No intrusive tracking is performed."
  }
];

export default function LegalModal({ isOpen, onClose, type = 'tc' }) {
  if (!isOpen) return null;

  const isTrainerTc = type === 'trainer-tc';
  const isTc = type === 'tc' || isTrainerTc;
  const tcData = isTrainerTc ? TRAINER_TC_CONTENT : TC_CONTENT;
  const accentColor = isTrainerTc ? 'amber' : 'indigo';

  const getTitle = () => {
    if (isTrainerTc) return 'Trainer Terms & Conditions';
    if (type === 'tc') return 'Terms & Conditions';
    return 'Privacy Policy';
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-3xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white/90 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${isTrainerTc ? 'bg-amber-50 text-amber-600' : isTc ? 'bg-indigo-50 text-indigo-600' : 'bg-indigo-50 text-indigo-600'}`}>
              {isTc ? <MdGavel /> : <MdLock />}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                {getTitle()}
              </h2>
              <p className="text-sm text-gray-400 font-medium">Please review carefully</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
          >
            <MdClose className="text-xl" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-8 custom-scrollbar">
          {isTc ? (
            tcData.map((section) => (
              <div key={section.id} className="flex gap-5 group">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400 transition-colors ${isTrainerTc ? 'group-hover:bg-amber-50 group-hover:text-amber-600' : 'group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                  {section.id}
                </div>
                <div className="space-y-2">
                  <h3 className={`font-bold text-gray-900 transition-colors ${isTrainerTc ? 'group-hover:text-amber-600' : 'group-hover:text-indigo-600'}`}>{section.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed italic-content">{section.content}</p>
                </div>
              </div>
            ))
          ) : (
            PRIVACY_CONTENT.map((section, idx) => (
              <div key={idx} className="space-y-3 p-6 rounded-2xl bg-gray-50/50 border border-gray-50 group hover:bg-white hover:border-indigo-100 transition-all">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{section.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{section.content}</p>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 bg-slate-50/90 backdrop-blur-sm border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-400">
            <MdSecurity className="text-green-500 text-lg" />
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Secure document</span>
          </div>
          <button 
            onClick={onClose}
            className="px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all shadow-lg hover:shadow-gray-200"
          >
            I UNDERSTAND
          </button>
        </div>
      </div>
    </div>
  );
}
