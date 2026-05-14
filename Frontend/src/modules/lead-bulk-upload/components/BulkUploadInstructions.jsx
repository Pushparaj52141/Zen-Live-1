import React from "react";

export default function BulkUploadInstructions({
  mandatoryText,
  optionalText,
  onDownloadSample,
}) {
  return (
    <section className="space-y-3">
      <h3 className="text-2xl font-semibold">Bulk Upload Instructions</h3>
      <p className="text-sm">
        <span className="font-semibold text-red-600">*</span>
        <span className="ml-1 font-semibold">Mandatory Fields:</span> {mandatoryText}
      </p>
      <p className="text-sm">
        <span className="font-semibold">Optional Fields:</span> {optionalText}
      </p>
      <button
        onClick={onDownloadSample}
        className="rounded bg-pink-600 px-4 py-2 text-white hover:bg-pink-700"
      >
        Download Sample CSV
      </button>
    </section>
  );
}

