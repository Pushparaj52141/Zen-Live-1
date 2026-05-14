import React from 'react';
import { MdArrowBack, MdSecurity, MdGavel } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

export default function TermsAndConditions() {
  const navigate = useNavigate();

  const sections = [
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

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-100 mb-2">
            <MdGavel className="text-3xl text-indigo-600" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">
            STUDENT <span className="text-indigo-600">Terms & Conditions</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg text-gray-500 font-medium">
            Please read these terms carefully before enrolling in our programs.
          </p>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="p-8 sm:p-12 space-y-10">
            {sections.map((section) => (
              <div key={section.id} className="group relative">
                <div className="flex gap-6">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 font-bold text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {section.id}
                  </div>
                  <div className="space-y-2 pt-1.5">
                    <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
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
              BACK TO REGISTRATION
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
