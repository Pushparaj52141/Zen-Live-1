import { useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import {
  BULK_UPLOAD_INSTRUCTIONS,
  DEFAULT_DROP_TEXT,
} from "../constants/leadBulkUploadConstants";
import { leadBulkUploadService } from "../services/leadBulkUploadService";

export function useLeadBulkUploadController() {
  const [courseList, setCourseList] = useState([]);
  const [dropText, setDropText] = useState(DEFAULT_DROP_TEXT);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dropboxRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCoursesForValidation();
  }, []);

  async function fetchCoursesForValidation() {
    try {
      const response = await leadBulkUploadService.getCourses();
      const data = response.data;
      if (Array.isArray(data)) {
        setCourseList(data);
      } else if (Array.isArray(data?.courses)) {
        setCourseList(data.courses);
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    }
  }

  function onClickDropbox() {
    fileInputRef.current?.click();
  }

  function onDragOver(e) {
    e.preventDefault();
    dropboxRef.current?.classList.add("dragover");
  }

  function onDragLeave() {
    dropboxRef.current?.classList.remove("dragover");
  }

  function handleFileSelect(file) {
    setSelectedFile(file);
    setDropText(file.name);
  }

  async function showInvalidFileError(message) {
    await Swal.fire({
      icon: "error",
      title: "Invalid File",
      text: message,
      confirmButtonColor: "#dc3545",
    });
  }

  function onDrop(e) {
    e.preventDefault();
    dropboxRef.current?.classList.remove("dragover");
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].name.endsWith(".csv")) {
      handleFileSelect(files[0]);
    } else {
      showInvalidFileError("Please drop a valid CSV file.");
    }
  }

  function onFileChange(e) {
    const file = e.target.files[0];
    if (file && file.name.endsWith(".csv")) {
      handleFileSelect(file);
    } else {
      showInvalidFileError("Please select a valid CSV file.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!selectedFile) {
      await Swal.fire({
        icon: "warning",
        title: "No File Selected",
        text: "Please select a file to upload.",
        confirmButtonColor: "#ffc107",
      });
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const { data } = await leadBulkUploadService.uploadCsv(formData);
      await Swal.fire({
        icon: "success",
        title: "Upload Complete",
        text: data.message || "Leads uploaded successfully!",
        confirmButtonColor: "#28a745",
      });
      window.location.reload();
    } catch (error) {
      const result = error.response?.data;
      if (result) {
        const errorMessage = result.error || "Upload Failed";
        const errorDetails =
          Array.isArray(result.issues) && result.issues.length > 0
            ? result.issues.join("\n")
            : result.details || "Unknown error occurred.";
        await Swal.fire({
          icon: "error",
          title: errorMessage,
          html: `<pre style="text-align:left;white-space:pre-wrap">${errorDetails}</pre>`,
          confirmButtonColor: "#dc3545",
          width: 600,
        });
      } else {
        await Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Failed to upload leads due to a network issue.",
          confirmButtonColor: "#dc3545",
        });
      }
      setIsSubmitting(false);
    }
  }

  function downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleExport(e) {
    e.preventDefault();
    try {
      const response = await leadBulkUploadService.exportLeadsCsv();
      downloadBlob(response.data, "leads.csv");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  async function handleDownloadSample(e) {
    e.preventDefault();
    try {
      const response = await leadBulkUploadService.downloadSampleCsv();
      downloadBlob(response.data, "sample_leads.csv");
    } catch (error) {
      console.error("Error:", error);
    }
  }

  return {
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
    mandatoryText: BULK_UPLOAD_INSTRUCTIONS.mandatory,
    optionalText: BULK_UPLOAD_INSTRUCTIONS.optional,
  };
}

