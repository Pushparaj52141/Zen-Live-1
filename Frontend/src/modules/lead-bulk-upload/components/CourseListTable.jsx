import React from "react";

export default function CourseListTable({ courseList }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xl font-semibold">Course List With IDs</h3>
      <table className="min-w-full border border-gray-200 bg-white">
        <thead className="bg-gray-50">
          <tr>
            <th className="border px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Course ID
            </th>
            <th className="border px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Course Name
            </th>
            <th className="border px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide">
              Course Type
            </th>
          </tr>
        </thead>
        <tbody>
          {courseList.length === 0 ? (
            <tr>
              <td className="border px-4 py-3">&nbsp;</td>
              <td className="border px-4 py-3">&nbsp;</td>
              <td className="border px-4 py-3">&nbsp;</td>
            </tr>
          ) : (
            courseList.map((course) => (
              <tr key={course.course_id} className="odd:bg-white even:bg-gray-50">
                <td className="border px-4 py-2">{course.course_id}</td>
                <td className="border px-4 py-2">{course.course_name}</td>
                <td className="border px-4 py-2">{course.course_type}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}

