import React from "react";
import BulkUploadInstructions from "./components/BulkUploadInstructions";
import CourseListTable from "./components/CourseListTable";
import { useLeadBulkUploadController } from "./hooks/useLeadBulkUploadController";

export default function BulkUpload() {
  const {
    courseList,
    dropText,
    isSubmitting,
    dropboxRef,
    fileInputRef,
    onClickDropbox,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    handleSubmit,
    handleExport,
    handleDownloadSample,
    mandatoryText,
    optionalText,
  } = useLeadBulkUploadController();

  return (
    <div className="space-y-6 max-w-6xl mt-8 px-4 md:px-6">
      {/* Upload area + buttons */}
      <form id="bulkUploadForm" onSubmit={handleSubmit} className="space-y-4">
        <div
          id="dropbox"
          ref={dropboxRef}
          onClick={onClickDropbox}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className="p-8 min-h-[120px] w-full max-w-3xl border-2 border-dashed border-blue-400 rounded-lg text-center cursor-pointer text-gray-600"
        >
          {dropText}
        </div>

        <input
          id="csvFile"
          type="file"
          accept=".csv"
          ref={fileInputRef}
          onChange={onFileChange}
          className="hidden"
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Uploading…" : "Upload CSV"}
          </button>
          <button
            id="exportLeadsButton"
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Export Leads
          </button>
        </div>
      </form>

      <BulkUploadInstructions
        mandatoryText={mandatoryText}
        optionalText={optionalText}
        onDownloadSample={handleDownloadSample}
      />
      <CourseListTable courseList={courseList} />
    </div>
  );
}

