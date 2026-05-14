import React from "react";
import SearchableSelect from "@shared/components/SearchableSelect";

export default function AddLeadCourseInfoStep({
  assignees,
  assignee,
  setAssignee,
  clearFieldError,
  fieldErrors,
  units,
  unit,
  setUnit,
  cardTypes,
  cardType,
  setCardType,
  courseTypes,
  courseType,
  setCourseType,
  setCourse,
  filteredCourses,
  course,
  batches,
  selectedBatchIds,
  setSelectedBatchIds,
  cardTypeIds,
  courseStructure,
  setCourseStructure,
  setSubCourseList,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4 text-gray-800">Course Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Assign To <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={assignees.map((a) => ({ value: String(a.id), label: a.name }))}
            value={assignee}
            onChange={(val) => {
              setAssignee(val);
              clearFieldError("assignee");
            }}
            error={!!fieldErrors.assignee}
            placeholder="Select Assignee"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Business Unit <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={units.map((u) => ({ value: String(u.id), label: u.name }))}
            value={unit}
            onChange={(val) => {
              setUnit(val);
              clearFieldError("unit");
            }}
            error={!!fieldErrors.unit}
            placeholder="Select Business Unit"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Card Type <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={cardTypes.map((c) => {
              const cardId = c.id || c.card_type_id;
              const cardIdStr = cardId != null ? String(cardId) : "";
              return {
                value: cardIdStr,
                label: c.name || c.card_type_name,
              };
            })}
            value={cardType}
            onChange={(val) => {
              const selectedValue = val;
              setCardType(selectedValue);
              clearFieldError("cardType");
            }}
            error={!!fieldErrors.cardType}
            placeholder={cardTypes.length === 0 ? "Loading card types..." : "Select Card Type"}
            disabled={cardTypes.length === 0}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Course Type <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={courseTypes.map((ct) => ({
              value: ct.id || ct.course_type,
              label: ct.name || ct.course_type,
            }))}
            value={courseType}
            onChange={(val) => {
              setCourseType(val);
              setCourse("");
              clearFieldError("courseType");
              clearFieldError("course");
            }}
            error={!!fieldErrors.courseType}
            placeholder="Select Course Type"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={filteredCourses.map((c) => {
              const courseId = c.course_id || c.id;
              const courseIdStr = courseId != null ? String(courseId) : "";
              return {
                value: courseIdStr,
                label: c.course_name || c.name,
              };
            })}
            value={course}
            onChange={(val) => {
              setCourse(val);
              clearFieldError("course");
            }}
            error={!!fieldErrors.course}
            placeholder="Select Course"
            disabled={!courseType}
            className="w-full"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Batch (select one or more)
          </label>
          <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
            <div className="flex flex-col gap-1.5">
              {batches.map((b) => {
                const bid = String(b.id ?? b.batch_id ?? "");
                const bname = b.name || b.batch_name || bid;
                const checked = selectedBatchIds.map(String).includes(bid);
                return (
                  <label
                    key={bid}
                    className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                  >
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      checked={checked}
                      onChange={(e) => {
                        setSelectedBatchIds((prev) => {
                          const s = prev.map(String);
                          if (e.target.checked) {
                            if (!s.includes(bid)) return [...prev, bid];
                            return prev;
                          }
                          return prev.filter((x) => String(x) !== bid);
                        });
                      }}
                    />
                    <span>{bname}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {String(cardType) !== String(cardTypeIds.PLACEMENT) && (
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Course Structure <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              options={[
                { value: "single", label: "Single Course Training" },
                { value: "multiple", label: "Multiple Courses Training" },
              ]}
              value={courseStructure}
              onChange={(val) => {
                setCourseStructure(val);
                clearFieldError("courseStructure");
                if (val === "single") {
                  setSubCourseList([]);
                }
              }}
              error={!!fieldErrors.courseStructure}
              placeholder="Select Course Structure"
              className="w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
