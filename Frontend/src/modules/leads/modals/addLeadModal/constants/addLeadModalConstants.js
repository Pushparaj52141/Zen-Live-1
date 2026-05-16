import { getCountryOptionsForSelect } from "@shared/utils/countryMobileValidation";

export const STEPS = [
  { label: "Basic Info" },
  { label: "Course Info" },
  { label: "Payment Info" },
  { label: "Training & Placement" },
];

export const STATUS_OPTIONS = [
  { value: "enquiry", label: "Enquiry" },
  { value: "prospect", label: "Prospect" },
  { value: "enrollment", label: "Enrollment" },
  { value: "trainingprogress", label: "Training Progress" },
  { value: "handsonproject", label: "Hands on Project" },
  { value: "certification", label: "Certification" },
  { value: "cvbuild", label: "CV Build" },
  { value: "mockinterviews", label: "Mock Interviews" },
  { value: "liveinterviews", label: "Live Interviews" },
  { value: "placement", label: "Placement" },
  { value: "placementdue", label: "Placement Due" },
  { value: "placementpaid", label: "Placement Paid" },
  { value: "finishers", label: "Finishers" },
  { value: "jobsupport", label: "Job Support" },
  { value: "onhold", label: "On Hold" },
];

export const TRAINING_STATUS_OPTIONS = [
  { value: "nottaken", label: "Not Taken" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "onhold", label: "On Hold" },
  { value: "completed", label: "Completed" },
];

export const PLACEMENT_STATUS_OPTIONS = [
  { value: "working", label: "Working" },
  { value: "notworking", label: "Not Working" },
];

export const COUNTRY_CODES = getCountryOptionsForSelect();
