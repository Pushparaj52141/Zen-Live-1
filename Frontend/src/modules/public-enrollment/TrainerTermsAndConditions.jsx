import React from 'react';
import { MdArrowBack, MdSecurity, MdGavel } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function TrainerTermsAndConditions() {
  const navigate = useNavigate();

  const sections = [
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

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-amber-100 selection:text-amber-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-2">
            <MdGavel className="text-3xl text-amber-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            TRAINER <span className="text-amber-600">Terms & Conditions</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium">
            Please read these terms carefully before registering as a trainer.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            {sections.map((section) => (
              <div key={section.id} className="group relative">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors">
                    {section.id}
                  </div>
                  <div className="space-y-2 pt-1.5">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-amber-600 transition-colors">
                      {section.title}
                    </h2>
                    <p className="text-gray-600 leading-relaxed text-base italic-content">
                      {section.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sticky Footer */}
          <div className="bg-gray-50/80 backdrop-blur-sm border-t border-gray-100 p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 text-gray-500">
              <MdSecurity className="text-xl text-green-500" />
              <span className="text-sm font-medium tracking-wide uppercase">Your information is secure and protected</span>
            </div>
            
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-8 py-3.5 bg-gray-900 text-white rounded-2xl font-bold transition-all hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5"
            >
              <MdArrowBack className="text-xl group-hover:-translate-x-1 transition-transform" />
              BACK TO ENROLLMENT
            </button>
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-xs text-gray-400 font-medium tracking-[0.2em] uppercase">
            &copy; {new Date().getFullYear()} LMS. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}
