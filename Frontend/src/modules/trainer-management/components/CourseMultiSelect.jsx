import React, { useState } from "react";
import { FiCheck, FiX } from "react-icons/fi";

export function CourseMultiSelect({ label, selectedIds, onChange, courses, primaryColor }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative mb-4">
      <label className="block text-sm font-medium mb-1" style={{ color: primaryColor }}>
        {label}
      </label>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-lg border px-3 py-2.5 bg-white cursor-pointer flex flex-wrap gap-1 min-h-[42px] items-center"
        style={{ borderColor: `${primaryColor}80` }}
      >
        {selectedIds.length === 0 ? (
          <span className="text-gray-400 text-sm">Select Courses Handling</span>
        ) : (
          selectedIds.map((id) => {
            const course = courses.find((c) => c.course_id === id);
            return (
              <span
                key={id}
                className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-md flex items-center gap-1"
              >
                {course?.course_name || id}
                <FiX
                  className="hover:text-red-500"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(id);
                  }}
                />
              </span>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="absolute z-[60] mt-1 w-full bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto p-2">
          <div className="flex justify-between items-center px-2 py-1 mb-2 border-b">
            <span className="text-xs font-bold text-gray-500">AVAILABLE COURSES</span>
            <button type="button" onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
              <FiX />
            </button>
          </div>
          {courses.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">No courses found</div>
          ) : (
            courses.map((course) => (
              <div
                key={course.course_id}
                onClick={() => onChange(course.course_id)}
                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition-colors ${
                  selectedIds.includes(course.course_id) ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50"
                }`}
              >
                <span>{course.course_name}</span>
                {selectedIds.includes(course.course_id) && <FiCheck />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
