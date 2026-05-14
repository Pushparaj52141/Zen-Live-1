import React from "react";
import {
  MdPersonAdd,
  MdGroupAdd,
  MdSwapHoriz,
  MdShare,
  MdContentCopy,
  MdClose,
  MdCheckCircle,
  MdOpenInNew,
} from "react-icons/md";
import StudentEnrollmentsMain from "@modules/student-enrollments/StudentEnrollmentsMain";
import TrainerEnrollmentsMain from "@modules/trainer-enrollments/TrainerEnrollmentsMain";
import { useEnrollmentRecordsController } from "./hooks/useEnrollmentRecordsController";

export default function EnrollmentRecordsMain() {
  const {
    activeTab,
    setActiveTab,
    showShareModal,
    setShowShareModal,
    copied,
    shareUrl,
    isStudent,
    handleCopy,
    handleOpenLink,
    toggleTab,
  } = useEnrollmentRecordsController();

  return (
    <div className="flex flex-col min-h-screen bg-[#f0f1f5]">
      <div className="flex items-center justify-between px-6 pt-5 pb-3 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setActiveTab("student")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "student"
                ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            <MdPersonAdd className="text-base" />
            Student Registration
          </button>

          <MdSwapHoriz
            className="text-gray-400 text-xl flex-shrink-0 cursor-pointer hover:text-gray-600 transition-colors"
            title="Switch view"
            onClick={toggleTab}
          />

          <button
            onClick={() => setActiveTab("trainer")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              activeTab === "trainer"
                ? "bg-orange-500 text-white shadow-md scale-[1.02]"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
            }`}
          >
            <MdGroupAdd className="text-base" />
            Instructor Enrollment
          </button>
        </div>

        <button
          onClick={() => setShowShareModal(true)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all duration-200 shadow-sm hover:shadow-md ${
            isStudent
              ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              : "border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
          }`}
          title="Share enrollment form URL"
        >
          <MdShare className="text-base" />
          Share URL
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "student" ? <StudentEnrollmentsMain /> : <TrainerEnrollmentsMain />}
      </div>

      {showShareModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => e.target === e.currentTarget && setShowShareModal(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
            <div className={`h-1 ${isStudent ? "bg-blue-500" : "bg-orange-500"}`} />
            <div className="flex items-center justify-between px-6 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full ${
                    isStudent ? "bg-blue-100" : "bg-orange-100"
                  }`}
                >
                  <MdShare className={`text-xl ${isStudent ? "text-blue-600" : "text-orange-500"}`} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900">Share Link</h2>
                  <p className="text-[11px] text-gray-500">
                    {isStudent ? "Student Registration Link" : "Instructor Enrollment Link"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-300 hover:text-gray-500 transition-colors rounded-full p-1 hover:bg-gray-100"
              >
                <MdClose className="text-xl" />
              </button>
            </div>

            <div className="px-6 pb-6">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                Public Form URL
              </p>
              <div
                className={`flex items-center gap-0 rounded-xl border-2 overflow-hidden transition-all ${
                  isStudent
                    ? "border-blue-200 focus-within:border-blue-400"
                    : "border-orange-200 focus-within:border-orange-400"
                }`}
              >
                <div className="flex-1 px-3 py-3 bg-gray-50 text-sm text-gray-700 font-mono truncate select-all">
                  {shareUrl}
                </div>
                <button
                  onClick={handleCopy}
                  title={copied ? "Copied!" : "Copy to clipboard"}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-all duration-200 flex-shrink-0 ${
                    copied
                      ? "bg-green-500 text-white"
                      : isStudent
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {copied ? (
                    <>
                      <MdCheckCircle className="text-base" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <MdContentCopy className="text-base" />
                      Copy
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={handleOpenLink}
                className={`mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                  isStudent
                    ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                    : "border-orange-200 text-orange-600 hover:bg-orange-50"
                }`}
              >
                <MdOpenInNew className="text-base" />
                Open Form in New Tab
              </button>

              <p className="mt-4 text-[11px] text-gray-400 text-center leading-relaxed">
                Share this link so {isStudent ? "students" : "instructor applicants"} can fill out the{" "}
                {isStudent ? "registration" : "enrollment"} form directly.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
