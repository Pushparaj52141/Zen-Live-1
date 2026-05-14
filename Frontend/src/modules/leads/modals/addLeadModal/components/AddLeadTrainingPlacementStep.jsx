import React from "react";
import { FaBriefcase, FaCalendar, FaChalkboardTeacher } from "react-icons/fa";
import SearchableSelect from "@shared/components/SearchableSelect";

export default function AddLeadTrainingPlacementStep({
  cardType,
  cardTypeIds,
  trainingPlacementTab,
  setTrainingPlacementTab,
  cardTypeVisibility,
  courseStructure,
  trainers,
  fieldErrors,
  clearFieldError,
  setTrainerIdSingle,
  trainerIdSingle,
  trainingStatusSingle,
  setTrainingStatusSingle,
  trainingStartDateSingle,
  setTrainingStartDateSingle,
  trainingEndDateSingle,
  setTrainingEndDateSingle,
  trainerShare,
  setTrainerShare,
  getInputClasses,
  trainerShareAmount,
  amountPaidTrainer,
  pendingAmount,
  trainerPaidSingle,
  setTrainerPaidSingle,
  handleAddSubCourse,
  subCourseList,
  handleRemoveSubCourse,
  subCourses,
  handleSubCourseChange,
  TRAINING_STATUS_OPTIONS,
  placementTrainerId,
  setPlacementTrainerId,
  PLACEMENT_STATUS_OPTIONS,
  placementStatus,
  setPlacementStatus,
  placementStartDate,
  setPlacementStartDate,
  placementEndDate,
  setPlacementEndDate,
}) {
  return (
    <div className="space-y-4">
      {(() => {
        const selectedCardTypeId = String(cardType);
        const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
        const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);
        const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);

        if (isTrainingOnly) {
          return (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-50 border border-green-100 rounded-full">
                <FaChalkboardTeacher className="text-green-600 text-lg" />
                <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">
                  Training Details
                </h3>
              </div>
            </div>
          );
        }
        if (isPlacementOnly) {
          return (
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full">
                <FaBriefcase className="text-blue-600 text-lg" />
                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
                  Placement Details
                </h3>
              </div>
            </div>
          );
        }
        if (isBoth) {
          return (
            <div className="mb-6 flex justify-center">
              <div className="inline-flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTrainingPlacementTab("training")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    trainingPlacementTab === "training"
                      ? "bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md"
                      : "bg-transparent text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FaChalkboardTeacher className="text-sm" />
                  <span>Training Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTrainingPlacementTab("placement")}
                  className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
                    trainingPlacementTab === "placement"
                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md"
                      : "bg-transparent text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <FaBriefcase className="text-sm" />
                  <span>Placement Details</span>
                </button>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {trainingPlacementTab === "training" && cardTypeVisibility.showTraining && (
        <>
          {courseStructure === "single" ? (
            <div className="space-y-6">
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <p className="text-xs text-pink-800">
                  Single Course Training: Configure trainer and training details for one course.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Trainer <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={trainers.map((t) => ({ value: t.id, label: t.name }))}
                    value={trainerIdSingle}
                    onChange={(val) => {
                      setTrainerIdSingle(val);
                      clearFieldError("trainerIdSingle");
                    }}
                    error={!!fieldErrors.trainerIdSingle}
                    placeholder="Select Trainer"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training Status <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={TRAINING_STATUS_OPTIONS}
                    value={trainingStatusSingle}
                    onChange={(val) => {
                      setTrainingStatusSingle(val);
                      clearFieldError("trainingStatusSingle");
                    }}
                    error={!!fieldErrors.trainingStatusSingle}
                    placeholder="Select Status"
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training Start Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={trainingStartDateSingle}
                      onChange={(e) => setTrainingStartDateSingle(e.target.value)}
                      className="w-full border rounded-md px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FaCalendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training End Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={trainingEndDateSingle}
                      onChange={(e) => setTrainingEndDateSingle(e.target.value)}
                      className="w-full border rounded-md px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <FaCalendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t">
                <h4 className="text-xs font-semibold text-green-700 mb-4">
                  Trainer Payment Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Trainer Share (%)
                    </label>
                    <input
                      type="number"
                      value={trainerShare}
                      onChange={(e) => {
                        setTrainerShare(e.target.value);
                        clearFieldError("trainerShare");
                      }}
                      placeholder="Enter Trainer Share Percentage"
                      min="0"
                      max="100"
                      className={getInputClasses("trainerShare")}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Trainer Share Amount
                    </label>
                    <input
                      type="text"
                      value={trainerShareAmount}
                      placeholder="Auto Calculated"
                      readOnly
                      className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Amount Paid to Trainer
                    </label>
                    <input
                      type="number"
                      value={amountPaidTrainer}
                      readOnly
                      className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Pending Amount to Pay
                    </label>
                    <input
                      type="text"
                      value={pendingAmount}
                      placeholder="Auto Calculated"
                      readOnly
                      className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={trainerPaidSingle}
                        onChange={(e) => setTrainerPaidSingle(e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                      <span className="text-xs font-medium text-gray-700">
                        Trainer Payment Completed
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-semibold text-gray-700">Sub-Courses</h4>
                <button
                  type="button"
                  onClick={handleAddSubCourse}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-xs font-medium"
                >
                  + Add Sub-Course
                </button>
              </div>

              {subCourseList.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-xs text-gray-500 mb-2">No sub-courses added yet</p>
                  <p className="text-xs text-gray-400">
                    Click 'Add Sub-Course' to begin assigning courses to trainers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subCourseList.map((sub, idx) => (
                    <div key={idx} className="border rounded-lg p-4 bg-gray-50 space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="text-xs font-medium text-gray-700">Sub-Course {idx + 1}</h5>
                        <button
                          type="button"
                          onClick={() => handleRemoveSubCourse(idx)}
                          className="text-red-600 hover:text-red-800 text-base font-bold"
                        >
                          ×
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Sub-Course <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={subCourses.map((sc) => ({
                              value: sc.sub_course_id,
                              label: sc.sub_course_name,
                            }))}
                            value={sub.sub_course_id}
                            onChange={(val) => handleSubCourseChange(idx, "sub_course_id", val)}
                            error={!!fieldErrors[`subCourse_${idx}`]}
                            placeholder="Select Sub-Course"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer <span className="text-red-500">*</span>
                          </label>
                          <SearchableSelect
                            options={trainers.map((t) => ({ value: t.id, label: t.name }))}
                            value={sub.trainer_id}
                            onChange={(val) => handleSubCourseChange(idx, "trainer_id", val)}
                            error={!!fieldErrors[`subTrainer_${idx}`]}
                            placeholder="Select Trainer"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer Share (%)
                          </label>
                          <input
                            type="number"
                            value={sub.trainer_share}
                            onChange={(e) =>
                              handleSubCourseChange(idx, "trainer_share", e.target.value)
                            }
                            min="0"
                            max="100"
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer Share Amount
                          </label>
                          <input
                            type="text"
                            value={sub.trainer_share_amount}
                            readOnly
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount Paid to Trainer
                          </label>
                          <input
                            type="number"
                            value={sub.amount_paid_to_trainer}
                            readOnly
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pending Amount
                          </label>
                          <input
                            type="text"
                            value={sub.pending_amount}
                            readOnly
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs bg-gray-100 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <SearchableSelect
                            options={TRAINING_STATUS_OPTIONS}
                            value={sub.training_status}
                            onChange={(val) => handleSubCourseChange(idx, "training_status", val)}
                            placeholder="Select Status"
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={sub.training_start_date}
                            onChange={(e) =>
                              handleSubCourseChange(idx, "training_start_date", e.target.value)
                            }
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={sub.training_end_date}
                            onChange={(e) =>
                              handleSubCourseChange(idx, "training_end_date", e.target.value)
                            }
                            className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={sub.trainer_paid}
                              onChange={(e) =>
                                handleSubCourseChange(idx, "trainer_paid", e.target.checked)
                              }
                              className="w-3.5 h-3.5"
                            />
                            <span className="text-xs font-medium text-gray-700">
                              Trainer Payment Status (Check if payment has been completed)
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {trainingPlacementTab === "placement" && cardTypeVisibility.showPlacement && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Trainer <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={trainers.map((t) => ({ value: t.id, label: t.name }))}
                value={placementTrainerId}
                onChange={(val) => {
                  setPlacementTrainerId(val);
                  clearFieldError("placementTrainerId");
                }}
                error={!!fieldErrors.placementTrainerId}
                placeholder="Select Trainer"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status <span className="text-red-500">*</span>
              </label>
              <SearchableSelect
                options={PLACEMENT_STATUS_OPTIONS}
                value={placementStatus}
                onChange={(val) => {
                  setPlacementStatus(val);
                  clearFieldError("placementStatus");
                }}
                error={!!fieldErrors.placementStatus}
                placeholder="Select Placement Status"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Placement Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={placementStartDate}
                  onChange={(e) => setPlacementStartDate(e.target.value)}
                  className="w-full border rounded-md px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaCalendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Placement End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={placementEndDate}
                  onChange={(e) => setPlacementEndDate(e.target.value)}
                  className="w-full border rounded-md px-2.5 py-1.5 pr-8 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaCalendar className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
