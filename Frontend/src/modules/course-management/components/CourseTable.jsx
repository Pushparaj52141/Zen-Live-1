import React from "react";
import CourseTableRow from "./CourseTableRow";

const CourseTable = ({
  courses,
  loading,
  onEdit,
  onDelete,
  onManageSubCourses,
  colors,
}) => {
  return (
    <div
      className="rounded-md border overflow-hidden bg-white"
      style={{ borderColor: colors ? `${colors.primary}30` : "#e5e7eb" }}
    >
      <div className="max-h-[800px] overflow-y-auto">
        <table className="min-w-full text-center">
          <thead
            className="sticky top-0 text-white text-sm"
            style={{ backgroundColor: colors ? colors.primary : "#3b82f6" }}
          >
            <tr>
              <th className="px-6 py-3 font-semibold text-center">COURSE ID</th>
              <th className="px-6 py-3 font-semibold text-center">COURSE NAME</th>
              <th className="px-6 py-3 font-semibold text-center">COURSE TYPE</th>
              <th className="px-6 py-3 font-semibold text-center">ACTIONS</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center"
                  style={{ color: colors ? `${colors.primary}80` : "#6b7280" }}
                >
                  Loading…
                </td>
              </tr>
            ) : courses.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center"
                  style={{ color: colors ? `${colors.primary}80` : "#6b7280" }}
                >
                  No courses found.
                </td>
              </tr>
            ) : (
              courses.map((course, index) => (
                <CourseTableRow
                  key={course.course_id || index}
                  course={course}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onManageSubCourses={onManageSubCourses}
                  colors={colors}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CourseTable;
