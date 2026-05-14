
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSelector } from "react-redux";

import Swal from "sweetalert2";

import apiClient, { API_BASE_URL } from "@shared/api/client";
import { sanitizeHtml } from "@shared/security/sanitizeHtml";

import { endpoints } from "@shared/api/endpoints";

import courseService from "@shared/services/courses/courseService";

import lookupService from "@shared/services/lookups/lookupService";

import { MdCheck, MdEdit, MdDelete } from "react-icons/md";
import SearchableSelect from "../../../shared/components/SearchableSelect";
import {
  getCountryOptionsForSelect,
  validateMobileByCountry,
  stripMobileSpaces as stripMobile,
} from "@shared/utils/countryMobileValidation";
import {
  discountedTotalWithGst,
  feeBalanceFromBaseDiscounted,
  placementBalanceFromBase,
} from "@shared/utils/feeGst";

import {
  FaRegThumbsUp,
  FaThumbsUp,
  FaRegSmile,
  FaEllipsisV,
  FaReply,
  FaBold,
  FaItalic,
  FaListUl,
  FaListOl,
  FaCheckSquare,
  FaLink,
  FaImage,
  FaAt,
  FaTable,
  FaCode,
  FaPlus,
  FaUnderline,
  FaChalkboardTeacher,
  FaBriefcase,
  FaBell,
  FaCalendarAlt,
} from "react-icons/fa";

// CSS for contentEditable placeholder
const editorStyles = `
  [contenteditable][data-placeholder]:empty:before {
    content: attr(data-placeholder);
    color: #9CA3AF;
    pointer-events: none;
    position: absolute;
  }
  
  [contenteditable]:focus {
    outline: none;
  }
  
  [contenteditable] ul {
    list-style-type: disc;
    margin-left: 20px;
    padding-left: 10px;
  }
  
  [contenteditable] ol {
    list-style-type: decimal;
    margin-left: 20px;
    padding-left: 10px;
  }
  
  [contenteditable] li {
    margin-bottom: 4px;
  }
`;

const FIELD_LABELS = {
  name: "Name",
  mobile_number: "Mobile Number",
  email: "Email",
  role_id: "Role",
  college_company: "College/Company",
  location: "Location",
  source_id: "Source",
  referred_by: "Referred By",
  meta_campaign_id: "Meta Campaign",
  status: "Status",
  course_type: "Course Type",
  course_id: "Course",
  batch_id: "Batch",
  batch_ids: "Batch",
  user_id: "Assigned To",
  unit_id: "Business Unit",
  card_type_id: "Card Type",
  course_structure: "Course Structure",
  trainer_id: "Trainer",
  training_status: "Training Status",
  training_start_date: "Training Start Date",
  training_end_date: "Training End Date",
  trainer_share: "Trainer Share (%)",
  trainer_share_amount: "Trainer Share Amount",
  amount_paid_trainer: "Amount Paid to Trainer",
  pending_amount: "Pending Amount",
  actual_fee: "Actual Fee",
  discounted_fee: "Discounted Fee (before 6% GST)",
  fee_paid: "Fee Paid",
  fee_balance: "Fee Balance",
  paid_status: "Paid Status",
  placement_fee: "Placement Actual Fee",
  placement_discounted_fee: "Placement Discounted Fee (before 6% GST)",
  placement_paid: "Placement Paid",
  placement_balance: "Placement Balance",
  placement_paid_status: "Placement Paid Status",
  priority: "Priority",
  requirements: "Requirements",
  inquired_course: "Inquired Course (Unmatched)",
};

const REQUIRED_FIELDS = new Set([
  "name",
  "mobile_number",
  "source_id",
  "status",
  "priority",
  "course_type",
  "course_id",
  "user_id",
  "unit_id",
  "card_type_id",
  "course_structure",
]);

/** batch_ids from API/pg may be a real array, JSON string, or array-like object — not always Array.isArray. */
function normalizeBatchIdStrings(lead) {
  if (!lead) return [];
  const raw = lead.batch_ids;
  const toStrIds = (arr) =>
    [
      ...new Set(
        arr
          .map((x) => parseInt(String(x), 10))
          .filter((n) => !Number.isNaN(n))
      ),
    ].map(String);

  if (raw == null || raw === "") {
    if (lead.batch_id != null && lead.batch_id !== "") {
      const id = parseInt(String(lead.batch_id), 10);
      return !Number.isNaN(id) ? [String(id)] : [];
    }
    return [];
  }
  if (Array.isArray(raw)) return toStrIds(raw);
  if (typeof raw === "string") {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return toStrIds(p);
      if (p && typeof p === "object") return toStrIds(Object.values(p));
    } catch {
      return [];
    }
    return [];
  }
  if (typeof raw === "object") return toStrIds(Object.values(raw));
  return [];
}

function batchNamesFromOptions(idStrings, options) {
  if (!idStrings.length) return [];
  if (!options?.length) return idStrings;
  return idStrings.map((idStr) => {
    const o = options.find(
      (opt) => String(opt.batch_id || opt.id || opt.value) === String(idStr)
    );
    return o?.batch_name || o?.name || o?.label || idStr;
  });
}

function resolveBatchDisplayLabels(leadData, options) {
  const ids = normalizeBatchIdStrings(leadData);
  if (ids.length && options?.length) {
    const names = batchNamesFromOptions(ids, options).filter(Boolean);
    if (names.length) return names;
  }
  if (leadData?.all_batch_names && String(leadData.all_batch_names).trim()) {
    return leadData.all_batch_names
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (leadData?.batch_name) return [leadData.batch_name];
  return [];
}

const COUNTRY_CODES = getCountryOptionsForSelect();

const STEPS = [
  { label: "Basic Info" },

  { label: "Course Info" },

  { label: "Payment Info" },

  { label: "Training & Placement" },
];

const STATUS_OPTIONS = [
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
  { value: "onhold", label: "On Hold" },
];


const STATUS_PRIORITY = STATUS_OPTIONS.reduce((acc, option, index) => {
  acc[String(option.value).toLowerCase()] = index;
  return acc;
}, {});

const TRAINING_STATUS_OPTIONS = [
  { value: "nottaken", label: "Not Taken" },

  { value: "scheduled", label: "Scheduled" },

  { value: "in_progress", label: "In Progress" },

  { value: "onhold", label: "On Hold" },

  { value: "completed", label: "Completed" },
];

const PLACEMENT_STATUS_OPTIONS = [
  { value: "working", label: "Working" },
  { value: "notworking", label: "Not Working" },
];

const toIntOrNull = (val) => {
  if (
    val === null ||
    val === undefined ||
    String(val).trim() === "" ||
    String(val) === "undefined"
  )
    return null;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

const toFloatOrZero = (val) => {
  if (val === null || val === undefined || String(val).trim() === "") return 0;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : parsed;
};

const normalizeTrainingStatusValue = (val) => {
  if (!val) return "nottaken";
  const normalized = String(val)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  // Map common variations to standard values
  if (normalized === "inprogress") return "in_progress";
  if (normalized === "notstarted") return "nottaken";
  return normalized || "nottaken";
};

const EditLeadForm = ({ open, onClose, leadId, onSaved }) => {
  const authUser = useSelector((state) => state.auth.user);
  const [currentStep, setCurrentStep] = useState(0);

  const [loading, setLoading] = useState(false);

  const [leadData, setLeadData] = useState(null);

  // Editing state for inline editing

  const [editingField, setEditingField] = useState(null);

  const [editValue, setEditValue] = useState("");
  const [editCountryCode, setEditCountryCode] = useState("+91");
  const [editManualCountryCode, setEditManualCountryCode] = useState("");

  // Dropdown Data

  const [courseTypes, setCourseTypes] = useState([]);

  const [courses, setCourses] = useState([]);

  const [trainers, setTrainers] = useState([]);

  const [batches, setBatches] = useState([]);

  const [assignees, setAssignees] = useState([]);

  const [units, setUnits] = useState([]);

  const [cardTypes, setCardTypes] = useState([]);

  const [sources, setSources] = useState([]);

  const [roles, setRoles] = useState([]);

  const [metaCampaigns, setMetaCampaigns] = useState([]);

  // Card Type IDs mapping

  const [cardTypeIds, setCardTypeIds] = useState({
    TRAINING: null,

    PLACEMENT: null,

    BOTH: null,
  });

  const [trainingPlacementTab, setTrainingPlacementTab] = useState("training");

  // Combined course edit state
  const [editingCourse, setEditingCourse] = useState(false);
  const [tempCourseType, setTempCourseType] = useState("");
  const [tempCourse, setTempCourse] = useState("");

  // Comments state

  const [commentTab, setCommentTab] = useState("all");

  const [commentsList, setCommentsList] = useState([]);

  const [loadingComments, setLoadingComments] = useState(false);

  const [savingComment, setSavingComment] = useState(false);

  const [editingId, setEditingId] = useState(null);

  const [optionsOpen, setOptionsOpen] = useState(false);

  const [commentLikes, setCommentLikes] = useState({}); // { commentId: [user1, user2, ...] }
  const [commentReactions, setCommentReactions] = useState({}); // { commentId: { emoji: [user1, user2, ...] } }
  const [showEmojiPicker, setShowEmojiPicker] = useState(null); // commentId or null
  const [showMenuId, setShowMenuId] = useState(null); // commentId or null for dropdown menu
  const [showFormattingMenu, setShowFormattingMenu] = useState(false); // for toolbar formatting dropdown
  const [showEmojiPickerToolbar, setShowEmojiPickerToolbar] = useState(false); // for toolbar emoji picker
  const editorRef = useRef(null);

  const editRef = useRef(null);

  const emojiPickerRef = useRef(null);
  const [subCourseList, setSubCourseList] = useState([]);
  const [availableSubCourses, setAvailableSubCourses] = useState([]);
  const [savingSubCourses, setSavingSubCourses] = useState(false);
  const [followUpAtLocal, setFollowUpAtLocal] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [inlineErrors, setInlineErrors] = useState({});
  const [editingMeta, setEditingMeta] = useState({
    label: "",
    required: false,
  });
  const normalizedLeadId = useMemo(
    () => String(leadId ?? "").trim(),
    [leadId]
  );
  const baseTrainingFee = useMemo(() => {
    const discounted = parseFloat(leadData?.discounted_fee);
    if (Number.isFinite(discounted) && discounted > 0) {
      const withGst = discountedTotalWithGst(discounted);
      return withGst != null ? withGst : 0;
    }
    const actual = parseFloat(leadData?.actual_fee);
    return Number.isFinite(actual) && actual > 0 ? actual : 0;
  }, [leadData?.discounted_fee, leadData?.actual_fee]);

  const notifyLeadUpdated = useCallback(() => {
    try {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("zen:leadUpdated"));
      }
    } catch (err) {
      // Failed to dispatch lead update event
    }
  }, []);

  const showToast = useCallback((options = {}) => {
    const { icon = "success", title = "", text = "", timer = 2000 } = options;
    Swal.fire({
      toast: true,
      position: "top-end",
      icon,
      title,
      text,
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
    });
  }, []);

  const applyFollowUpFromLead = useCallback((ld) => {
    if (!ld) return;
    const toDatetimeLocal = (d) => {
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    if (ld.follow_up_at) {
      const t = new Date(ld.follow_up_at);
      if (!Number.isNaN(t.getTime())) {
        setFollowUpAtLocal(toDatetimeLocal(t));
      } else {
        setFollowUpAtLocal("");
      }
    } else if (ld.follow_up_date) {
      const day =
        typeof ld.follow_up_date === "string"
          ? ld.follow_up_date.slice(0, 10)
          : new Date(ld.follow_up_date).toISOString().slice(0, 10);
      setFollowUpAtLocal(`${day}T10:00`);
    } else {
      setFollowUpAtLocal("");
    }
    setFollowUpNote(ld.follow_up_note ? String(ld.follow_up_note) : "");
  }, []);

  const handleSaveFollowUp = useCallback(async () => {
    if (!leadId || !leadData) return;
    setSavingFollowUp(true);
    try {
      let follow_up_at = null;
      let follow_up_date = null;
      if (followUpAtLocal && String(followUpAtLocal).trim() !== "") {
        const inst = new Date(followUpAtLocal);
        if (!Number.isNaN(inst.getTime())) {
          follow_up_at = inst.toISOString();
          follow_up_date = String(followUpAtLocal).trim().slice(0, 10);
        }
      }
      const payload = {
        ...leadData,
        follow_up_at,
        follow_up_date,
        follow_up_note: followUpNote?.trim() ? followUpNote.trim() : null,
      };
      await apiClient.put(`${endpoints.leads.root}/${leadId}`, payload);
      setLeadData(payload);
      showToast({ icon: "success", title: "Follow-up reminder saved" });
      notifyLeadUpdated();
    } catch {
      showToast({
        icon: "error",
        title: "Could not save reminder",
        text: "Try again.",
      });
    } finally {
      setSavingFollowUp(false);
    }
  }, [
    leadId,
    leadData,
    followUpAtLocal,
    followUpNote,
    showToast,
    notifyLeadUpdated,
  ]);

  const setFollowUpPresetDays = useCallback((days) => {
    const t = new Date();
    t.setDate(t.getDate() + days);
    t.setHours(10, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, "0");
    setFollowUpAtLocal(
      `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`
    );
  }, []);

  const formatFollowUpDateTime = useCallback((value) => {
    if (!value) return "";
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }, []);

  const savedFollowUpDateTime = useMemo(() => {
    if (leadData?.follow_up_at) {
      return formatFollowUpDateTime(leadData.follow_up_at);
    }
    if (leadData?.follow_up_date) {
      const parsed = new Date(`${String(leadData.follow_up_date).slice(0, 10)}T10:00`);
      return formatFollowUpDateTime(parsed);
    }
    return "";
  }, [leadData?.follow_up_at, leadData?.follow_up_date, formatFollowUpDateTime]);


  // Check if source is Referral
  const sourceFlags = useMemo(() => {
    if (!leadData || !sources.length) {
      return { isReferralSource: false, isMetaAdsSource: false };
    }
    const rawSourceId = leadData.source_id;
    let sourceId = "";
    if (rawSourceId === null || rawSourceId === undefined) {
      sourceId = "";
    } else if (typeof rawSourceId === "object" && rawSourceId !== null) {
      sourceId = rawSourceId.id || rawSourceId.value || rawSourceId.name || "";
    } else {
      sourceId = rawSourceId;
    }
    const normalizedName = (
      sources.find(
        (s) =>
          String(s.id || s.value || "").toLowerCase() ===
          String(sourceId).toLowerCase()
      )?.name || ""
    ).toLowerCase();
    const isReferralSource = normalizedName === "referral";
    const isMetaAdsSource =
      normalizedName.includes("meta") ||
      normalizedName.includes("facebook");
    return { isReferralSource, isMetaAdsSource };
  }, [leadData, sources]);
  const isReferralSource = sourceFlags.isReferralSource;
  const isMetaAdsSource = sourceFlags.isMetaAdsSource;

  // Filter courses based on the selected course_type
  const filteredCourses = useMemo(() => {
    if (!leadData?.course_type || !courses.length) return courses;
    
    // Extract course_type value - handle both objects and primitive values
    let selectedCourseType = leadData.course_type;
    if (selectedCourseType && typeof selectedCourseType === "object") {
      selectedCourseType = selectedCourseType.id || selectedCourseType.value || selectedCourseType.name || "";
    }
    
    if (!selectedCourseType) return courses;
    
    return courses.filter((c) => {
      const courseTypeValue = c.course_type || c.courseType || c.type || "";
      return String(courseTypeValue) === String(selectedCourseType);
    });
  }, [leadData?.course_type, courses]);

  // Filter courses for the temporary course type during editing
  const filteredCoursesForEdit = useMemo(() => {
    if (!tempCourseType || !courses.length) return courses;
    
    return courses.filter((c) => {
      const courseTypeValue = c.course_type || c.courseType || c.type || "";
      return String(courseTypeValue) === String(tempCourseType);
    });
  }, [tempCourseType, courses]);

  // Show Enrollment ID when lead reaches Enrollment (or later)
  const showEnrollmentId = useMemo(() => {
    if (!leadData) return false;

    const rawStatus = leadData.status;
    let statusValue = "";
    if (rawStatus === null || rawStatus === undefined) {
      statusValue = "";
    } else if (typeof rawStatus === "object" && rawStatus !== null) {
      statusValue =
        rawStatus.value ||
        rawStatus.id ||
        rawStatus.name ||
        rawStatus.status ||
        "";
    } else {
      statusValue = rawStatus;
    }

    const normalizedStatus = String(statusValue).toLowerCase();
    const currentRank = STATUS_PRIORITY[normalizedStatus];
    const enrollmentRank = STATUS_PRIORITY["enrollment"];

    if (typeof enrollmentRank !== "number") {
      return false;
    }

    if (typeof currentRank !== "number") {
      return false;
    }

    return currentRank >= enrollmentRank;
  }, [leadData]);

  // Fetch lead data

  useEffect(() => {
    if (!open || !normalizedLeadId) return;

    let isCancelled = false;

    const fetchLead = async () => {
      setLeadData(null);
      setLoading(true);

      const maxAttempts = 3;
      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await apiClient.get(
            `${endpoints.leads.root}/${normalizedLeadId}`
          );
          const fetchedLead =
            response?.data?.lead ?? response?.data?.data ?? response?.data ?? null;

          if (!fetchedLead || typeof fetchedLead !== "object") {
            throw new Error("Lead data is empty");
          }

          if (!fetchedLead.priority) {
            fetchedLead.priority = "normal";
          }

          const idStrs = normalizeBatchIdStrings(fetchedLead);
          fetchedLead.batch_ids = idStrs
            .map((s) => parseInt(s, 10))
            .filter((n) => !Number.isNaN(n));

          if (isCancelled) return;
          setLeadData(fetchedLead);
          applyFollowUpFromLead(fetchedLead);
          setLoading(false);
          return;
        } catch (error) {
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 350 * attempt));
            continue;
          }
          if (isCancelled) return;
          showToast({
            icon: "error",
            title: "Error",
            text: "Failed to load lead data",
          });
          setLoading(false);
        }
      }
    };

    fetchLead();
    return () => {
      isCancelled = true;
    };
  }, [open, normalizedLeadId, applyFollowUpFromLead, showToast]);

  // Auto-select tab based on card type
  useEffect(() => {
    if (!leadData?.card_type_id) return;
    const selectedCardTypeId = String(leadData.card_type_id);
    if (selectedCardTypeId === String(cardTypeIds.PLACEMENT)) {
      setTrainingPlacementTab("placement");
    } else {
      setTrainingPlacementTab("training");
    }
  }, [leadData?.card_type_id, cardTypeIds]);

  const fetchMetaCampaigns = useCallback(async () => {
    try {
      const response = await apiClient.get(endpoints.metaCampaigns.apiRoot);
      setMetaCampaigns(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setMetaCampaigns([]);
    }
  }, []);

  // Fetch dropdown data

  useEffect(() => {
    if (!open) {
      setMetaCampaigns([]);
      return;
    }

    const fetchAllData = async () => {
      // Fetch course types
      courseService.getCourseTypes().then((res) => {
        if (res?.success) {
          const data = res.data || [];
          const normalized = data.map((ct) => {
            if (typeof ct === "string") return { id: ct, name: ct, course_type: ct };
            return {
              id: ct.id || ct.course_type || ct,
              name: ct.name || ct.course_type || String(ct),
              course_type: ct.course_type || ct.name || ct,
            };
          });
          setCourseTypes(normalized);
        }
      });

      // Fetch courses
      courseService.getCourses().then((res) => {
        if (res?.success) {
          const data = res.data || [];
          let raw = data;
          if (data.courses && Array.isArray(data.courses)) raw = data.courses;
          else if (data.data && Array.isArray(data.data)) raw = data.data;

          const normalized = (Array.isArray(raw) ? raw : []).map((c) => ({
            course_id: c.course_id || c.id || c._id,
            id: c.course_id || c.id || c._id,
            course_name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            course_type: c.course_type || c.courseType || c.type || "",
            _raw: c,
          }));
          setCourses(normalized);
        }
      });

      // Fetch trainers
      lookupService.getTrainers().then((res) => {
        if (res?.success) {
          const data = res.data || [];
          const normalized = data.map((t) => ({
            id: t.id || t.trainer_id || t._raw?.trainer_id || t._raw?.id,
            trainer_id: t.trainer_id || t.id || t._raw?.trainer_id || t._raw?.id,
            name: t.name || t.trainer_name || t._raw?.trainer_name || t._raw?.name || `Trainer ${t.id || t.trainer_id}`,
            trainer_name: t.trainer_name || t.name || t._raw?.trainer_name || t._raw?.name || `Trainer ${t.id || t.trainer_id}`,
            _raw: t._raw || t,
          }));
          setTrainers(normalized);
        }
      });

      // Fetch batches
      lookupService.getBatches().then((res) => {
        if (res?.success) setBatches(res.data || []);
      });

      // Fetch assignees
      lookupService.getAssignees().then((res) => {
        if (res?.success) setAssignees(res.data || []);
      });

      // Fetch units
      lookupService.getUnits().then((res) => {
        if (res?.success) setUnits(res.data || []);
      });

      // Fetch card types
      lookupService.getCardTypes().then((res) => {
        if (res?.success) {
          const data = res.data || [];
          setCardTypes(data);
          const ids = { TRAINING: null, PLACEMENT: null, BOTH: null };
          data.forEach((card) => {
            const label = String(card.name || "").toLowerCase();
            if (label.includes("training") && label.includes("placement")) ids.BOTH = card.id;
            else if (label === "training only") ids.TRAINING = card.id;
            else if (label === "placement only") ids.PLACEMENT = card.id;
          });
          setCardTypeIds(ids);
        }
      });

      // Fetch sources
      lookupService.getSources().then((res) => {
        if (res?.success) setSources(res.data || []);
      });

      // Fetch roles
      lookupService.getRoles().then((res) => {
        if (res?.success) setRoles(res.data || []);
      });
    };

    fetchAllData();
  }, [open]);

  useEffect(() => {
    if (open && isMetaAdsSource) {
      fetchMetaCampaigns();
    } else {
      setMetaCampaigns([]);
    }
  }, [fetchMetaCampaigns, isMetaAdsSource, open]);

  const autoFillSubCourseAmounts = useCallback(
    (list = []) =>
      list.map((sub) => {
        const sharePercent = parseFloat(sub.trainer_share) || 0;
        const paidAmount = parseFloat(sub.amount_paid_trainer) || 0;
        let shareAmount = sub.trainer_share_amount ?? "";
        if (baseTrainingFee > 0 && sharePercent > 0) {
          shareAmount = ((baseTrainingFee * sharePercent) / 100).toFixed(2);
        }
        let pendingAmount = sub.pending_amount ?? "";
        if (
          shareAmount !== "" &&
          shareAmount !== null &&
          !Number.isNaN(parseFloat(shareAmount))
        ) {
          pendingAmount = (parseFloat(shareAmount) - paidAmount).toFixed(2);
        }
        return {
          ...sub,
          trainer_share_amount: shareAmount === null ? "" : shareAmount,
          pending_amount: pendingAmount === null ? "" : pendingAmount,
        };
      }),
    [baseTrainingFee]
  );

  // Sync sub-course list from lead data when editing an existing record
  useEffect(() => {
    if (
      leadData &&
      leadData.course_structure &&
      String(leadData.course_structure).toLowerCase().startsWith("multiple") &&
      Array.isArray(leadData.sub_courses)
    ) {
      const mapped = leadData.sub_courses.map((sub, idx) => ({
        tempId: sub.sub_course_id || sub.id || `existing-${idx}`,
        sub_course_id: sub.sub_course_id || sub.id || "",
        sub_course_name: sub.sub_course_name || sub.name || "",
        trainer_id: sub.trainer_id || sub.trainerId || "",
        trainer_share: sub.trainer_share ?? "",
        trainer_share_amount: sub.trainer_share_amount ?? "",
        amount_paid_trainer:
          sub.amount_paid_trainer ??
          sub.amount_paid ??
          sub.amount_paid_to_trainer ??
          "",
        pending_amount: sub.pending_amount ?? "",
        training_status: sub.training_status || "nottaken",
        training_start_date: sub.training_start_date || "",
        training_end_date: sub.training_end_date || "",
      }));
      setSubCourseList(autoFillSubCourseAmounts(mapped));
    } else {
      setSubCourseList([]);
    }
  }, [
    autoFillSubCourseAmounts,
    leadData?.course_structure,
    leadData?.sub_courses,
  ]);

  // Fetch available sub-courses when lead course changes
  useEffect(() => {
    if (!leadData?.course_id) {
      setAvailableSubCourses([]);
      return;
    }

    let cancelled = false;
    const fetchSubCoursesForLead = async () => {
      try {
        const response = await apiClient.get(endpoints.courses.subCourses, {
          params: { course_id: leadData.course_id },
        });
        if (!cancelled) {
          setAvailableSubCourses(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (error) {
        if (!cancelled) {
          setAvailableSubCourses([]);
        }
      }
    };

    fetchSubCoursesForLead();
    return () => {
      cancelled = true;
    };
  }, [leadData?.course_id]);

  // Handle field edit

  const handleStartEdit = (field, value, meta = {}) => {
    if (field === "batch_ids" && leadData) {
      const ids = normalizeBatchIdStrings(leadData);
      setEditingField(field);
      setEditingMeta({
        label: meta.label || FIELD_LABELS[field] || field,
        required:
          typeof meta.required === "boolean"
            ? meta.required
            : REQUIRED_FIELDS.has(field),
      });
      setEditValue(JSON.stringify(ids));
      setInlineErrors((prev) => {
        if (!prev[field]) return prev;
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return;
    }

    setEditingField(field);

    setEditingMeta({
      label: meta.label || FIELD_LABELS[field] || field,
      required:
        typeof meta.required === "boolean"
          ? meta.required
          : REQUIRED_FIELDS.has(field),
    });
    // For select fields, ensure value is converted to string for proper matching
    let valueToSet =
      value !== null && value !== undefined ? String(value) : "";
    setEditValue(valueToSet);
    if (field === "mobile_number" && leadData) {
      const cc = leadData.country_code || "+91";
      setEditCountryCode(cc);
      setEditManualCountryCode("");
    }
    setInlineErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCancelEdit = () => {
    setInlineErrors((prev) => {
      if (!prev[editingField]) return prev;
      const next = { ...prev };
      delete next[editingField];
      return next;
    });
    setEditingField(null);

    setEditingMeta({
      label: "",
      required: false,
    });
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingField) return;

    const trimmedValue =
      typeof editValue === "string" ? editValue.trim() : editValue;
    const fieldLabel =
      editingMeta.label || FIELD_LABELS[editingField] || "Field";
    const isEmpty =
      trimmedValue === "" ||
      trimmedValue === null ||
      trimmedValue === undefined;

    // Only block saving if the field is required AND empty
    if (isEmpty && editingMeta.required) {
      setInlineErrors((prev) => ({
        ...prev,
        [editingField]: `${fieldLabel} is required and cannot be empty.`,
      }));
      return;
    }

    try {
      // For date fields, convert YYYY-MM-DD format back to ISO string if needed
      let valueToSave = editValue;
      if (editingField.includes("date") || editingField.includes("Date")) {
        if (editValue && editValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Convert YYYY-MM-DD to ISO format
          const date = new Date(editValue + "T00:00:00");
          valueToSave = date.toISOString();
        }
      }

      // Discounted amounts are stored pre-GST; keep inline edit input pre-GST
      if (editingField === "discounted_fee") {
        const base = parseFloat(trimmedValue);
        valueToSave =
          Number.isFinite(base) && base > 0
            ? base
            : null;
      }
      if (editingField === "placement_discounted_fee") {
        const base = parseFloat(trimmedValue);
        valueToSave =
          Number.isFinite(base) && base > 0
            ? base
            : null;
      }

      let updatedLead;
      if (editingField === "batch_ids") {
        let ids = [];
        try {
          ids = JSON.parse(editValue || "[]");
        } catch {
          ids = [];
        }
        if (!Array.isArray(ids)) ids = [];
        const numericIds = [
          ...new Set(
            ids
              .map((x) => parseInt(String(x), 10))
              .filter((n) => !Number.isNaN(n))
          ),
        ];
        const idStrs = numericIds.map(String);
        updatedLead = {
          ...leadData,
          batch_ids: numericIds,
          batch_id: numericIds[0] ?? null,
          all_batch_names: batchNamesFromOptions(idStrs, batches).join(", "),
        };
      } else {
        updatedLead = {
          ...leadData,

          [editingField]: valueToSave,
        };
      }

      // Mobile number: validate by country and send country_code + stripped digits
      if (editingField === "mobile_number") {
        const finalCountryCode =
          editCountryCode === "manual" ? editManualCountryCode : editCountryCode;
        if (!finalCountryCode || String(finalCountryCode).trim() === "") {
          setInlineErrors((prev) => ({
            ...prev,
            mobile_number: "Country code is required.",
          }));
          return;
        }
        const mobileDigits = stripMobile(trimmedValue);
        const validation = validateMobileByCountry(mobileDigits, finalCountryCode);
        if (!validation.valid) {
          setInlineErrors((prev) => ({
            ...prev,
            mobile_number: validation.message,
          }));
          return;
        }
        updatedLead.country_code = String(finalCountryCode).trim();
        updatedLead.mobile_number = mobileDigits;
      }

      // Auto-calculate Training Fee Balance (GST-inclusive total vs paid)

      if (editingField === "discounted_fee" || editingField === "fee_paid") {
        const baseDiscount =
          parseFloat(
            editingField === "discounted_fee"
              ? valueToSave
              : leadData.discounted_fee
          ) || 0;

        const paid =
          parseFloat(
            editingField === "fee_paid" ? editValue : leadData.fee_paid
          ) || 0;

        updatedLead.fee_balance = feeBalanceFromBaseDiscounted(
          baseDiscount,
          paid
        );
      }

      // Auto-calculate Placement Fee Balance

      if (
        editingField === "placement_discounted_fee" ||
        editingField === "placement_paid"
      ) {
        const paid =
          parseFloat(
            editingField === "placement_paid"
              ? editValue
              : leadData.placement_paid
          ) || 0;

        updatedLead.placement_balance =
          placementBalanceFromBase(
            editingField === "placement_discounted_fee"
              ? valueToSave
              : leadData.placement_discounted_fee,
            leadData.placement_fee,
            paid
          ) ?? updatedLead.placement_balance;
      }

      // Auto-calculate Trainer Share Amount and Pending Amount (Single Course)

      if (
        editingField === "trainer_share" ||
        editingField === "amount_paid_trainer"
      ) {
        const baseDf =
          parseFloat(leadData.discounted_fee) || 0;
        const discountedFee =
          discountedTotalWithGst(baseDf) ?? baseDf;

        let sharePercent = parseFloat(leadData.trainer_share) || 0;

        if (editingField === "trainer_share") {
          sharePercent = parseFloat(editValue) || 0;
        }

        // Calculate Share Amount

        const shareAmount = (discountedFee * sharePercent) / 100;

        updatedLead.trainer_share_amount = shareAmount;

        updatedLead.trainer_share = sharePercent; // Ensure percentage is updated

        // Calculate Pending Amount

        let paidAmount = parseFloat(leadData.amount_paid_trainer) || 0;

        if (editingField === "amount_paid_trainer") {
          paidAmount = parseFloat(editValue) || 0;
        }

        updatedLead.pending_amount = shareAmount - paidAmount;
      }

      await apiClient.put(`${endpoints.leads.root}/${leadId}`, updatedLead);

      setLeadData(updatedLead);

      setInlineErrors((prev) => {
        if (!prev[editingField]) return prev;
        const next = { ...prev };
        delete next[editingField];
        return next;
      });
      setEditingField(null);

      setEditingMeta({
        label: "",
        required: false,
      });
      setEditValue("");

      showToast({
        icon: "success",

        title: `${fieldLabel} updated`,
      });

      notifyLeadUpdated();
    } catch (error) {
      setInlineErrors((prev) => ({
        ...prev,
        [editingField]: `${fieldLabel} could not be updated.`,
      }));
      showToast({
        icon: "error",
        title: "Error",
        text: `Failed to update ${fieldLabel}.`,
      });
    }
  };

  // Combined course edit handlers
  const handleStartCourseEdit = () => {
    // Extract current values
    let currentCourseType = leadData.course_type;
    if (currentCourseType && typeof currentCourseType === "object") {
      currentCourseType = currentCourseType.id || currentCourseType.value || currentCourseType.name || "";
    }
    
    let currentCourse = leadData.course_id;
    if (currentCourse && typeof currentCourse === "object") {
      currentCourse = currentCourse.id || currentCourse.value || "";
    }
    
    setTempCourseType(String(currentCourseType || ""));
    setTempCourse(String(currentCourse || ""));
    setEditingCourse(true);
  };

  const handleSaveCourseEdit = async () => {
    if (!tempCourseType || !tempCourse) {
      showToast({
        icon: "error",
        title: "Validation Error",
        text: "Both Course Type and Course are required.",
      });
      return;
    }

    try {
      const updatedLead = {
        ...leadData,
        course_type: tempCourseType,
        course_id: tempCourse,
      };

      await apiClient.put(`${endpoints.leads.root}/${leadId}`, updatedLead);
      setLeadData(updatedLead);
      setEditingCourse(false);
      setTempCourseType("");
      setTempCourse("");

      showToast({
        icon: "success",
        title: "Course updated successfully",
      });

      notifyLeadUpdated();
    } catch (error) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to update course.",
      });
    }
  };

  const handleCancelCourseEdit = () => {
    setEditingCourse(false);
    setTempCourseType("");
    setTempCourse("");
  };

  const handleTogglePriority = async () => {
    const newPriority = leadData.priority === "hot" ? "normal" : "hot";
    const updatedLead = { ...leadData, priority: newPriority };
    try {
      await apiClient.put(`${endpoints.leads.root}/${leadId}`, updatedLead);
      setLeadData(updatedLead);
      showToast({
        icon: "success",
        title: "Priority updated",
      });
      notifyLeadUpdated();
    } catch (error) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to update priority.",
      });
    }
  };

  const normalizeTrainingStatusValue = (status) => {
    const normalized = String(status || "").toLowerCase();
    const allowedValues = TRAINING_STATUS_OPTIONS.map((opt) => opt.value);
    return allowedValues.includes(normalized) ? normalized : "nottaken";
  };

  const toFloatOrZero = (value) => {
    if (value === null || value === undefined || value === "") return 0;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const toIntOrNull = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return Number.isFinite(Number(value)) ? Number(value) : null;
  };

  // Format ISO date string to "dd mmm yyyy" format (e.g., "13 Sep 2025")
  const formatDateDisplay = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      const day = date.getDate();
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (err) {
      return dateString;
    }
  };

  // Convert ISO date string to "YYYY-MM-DD" format for date input
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "";
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch (err) {
      return "";
    }
  };

  const normalizedCourseStructure = useMemo(() => {
    if (!leadData) return "";
    const raw = leadData.course_structure;
    if (typeof raw === "string") return raw.toLowerCase();
    if (typeof raw === "object" && raw !== null) {
      const descriptive =
        raw.name ||
        raw.label ||
        raw.value ||
        raw.course_structure ||
        raw.courseStructure ||
        raw.title ||
        raw.text;
      if (descriptive) return String(descriptive).toLowerCase();
      if (raw.id) return String(raw.id).toLowerCase();
    }
    return String(raw || "").toLowerCase();
  }, [leadData?.course_structure]);

  // Helper to safely extract value (handle objects from backend)

  const extractValue = (fieldValue) => {
    if (fieldValue === null || fieldValue === undefined) return "";
    if (typeof fieldValue === "object" && fieldValue !== null) {
      // Handle object values - try common ID fields
      // For trainer objects, check trainer_id specifically
      return (
        fieldValue.trainer_id ||
        fieldValue.id ||
        fieldValue.value ||
        fieldValue.name ||
        ""
      );
    }
    return fieldValue;
  };

  const hasValue = useCallback(
    (field) => {
      if (!leadData) return false;
      const raw = leadData[field];
      const normalized = extractValue(raw);
      if (normalized === null || normalized === undefined) return false;
      if (typeof normalized === "string") return normalized.trim() !== "";
      return true;
    },
    [leadData]
  );

  // Render inline editable field

  const renderField = (
    field,
    label,
    type = "text",
    options = null,
    config = {}
  ) => {
    if (!leadData) return null;

    const rawValue = leadData[field];

    // For trainer_id, also check trainer.trainer_id if rawValue is an object
    let value = extractValue(rawValue);

    if (field === "batch_ids") {
      value = normalizeBatchIdStrings(leadData).join(",");
    }

    // Special handling for trainer_id - ensure we get the ID value
    if (
      field === "trainer_id" &&
      typeof rawValue === "object" &&
      rawValue !== null
    ) {
      value = rawValue.trainer_id || rawValue.id || rawValue.value || value;
    }

    const isEditing = editingField === field;

    const { readOnly = false } = config;
    const configuredRequired = config.required;
    const isRequired =
      typeof configuredRequired === "boolean"
        ? configuredRequired
        : REQUIRED_FIELDS.has(field);
    const fieldError = inlineErrors[field];

    if (isEditing) {
      return (
        <div className="flex w-full flex-col gap-1">
          <div
            className={`flex w-full gap-2 ${
              type === "multiselect" ? "flex-col items-stretch" : "items-center"
            }`}
          >
            {type === "multiselect" ? (
              <div className="flex flex-1 flex-col gap-2">
                <div className="max-h-44 overflow-y-auto rounded-md border border-gray-300 bg-white p-2">
                  <div className="flex flex-col gap-1.5">
                    {options?.map((opt) => {
                      const optId = String(
                        opt.batch_id || opt.id || opt.value || ""
                      );
                      const optName =
                        opt.batch_name || opt.name || opt.label || optId;
                      let selectedIds = [];
                      try {
                        selectedIds = JSON.parse(editValue || "[]");
                      } catch {
                        selectedIds = [];
                      }
                      if (!Array.isArray(selectedIds)) selectedIds = [];
                      const selStr = selectedIds.map(String);
                      const checked = selStr.includes(optId);
                      return (
                        <label
                          key={optId}
                          className="flex cursor-pointer items-center gap-2 text-xs text-gray-800"
                        >
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={checked}
                            onChange={(e) => {
                              let next = selStr.slice();
                              if (e.target.checked) {
                                if (!next.includes(optId)) next.push(optId);
                              } else {
                                next = next.filter((x) => x !== optId);
                              }
                              setEditValue(JSON.stringify(next));
                              if (inlineErrors[field]) {
                                setInlineErrors((prev) => {
                                  const n = { ...prev };
                                  delete n[field];
                                  return n;
                                });
                              }
                            }}
                          />
                          <span>{optName}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="rounded bg-green-500 p-1.5 text-white hover:bg-green-600 disabled:opacity-50"
                    disabled={readOnly}
                    title="Save"
                  >
                    <MdCheck size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="rounded bg-gray-300 p-1.5 text-gray-700 hover:bg-gray-400"
                    title="Cancel"
                  >
                    ×
                  </button>
                </div>
              </div>
            ) : type === "select" ? (
              <SearchableSelect
                value={String(editValue || "")}
                onChange={(val) => {
                  setEditValue(val);
                  if (inlineErrors[field]) {
                    setInlineErrors((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    });
                  }
                }}
                disabled={readOnly}
                error={!!fieldError}
                placeholder={`Select ${label}`}
                className="flex-1"
                options={options?.map((opt) => {
                  // For trainers, also check _raw.trainer_id
                  let optId =
                    opt.id ||
                    opt.value ||
                    opt.trainer_id ||
                    opt.campaign_id ||
                    opt.batch_id ||
                    opt.user_id;

                  // Check _raw object if optId is still not found
                  if (!optId && opt._raw) {
                    optId = opt._raw.trainer_id || opt._raw.id;
                  }

                  let optName =
                    opt.name ||
                    opt.label ||
                    opt.trainer_name ||
                    opt.campaign_name ||
                    opt.batch_name ||
                    opt.username;

                  // Check _raw object if optName is still not found
                  if (!optName && opt._raw) {
                    optName = opt._raw.trainer_name || opt._raw.name;
                  }

                  // Fallback if no name found
                  if (!optName) {
                    optName = `Option ${optId}`;
                  }

                  return {
                     value: String(optId),
                     label: optName
                  };
                })}
              />
            ) : (
              <input
                type={type}
                value={
                  type === "date" ? formatDateForInput(editValue) : editValue
                }
                onChange={(e) => {
                  setEditValue(e.target.value);
                  if (inlineErrors[field]) {
                    setInlineErrors((prev) => {
                      const next = { ...prev };
                      delete next[field];
                      return next;
                    });
                  }
                }}
                className={`flex-1 rounded-md px-2.5 py-1.5 text-xs focus:outline-none ${
                  fieldError
                    ? "border border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500"
                    : "border border-gray-300 focus:ring-2 focus:ring-blue-500"
                } ${
                  readOnly ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""
                }`}
                autoFocus
                readOnly={readOnly}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveEdit();

                  if (e.key === "Escape") handleCancelEdit();
                }}
              />
            )}

            {type !== "multiselect" && (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  disabled={readOnly}
                  title="Save"
                >
                  <MdCheck size={16} />
                </button>

                <button
                  onClick={handleCancelEdit}
                  className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  title="Cancel"
                >
                  ×
                </button>
              </>
            )}
          </div>
          {fieldError && (
            <p className="text-[11px] text-red-600">{fieldError}</p>
          )}
        </div>
      );
    }

    // Display value - safely convert to string

    let displayValue = "";

    try {
      if (type === "date" && value) {
        // Format date for display: "dd mmm yyyy"
        displayValue = formatDateDisplay(value);
      } else if (type === "multiselect" && options) {
        const labels = resolveBatchDisplayLabels(leadData, options);
        displayValue = labels.length ? labels.join(", ") : "-";
      } else if (type === "select" && options && value) {
        // Find option with flexible field name matching
        // Convert both to strings for comparison to handle number/string mismatches
        const valueStr = String(value);

        const option = options.find((o) => {
          // Try multiple possible ID fields
          // For trainers, also check _raw.trainer_id
          let optId =
            o.id ||
            o.value ||
            o.trainer_id ||
            o.campaign_id ||
            o.batch_id ||
            o.user_id;

          // Check _raw object if optId is still not found
          if (!optId && o._raw) {
            optId = o._raw.trainer_id || o._raw.id;
          }

          // Compare as strings to handle number/string mismatches
          return String(optId) === valueStr;
        });

        if (option) {
          displayValue =
            option.name ||
            option.label ||
            option.trainer_name ||
            option.campaign_name ||
            option.batch_name ||
            option.username;

          // Check _raw object if displayValue is still not found
          if (!displayValue && option._raw) {
            displayValue = option._raw.trainer_name || option._raw.name;
          }

          // Fallback to string value if still no name found
          if (!displayValue) {
            displayValue = String(value);
          }
        } else {
          // Fallback: if rawValue is an object and has a name, use it!
          if (typeof rawValue === "object" && rawValue !== null) {
            displayValue =
              rawValue.name ||
              rawValue.source_name ||
              rawValue.label ||
              rawValue.trainer_name ||
              String(value || "");
          } else {
            // If options haven't loaded yet, show a hint
            displayValue =
              options && options.length === 0
                ? "Fetching..."
                : String(value || "");
          }
        }
      } else if (
        type === "number" &&
        (field === "discounted_fee" || field === "placement_discounted_fee") &&
        value !== null &&
        value !== undefined &&
        value !== ""
      ) {
        const g = discountedTotalWithGst(parseFloat(value));
        displayValue = g != null ? String(g) : "";
      } else {
        displayValue =
          value !== null && value !== undefined ? String(value) : "";
      }
    } catch (err) {
      displayValue = "-";
    }

    const batchChipLabels =
      type === "multiselect" && field === "batch_ids"
        ? resolveBatchDisplayLabels(leadData, options)
        : [];

    return (
      <div
        onClick={() =>
          !readOnly &&
          handleStartEdit(field, value, { label, required: isRequired })
        }
        className={`group min-h-[32px] w-full rounded-md border px-2.5 py-1.5 text-xs flex ${
          type === "multiselect" && field === "batch_ids"
            ? "items-start justify-between"
            : "items-center justify-between"
        } ${
          readOnly
            ? "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
            : "border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
        }`}
      >
        {type === "multiselect" && field === "batch_ids" ? (
          <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
            {batchChipLabels.length ? (
              batchChipLabels.map((name, idx) => (
                <span
                  key={`${name}-${idx}`}
                  className="inline-flex max-w-full shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700"
                >
                  <span className="truncate" title={name}>
                    {name}
                  </span>
                </span>
              ))
            ) : (
              <span className="text-gray-500">-</span>
            )}
          </div>
        ) : (
          <span className="text-gray-700">{displayValue || "-"}</span>
        )}
      </div>
    );
  };

  // Render combined course type + course fields
  const renderCombinedCourseFields = () => {
    if (!leadData) return null;

    if (editingCourse) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-md bg-blue-50 border-blue-300">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Course Type <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={tempCourseType}
              onChange={(val) => {
                setTempCourseType(val);
                setTempCourse(""); // Reset course when course type changes
              }}
              options={courseTypes.map((ct) => {
                const ctId = ct.id || ct.course_type || ct;
                const ctName = ct.name || ct.course_type || String(ct);
                return { value: String(ctId), label: ctName };
              })}
              placeholder="Select Course Type"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Course <span className="text-red-500">*</span>
            </label>
            <SearchableSelect
              value={tempCourse}
              onChange={(val) => setTempCourse(val)}
              options={filteredCoursesForEdit.map((c) => {
                const courseId = c.course_id || c.id || c._id;
                const courseName = c.course_name || c.name || c.title || String(courseId);
                return { value: String(courseId), label: courseName };
              })}
              placeholder="Select Course"
              disabled={!tempCourseType}
              className="w-full"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 justify-end">
            <button
              onClick={handleSaveCourseEdit}
              className="px-3 py-1.5 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Save Both
            </button>
            <button
              onClick={handleCancelCourseEdit}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    // Display mode
    const courseTypeValue = extractValue(leadData.course_type);
    const courseValue = extractValue(leadData.course_id);

    const courseTypeName =
      courseTypes.find((ct) => {
        const ctId = ct.id || ct.course_type || ct;
        return String(ctId) === String(courseTypeValue);
      })?.name || courseTypeValue || "-";

    const courseName =
      courses.find((c) => {
        const cId = c.course_id || c.id || c._id;
        return String(cId) === String(courseValue);
      })?.course_name ||
      courses.find((c) => {
        const cId = c.course_id || c.id || c._id;
        return String(cId) === String(courseValue);
      })?.name ||
      courseValue ||
      "-";

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Course Type <span className="text-red-500">*</span>
          </label>
          <div
            onClick={handleStartCourseEdit}
            className="group min-h-[32px] w-full rounded-md border px-2.5 py-1.5 text-xs flex items-center justify-between border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
          >
            <span className="text-gray-700">{courseTypeName}</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Course <span className="text-red-500">*</span>
          </label>
          <div
            onClick={handleStartCourseEdit}
            className="group min-h-[32px] w-full rounded-md border px-2.5 py-1.5 text-xs flex items-center justify-between border-gray-300 bg-white text-gray-700 cursor-pointer hover:border-blue-400 hover:bg-blue-50"
          >
            <span className="text-gray-700">{courseName}</span>
          </div>
        </div>
      </div>
    );
  };

  const validateMandatoryFields = useCallback(() => {
    if (!leadData) return false;

    const missingKeys = [];
    REQUIRED_FIELDS.forEach((field) => {
      if (!hasValue(field)) {
        missingKeys.push(field);
      }
    });



    const showSingleValidations =
      normalizedCourseStructure === "single" ||
      normalizedCourseStructure.startsWith("single ");
    const showMultiValidations =
      normalizedCourseStructure === "multiple" ||
      normalizedCourseStructure === "multi" ||
      normalizedCourseStructure.startsWith("multiple ");

    if (showSingleValidations) {
      if (!hasValue("trainer_id")) missingKeys.push("trainer_id");
      if (!hasValue("trainer_share")) missingKeys.push("trainer_share");
    }

    const additionalIssues = [];
    if (showMultiValidations) {
      if (!subCourseList.length) {
        additionalIssues.push(
          "Add at least one sub-course with trainer details."
        );
      } else {
        const invalidRows = subCourseList.reduce((acc, sub, idx) => {
          const hasSubCourse = String(sub.sub_course_id || "").trim() !== "";
          const hasTrainer = String(sub.trainer_id || "").trim() !== "";
          if (!hasSubCourse || !hasTrainer) acc.push(idx + 1);
          return acc;
        }, []);
        if (invalidRows.length) {
          additionalIssues.push(
            `Sub-course row${
              invalidRows.length > 1 ? "s" : ""
            } ${invalidRows.join(", ")} missing Sub-course or Trainer.`
          );
        }
      }
    }

    if (missingKeys.length || additionalIssues.length) {
      setInlineErrors((prev) => {
        const next = { ...prev };
        missingKeys.forEach((key) => {
          next[key] = `${FIELD_LABELS[key] || key} is required.`;
        });
        if (showMultiValidations && !subCourseList.length) {
          next.course_structure = "Add at least one sub-course.";
        }
        return next;
      });

      const labels = missingKeys.map((key) => FIELD_LABELS[key] || key);
      const formattedList =
        labels.length <= 3
          ? labels.join(", ")
          : `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;

      const toastMessage = [formattedList, ...additionalIssues]
        .filter(Boolean)
        .join(" • ");

      showToast({
        icon: "warning",
        title: "Missing required fields",
        text: toastMessage || "Fill all mandatory inputs.",
      });
      return false;
    }

    return true;
  }, [
    hasValue,
    isMetaAdsSource,
    leadData,
    normalizedCourseStructure,
    setInlineErrors,
    showToast,
    subCourseList,
  ]);

  const validateStep = useCallback(
    (stepIndex) => {
      if (!leadData) return false;

      const stepMissing = [];
      const additionalIssues = [];

      if (stepIndex === 0) {
        ["name", "mobile_number", "source_id", "status", "priority"].forEach((field) => {
          if (!hasValue(field)) stepMissing.push(field);
        });

      } else if (stepIndex === 1) {
        [
          "course_type",
          "course_id",
          "user_id",
          "unit_id",
          "card_type_id",
          "course_structure",
        ].forEach((field) => {
          if (!hasValue(field)) stepMissing.push(field);
        });
      } else if (stepIndex === 3) {
        const showSingleValidations =
          normalizedCourseStructure === "single" ||
          normalizedCourseStructure.startsWith("single ");
        const showMultiValidations =
          normalizedCourseStructure === "multiple" ||
          normalizedCourseStructure === "multi" ||
          normalizedCourseStructure.startsWith("multiple ");

        if (showSingleValidations) {
          if (!hasValue("trainer_id")) stepMissing.push("trainer_id");
          if (!hasValue("trainer_share")) stepMissing.push("trainer_share");
        }

        if (showMultiValidations) {
          if (!subCourseList.length) {
            additionalIssues.push("Add at least one sub-course with trainer.");
          } else {
            const invalidRows = subCourseList.reduce((acc, sub, idx) => {
              const hasSubCourse =
                String(sub.sub_course_id || "").trim() !== "";
              const hasTrainer = String(sub.trainer_id || "").trim() !== "";
              if (!hasSubCourse || !hasTrainer) acc.push(idx + 1);
              return acc;
            }, []);
            if (invalidRows.length) {
              additionalIssues.push(
                `Sub-course row${
                  invalidRows.length > 1 ? "s" : ""
                } ${invalidRows.join(", ")} missing Sub-course or Trainer.`
              );
            }
          }
        }
      }

      if (!stepMissing.length && !additionalIssues.length) {
        return true;
      }

      setInlineErrors((prev) => {
        const next = { ...prev };
        stepMissing.forEach((key) => {
          next[key] = `${FIELD_LABELS[key] || key} is required.`;
        });
        if (
          stepIndex === 3 &&
          additionalIssues.length &&
          (normalizedCourseStructure === "multiple" ||
            normalizedCourseStructure === "multi" ||
            normalizedCourseStructure.startsWith("multiple "))
        ) {
          next.course_structure = "Fix sub-course rows before continuing.";
        }
        return next;
      });

      const labels = stepMissing.map((key) => FIELD_LABELS[key] || key);
      const formattedList =
        labels.length <= 3
          ? labels.join(", ")
          : `${labels.slice(0, 3).join(", ")} +${labels.length - 3} more`;
      const toastMessage = [formattedList, ...additionalIssues]
        .filter(Boolean)
        .join(" • ");

      showToast({
        icon: "warning",
        title: "Complete this step",
        text: toastMessage || "Fill required inputs before proceeding.",
      });

      return false;
    },
    [
      hasValue,
      isMetaAdsSource,
      normalizedCourseStructure,
      setInlineErrors,
      showToast,
      subCourseList,
    ]
  );

  // Read-only field (not editable)

  const renderReadOnlyField = (value, className = "") => {
    // Safely convert value to string

    let displayValue = "";

    if (value === null || value === undefined) {
      displayValue = "-";
    } else if (typeof value === "object" && value !== null) {
      displayValue = value.name || value.value || value.id || "-";
    } else {
      displayValue = String(value);
    }

    return (
      <div
        className={`min-h-[32px] w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs flex items-center ${
          className || "bg-gray-50 text-gray-600"
        }`}
      >
        {displayValue}
      </div>
    );
  };

  const formatCurrency = (value) => {
    if (!value || isNaN(parseFloat(value))) return "₹0";

    return `₹${parseFloat(value).toLocaleString("en-IN")}`;
  };

  // Fetch comments

  useEffect(() => {
    if (!open || !leadId) return;

    const fetchComments = async () => {
      setLoadingComments(true);
      try {
        const response = await apiClient.get(endpoints.leads.comments(leadId));
        const comments = response.data.comments || [];
        setCommentsList([...comments].reverse());

        // Populate likes and reactions from backend data
        const likesMap = {};
        const reactionsMap = {};

        comments.forEach((c) => {
          const cId = c.comment_id || c.id; // Ensure we use the correct ID field
          if (Array.isArray(c.likes)) {
            likesMap[cId] = c.likes;
          }
          if (c.reactions && typeof c.reactions === "object") {
            reactionsMap[cId] = c.reactions;
          }
        });

        setCommentLikes(likesMap);
        setCommentReactions(reactionsMap);
      } catch (error) {
        // Error fetching comments
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [open, leadId]);

  const combinedSubCourseOptions = useMemo(() => {
    const map = new Map();
    (availableSubCourses || []).forEach((sc) => {
      if (sc?.sub_course_id !== undefined && sc?.sub_course_id !== null) {
        map.set(String(sc.sub_course_id), sc);
      }
    });
    (subCourseList || []).forEach((sc) => {
      if (sc?.sub_course_id && !map.has(String(sc.sub_course_id))) {
        map.set(String(sc.sub_course_id), {
          sub_course_id: sc.sub_course_id,
          sub_course_name:
            sc.sub_course_name || `Sub-course ${sc.sub_course_id}`,
        });
      }
    });
    return Array.from(map.values());
  }, [availableSubCourses, subCourseList]);

  const handleAddSubCourseRow = useCallback(() => {
    setSubCourseList((prev) => [
      ...prev,
      {
        tempId: `temp-${Date.now()}`,
        sub_course_id: "",
        sub_course_name: "",
        trainer_id: "",
        trainer_share: "",
        trainer_share_amount: "",
        amount_paid_trainer: "",
        pending_amount: "",
        training_status: "nottaken",
        training_start_date: "",
        training_end_date: "",
      },
    ]);
  }, []);

  const handleRemoveSubCourseRow = useCallback((index) => {
    setSubCourseList((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSubCourseInputChange = useCallback(
    (index, field, value) => {
      setSubCourseList((prev) =>
        autoFillSubCourseAmounts(
          prev.map((sub, idx) => {
            if (idx !== index) return sub;
            const updated = { ...sub, [field]: value };
            if (field === "sub_course_id") {
              const selected = combinedSubCourseOptions.find(
                (option) => String(option.sub_course_id) === String(value)
              );
              updated.sub_course_name =
                selected?.sub_course_name || sub.sub_course_name || "";
            }
            return updated;
          })
        )
      );
    },
    [autoFillSubCourseAmounts, combinedSubCourseOptions]
  );

  const handleSaveSubCourses = useCallback(async () => {
    if (!leadData) return;
    if (subCourseList.length === 0) {
      showToast({
        icon: "info",
        title: "Add Sub-Course",
        text: "Add at least one sub-course before saving.",
      });
      return;
    }

    const missingRequired = subCourseList.some(
      (sub) =>
        !String(sub.sub_course_id || "").trim() ||
        !String(sub.trainer_id || "").trim()
    );
    if (missingRequired) {
      showToast({
        icon: "warning",
        title: "Validation Error",
        text: "Each sub-course requires both Sub-Course and Trainer selections.",
      });
      return;
    }

    setSavingSubCourses(true);
    const displaySubCourses = autoFillSubCourseAmounts(subCourseList).map(
      (sub, idx) => {
        const selectedSubCourse = combinedSubCourseOptions.find(
          (option) => String(option.sub_course_id) === String(sub.sub_course_id)
        );
        const trainerOption = Array.isArray(trainers)
          ? trainers.find(
              (trainer) =>
                String(trainer.trainer_id || trainer.id || trainer.user_id) ===
                String(sub.trainer_id)
            )
          : null;
        return {
          ...sub,
          sub_course_name:
            selectedSubCourse?.sub_course_name ||
            subCourseList[idx]?.sub_course_name ||
            "",
          trainer_name:
            trainerOption?.trainer_name ||
            trainerOption?.name ||
            trainerOption?.username ||
            "",
        };
      }
    );
    const normalizedSubCourses = displaySubCourses.map((sub) => ({
      sub_course_id: toIntOrNull(sub.sub_course_id),
      trainer_id: toIntOrNull(sub.trainer_id),
      trainer_share: toFloatOrZero(sub.trainer_share),
      trainer_share_amount: toFloatOrZero(sub.trainer_share_amount),
      amount_paid_trainer: toFloatOrZero(sub.amount_paid_trainer),
      pending_amount: toFloatOrZero(sub.pending_amount),
      training_status: normalizeTrainingStatusValue(sub.training_status),
      training_start_date: sub.training_start_date || null,
      training_end_date: sub.training_end_date || null,
    }));

    const payload = {
      ...leadData,
      course_structure: "multiple",
      sub_courses: normalizedSubCourses,
    };

    try {
      const response = await apiClient.put(
        `${endpoints.leads.root}/${leadId}`,
        payload
      );
      const updatedLead = response?.data || {
        ...leadData,
        course_structure: "multiple",
        sub_courses: displaySubCourses,
      };
      setLeadData((prev) => ({
        ...(prev || {}),
        ...updatedLead,
        course_structure: "multiple",
        sub_courses: displaySubCourses,
      }));
      setSubCourseList((prev) =>
        prev.map((sub, idx) => ({
          ...sub,
          sub_course_name:
            displaySubCourses[idx]?.sub_course_name || sub.sub_course_name,
        }))
      );
      showToast({
        icon: "success",
        title: "Sub-courses updated!",
      });
      notifyLeadUpdated();
    } catch (error) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to save sub-course changes.",
      });
    } finally {
      setSavingSubCourses(false);
    }
  }, [leadData, leadId, subCourseList]);

  // Comment functions

  const exec = (command, value = null) => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Special handling for list commands - insert HTML directly
      if (command === "insertUnorderedList") {
        const listHTML = "<ul><li></li></ul>";
        document.execCommand("insertHTML", false, listHTML);
        return;
      }

      if (command === "insertOrderedList") {
        const listHTML = "<ol><li></li></ol>";
        document.execCommand("insertHTML", false, listHTML);
        return;
      }

      // For all other commands, use normal execCommand
      document.execCommand(command, false, value);
    }
  };

  const focusCommentEditor = () => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const getCommentId = (c, idx) => {
    return c.comment_id || c.id || idx;
  };

  const handleAddComment = async () => {
    if (!editorRef.current) return;

    const htmlRaw = editorRef.current.innerHTML.trim();

    if (!htmlRaw) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Comment cannot be empty",
      });
      return;
    }

    const html = sanitizeHtml(htmlRaw);

    setSavingComment(true);

    try {
      await apiClient.post(endpoints.leads.comments(leadId), {
        comment_text: html,
      });

      // Refresh comments

      const response = await apiClient.get(endpoints.leads.comments(leadId));

      setCommentsList((response.data.comments || []).reverse());

      // Clear editor

      editorRef.current.innerHTML = "";

      setCommentTab("all");

      showToast({
        icon: "success",

        title: "Comment Added!",
      });
    } catch (error) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to add comment",
      });
    } finally {
      setSavingComment(false);
    }
  };

  const handleSaveCommentEdit = async (id) => {
    if (!editRef.current) return;

    const htmlRaw = editRef.current.innerHTML.trim();

    if (!htmlRaw) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Comment cannot be empty",
      });
      return;
    }

    const html = sanitizeHtml(htmlRaw);

    try {
      await apiClient.put(`/comments/${id}`, {
        comment_text: html,
      });

      // Refresh comments

      // Refresh comments
      const response = await apiClient.get(endpoints.leads.comments(leadId));

      // Ensure the edited comment has a newer updated_at so "(edited)" label shows
      const newComments = (response.data.comments || []).reverse().map((c) => {
        // loose comparison for ID
        // eslint-disable-next-line eqeqeq
        if (getCommentId(c) == id) {
          // If backend didn't update timestamp, force it locally
          if (!c.updated_at || c.updated_at === c.created_at) {
            return { ...c, updated_at: new Date().toISOString() };
          }
        }
        return c;
      });

      setCommentsList(newComments);

      setEditingId(null);

      showToast({
        icon: "success",

        title: "Comment Updated!",
      });
    } catch (error) {
      showToast({
        icon: "error",
        title: "Error",
        text: "Failed to update comment",
      });
    }
  };

  const handleDeleteComment = async (id) => {
    const result = await Swal.fire({
      title: "Delete Comment?",

      text: "This action cannot be undone",

      icon: "warning",

      showCancelButton: true,

      confirmButtonColor: "#d33",

      cancelButtonColor: "#3085d6",

      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/comments/${id}`);

        // Refresh comments

        const response = await apiClient.get(endpoints.leads.comments(leadId));

        setCommentsList((response.data.comments || []).reverse());

        showToast({
          icon: "success",

          title: "Deleted!",
        });
      } catch (error) {
        showToast({
          icon: "error",
          title: "Error",
          text: "Failed to delete comment",
        });
      }
    }
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "";

    const now = new Date();

    const then = new Date(dateString);

    const diff = Math.floor((now - then) / 1000);

    if (diff < 60) return `${diff} second${diff !== 1 ? "s" : ""} ago`;

    if (diff < 3600) {
      const min = Math.floor(diff / 60);

      return `${min} minute${min !== 1 ? "s" : ""} ago`;
    }

    if (diff < 86400) {
      const hr = Math.floor(diff / 3600);

      return `${hr} hour${hr !== 1 ? "s" : ""} ago`;
    }

    const days = Math.floor(diff / 86400);

    return `${days} day${days !== 1 ? "s" : ""} ago`;
  };

  // Get formatted date for Jira-style display (e.g., "9 November 2025 at 04:22 (edited)")
  const getFormattedDate = (dateString, isEdited = false) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const options = {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    const formatted = date.toLocaleDateString("en-GB", options);
    return isEdited ? `${formatted} (edited)` : formatted;
  };

  // Get current user (you can get this from auth context or localStorage)
  // Get current user (you can get this from auth context or localStorage)
  const getCurrentUser = () => {
    try {
      const username = authUser?.username || authUser?.name || "current_user";
      const fullName =
        authUser?.name ||
        authUser?.full_name ||
        authUser?.username ||
        "Unknown User";
      const profileImage =
        authUser?.profile_image || authUser?.image || authUser?.avatar || null;

      const userData = {
        username: username,
        fullName: fullName,
        profileImage: profileImage,
      };
      return userData;
    } catch (e) {
      // Could not get current user
    }
    return {
      username: "current_user",
      fullName: "Unknown User",
      profileImage: null,
    };
  };

  // Get user data for any username
  const getUserData = (username) => {
    // If username is empty, return default
    if (!username || username.trim() === "") {
      return {
        username: "",
        fullName: "Unknown User",
        profileImage: null,
      };
    }

    // Get current user data
    const currentUser = getCurrentUser();

    // If it's the current user, return their full data
    if (
      username.toLowerCase().trim() ===
      currentUser.username.toLowerCase().trim()
    ) {
      return currentUser;
    }

    // For other users, use the username as the display name
    // You could enhance this to fetch from a users list or API
    return {
      username: username,
      fullName: username, // Use username as fallback display name
      profileImage: null,
    };
  };

  // Handle like toggle
  // Handle like toggle
  const handleToggleLike = useCallback(
    async (commentId) => {
      const currentUser = getCurrentUser();
      const currentLikes = commentLikes[commentId] || [];
      const isLiked = currentLikes.some(
        (u) => u.username === currentUser.username
      );

      if (!isLiked) {
        // Adding a like

        // 1. Add to Likes
        setCommentLikes((prev) => {
          const newLikes = { ...prev };
          const userArray = [...(newLikes[commentId] || [])];
          userArray.push(currentUser);
          newLikes[commentId] = userArray;
          return newLikes;
        });

        // 2. Remove any emoji reactions
        setCommentReactions((prev) => {
          const newReactions = { ...prev };
          if (newReactions[commentId]) {
            const commentReactions = { ...newReactions[commentId] };
            let changed = false;
            Object.keys(commentReactions).forEach((emoji) => {
              const users = commentReactions[emoji];
              if (Array.isArray(users)) {
                const idx = users.findIndex(
                  (u) => u.username === currentUser.username
                );
                if (idx > -1) {
                  const newUsers = [...users];
                  newUsers.splice(idx, 1);
                  commentReactions[emoji] = newUsers;
                  if (newUsers.length === 0) delete commentReactions[emoji];
                  changed = true;
                }
              }
            });
            if (changed) newReactions[commentId] = commentReactions;
          }
          return newReactions;
        });
      } else {
        // Removing a like
        setCommentLikes((prev) => {
          const newLikes = { ...prev };
          const userArray = [...(newLikes[commentId] || [])];
          const idx = userArray.findIndex(
            (u) => u.username === currentUser.username
          );
          if (idx > -1) {
            userArray.splice(idx, 1);
            newLikes[commentId] = userArray;
          }
          return newLikes;
        });
      }

      // API Call
      try {
        await apiClient.post(`/comments/${commentId}/like`);
      } catch (error) {
        showToast({
          icon: "error",
          title: "Error",
          text: "Failed to update like",
        });
      }
    },
    [commentLikes]
  );

  // Handle emoji reaction (toggle)
  const handleAddReaction = useCallback(
    async (commentId, emoji) => {
      const currentUser = getCurrentUser();
      const reactions = commentReactions[commentId] || {};
      const currentUsersForEmoji = reactions[emoji] || [];
      const hasThisReaction = currentUsersForEmoji.some(
        (u) => u.username === currentUser.username
      );

      if (!hasThisReaction) {
        // Adding new reaction

        // 1. Remove Like
        setCommentLikes((prev) => {
          const newLikes = { ...prev };
          const userArray = [...(newLikes[commentId] || [])];
          const idx = userArray.findIndex(
            (u) => u.username === currentUser.username
          );
          if (idx > -1) {
            userArray.splice(idx, 1);
            newLikes[commentId] = userArray;
          }
          return newLikes;
        });

        // 2. Add/Update Reactions
        setCommentReactions((prev) => {
          const newReactions = { ...prev };
          if (!newReactions[commentId]) newReactions[commentId] = {};
          const cr = { ...newReactions[commentId] };

          // Remove other emojis
          Object.keys(cr).forEach((otherEmoji) => {
            if (otherEmoji !== emoji) {
              const users = cr[otherEmoji];
              if (Array.isArray(users)) {
                const idx = users.findIndex(
                  (u) => u.username === currentUser.username
                );
                if (idx > -1) {
                  const newUsers = [...users];
                  newUsers.splice(idx, 1);
                  cr[otherEmoji] = newUsers;
                  if (newUsers.length === 0) delete cr[otherEmoji];
                }
              }
            }
          });

          // Add this emoji
          const newUsers = [...(cr[emoji] || [])];
          newUsers.push(currentUser);
          cr[emoji] = newUsers;

          newReactions[commentId] = cr;
          return newReactions;
        });
      } else {
        // Removing reaction
        setCommentReactions((prev) => {
          const newReactions = { ...prev };
          if (newReactions[commentId]) {
            const cr = { ...newReactions[commentId] };
            const users = cr[emoji];
            if (Array.isArray(users)) {
              const idx = users.findIndex(
                (u) => u.username === currentUser.username
              );
              if (idx > -1) {
                const newUsers = [...users];
                newUsers.splice(idx, 1);
                cr[emoji] = newUsers;
                if (newUsers.length === 0) delete cr[emoji];
                newReactions[commentId] = cr;
              }
            }
          }
          return newReactions;
        });
      }

      setShowEmojiPicker(null);

      // API Call
      try {
        await apiClient.post(`/comments/${commentId}/reaction`, { emoji });
      } catch (error) {
        showToast({
          icon: "error",
          title: "Error",
          text: "Failed to update reaction",
        });
      }
    },
    [commentReactions]
  );

  // Check if current user liked a comment
  const isLiked = useCallback(
    (commentId) => {
      const likes = commentLikes[commentId];
      if (!likes || !Array.isArray(likes)) return false;
      const currentUser = getCurrentUser();
      return likes.some((u) => u.username === currentUser.username);
    },
    [commentLikes]
  );

  // Get like count
  const getLikeCount = useCallback(
    (commentId) => {
      const likes = commentLikes[commentId];
      return Array.isArray(likes) ? likes.length : 0;
    },
    [commentLikes]
  );

  // Get reactions for a comment (returns { emoji: count })
  const getReactions = useCallback(
    (commentId) => {
      const reactions = commentReactions[commentId] || {};
      // Convert user arrays to counts
      const reactionCounts = {};
      Object.keys(reactions).forEach((emoji) => {
        const users = reactions[emoji];
        if (Array.isArray(users) && users.length > 0) {
          reactionCounts[emoji] = users.length;
        }
      });
      return reactionCounts;
    },
    [commentReactions]
  );

  // Check if current user reacted with specific emoji
  const hasUserReacted = useCallback(
    (commentId, emoji) => {
      const reactions = commentReactions[commentId];
      if (!reactions || !reactions[emoji]) return false;
      const users = reactions[emoji];
      const currentUser = getCurrentUser();
      return (
        Array.isArray(users) &&
        users.some((u) => u.username === currentUser.username)
      );
    },
    [commentReactions]
  );

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(null);
      }
    };
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  // Close formatting menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const formattingMenu = document.querySelector(
        ".formatting-menu-dropdown"
      );
      const formattingButton = event.target.closest(".formatting-menu-button");

      if (showFormattingMenu && !formattingButton) {
        if (formattingMenu && !formattingMenu.contains(event.target)) {
          setShowFormattingMenu(false);
        }
      }
    };
    if (showFormattingMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFormattingMenu]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const emojiPicker = document.querySelector(".emoji-picker-dropdown");
      const emojiButton = event.target.closest(".emoji-picker-button");

      if (showEmojiPickerToolbar && !emojiButton) {
        if (emojiPicker && !emojiPicker.contains(event.target)) {
          setShowEmojiPickerToolbar(false);
        }
      }
    };
    if (showEmojiPickerToolbar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPickerToolbar]);

  // Common emojis for reactions
  const EMOJI_OPTIONS = ["👍", "❤️", "😊", "🎉", "🔥", "👏", "💯", "😮"];

  const handlePrimaryButtonClick = useCallback(() => {
    if (currentStep === STEPS.length - 1) {
      if (!validateMandatoryFields()) return;
      onSaved && onSaved();
      onClose();
    } else {
      if (!validateStep(currentStep)) return;
      setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1));
    }
  }, [currentStep, onClose, onSaved, validateMandatoryFields, validateStep]);

  const handleStepIndicatorClick = useCallback(
    (targetIdx) => {
      if (targetIdx === currentStep) return;
      if (targetIdx < currentStep) {
        setCurrentStep(targetIdx);
        return;
      }

      for (let idx = currentStep; idx < targetIdx; idx += 1) {
        if (!validateStep(idx)) {
          return;
        }
      }
      setCurrentStep(targetIdx);
    },
    [currentStep, validateStep]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] overflow-y-auto bg-black bg-opacity-60 flex justify-center items-start py-8"
      onClick={onClose}
    >
      <style dangerouslySetInnerHTML={{ __html: editorStyles }} />
      <div
        className="bg-white rounded-lg shadow-2xl w-[75vw] max-w-3xl my-4 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}

        <div className=" top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">
            Edit Lead Details
          </h2>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => setOptionsOpen(!optionsOpen)}
                className="h-8 w-8 rounded-full text-gray-500 hover:bg-gray-100 flex items-center justify-center"
              >
                <FaEllipsisV />
              </button>

              {optionsOpen && (
                <div className="absolute right-0 top-9 z-50 w-40 overflow-hidden rounded-md border bg-white shadow-xl">
                  <MenuBtn
                    label="Delete"
                    onClick={async () => {
                      setOptionsOpen(false);

                      const result = await Swal.fire({
                        title: "Delete Lead?",

                        text: "Are you sure you want to delete this lead?",

                        icon: "warning",

                        showCancelButton: true,

                        confirmButtonColor: "#d33",

                        confirmButtonText: "Yes, delete it!",
                      });

                      if (result.isConfirmed) {
                        try {
                          await apiClient.delete(`/leads/${leadId}`);

                          onSaved && onSaved();

                          onClose();

                          showToast({
                            icon: "success",
                            title: "Lead deleted",
                          });
                        } catch (err) {
                          showToast({
                            icon: "error",
                            title: "Error",
                            text: "Failed to delete lead",
                          });
                        }
                      }
                    }}
                  />

                  <MenuBtn
                    label="Archive"
                    onClick={async () => {
                      setOptionsOpen(false);

                      try {
                        await apiClient.put(`/leads/archive/${leadId}`);

                        showToast({
                          icon: "success",
                          title: "Lead archived",
                        });
                        onSaved && onSaved();

                        onClose();
                      } catch (err) {
                        showToast({
                          icon: "error",
                          title: "Error",
                          text: "Failed to archive lead",
                        });
                      }
                    }}
                  />

                  <MenuBtn
                    label="On Hold"
                    onClick={async () => {
                      setOptionsOpen(false);

                      try {
                        await apiClient.put(`/leads/onhold/${leadId}`);

                        showToast({
                          icon: "success",
                          title: "Lead marked on hold",
                        });
                        onSaved && onSaved();

                        onClose();
                      } catch (err) {
                        showToast({
                          icon: "error",
                          title: "Error",
                          text: "Failed to put lead on hold",
                        });
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-lg leading-none h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stepper */}

        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <React.Fragment key={idx}>
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleStepIndicatorClick(idx)}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      idx === currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>

                  <span
                    className={`ml-1.5 text-xs font-medium ${
                      idx === currentStep ? "text-blue-600" : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {idx < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-3 ${
                      idx < currentStep ? "bg-blue-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Form Content */}

        {loading ? (
          <div className="px-6 py-20 text-center text-gray-500">
            Loading lead data...
          </div>
        ) : !leadData ? (
          <div className="px-6 py-20 text-center text-gray-500">
            No lead data available
          </div>
        ) : (
          <div className="px-6 py-5">
            {/* Step 1: Basic Info */}

            {currentStep === 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-gray-800">
                  Lead Basic Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Name <span className="text-red-500">*</span>
                    </label>

                    {renderField("name", "Name", "text", null, {
                      required: true,
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    {editingField === "mobile_number" ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="w-28">
                            <SearchableSelect
                              options={COUNTRY_CODES}
                              value={editCountryCode}
                              onChange={(val) => {
                                setEditCountryCode(val);
                                if (val !== "manual") setEditManualCountryCode("");
                                if (inlineErrors.mobile_number) {
                                  setInlineErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.mobile_number;
                                    return next;
                                  });
                                }
                              }}
                              error={!!inlineErrors.mobile_number}
                              placeholder="+91"
                              className=""
                            />
                          </div>
                          {editCountryCode === "manual" && (
                            <input
                              type="text"
                              value={editManualCountryCode}
                              onChange={(e) => {
                                setEditManualCountryCode(e.target.value);
                                if (inlineErrors.mobile_number) {
                                  setInlineErrors((prev) => {
                                    const next = { ...prev };
                                    delete next.mobile_number;
                                    return next;
                                  });
                                }
                              }}
                              placeholder="e.g. +91"
                              className="flex-1 min-w-[80px] rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          )}
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={editValue}
                            onChange={(e) => {
                              setEditValue(stripMobile(e.target.value));
                              if (inlineErrors.mobile_number) {
                                setInlineErrors((prev) => {
                                  const next = { ...prev };
                                  delete next.mobile_number;
                                  return next;
                                });
                              }
                            }}
                            placeholder="Enter mobile number"
                            className="flex-1 min-w-[100px] rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600"
                            title="Save"
                          >
                            <MdCheck size={16} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                            title="Cancel"
                          >
                            ×
                          </button>
                        </div>
                        {inlineErrors.mobile_number && (
                          <p className="text-[11px] text-red-600">
                            {inlineErrors.mobile_number}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div
                        onClick={() =>
                          handleStartEdit("mobile_number", leadData.mobile_number || "", {
                            label: "Mobile Number",
                            required: true,
                          })
                        }
                        className="group min-h-[32px] w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs flex items-center justify-between cursor-pointer hover:border-blue-400 hover:bg-blue-50"
                      >
                        <span className="text-gray-700">
                          {leadData.country_code ? `${leadData.country_code} ` : ""}
                          {leadData.mobile_number ?? "-"}
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Email
                    </label>

                    {renderField("email", "Email", "email")}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Role
                    </label>

                    {renderField("role_id", "Role", "select", roles)}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      College/Company
                    </label>

                    {renderField("college_company", "College/Company")}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Location
                    </label>

                    {renderField("location", "Location")}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Source <span className="text-red-500">*</span>
                    </label>

                    {renderField("source_id", "Source", "select", sources, {
                      required: true,
                    })}
                  </div>

                  {isReferralSource && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Referred By
                      </label>

                      {renderField("referred_by", "Referred By")}
                    </div>
                  )}

                  {isMetaAdsSource && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Meta Campaign
                      </label>
                      {renderField(
                        "meta_campaign_id",
                        "Meta Campaign",
                        "select",
                        metaCampaigns
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status <span className="text-red-500">*</span>
                    </label>

                    {renderField("status", "Status", "select", STATUS_OPTIONS, {
                      required: true,
                    })}
                  </div>

                  <div className="flex items-center h-full pt-4">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={leadData.priority === "hot"}
                          onChange={handleTogglePriority}
                        />
                        <div className={`block w-10 h-5 rounded-full transition-colors ${leadData.priority === "hot" ? "bg-red-500" : "bg-gray-300"}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${leadData.priority === "hot" ? "translate-x-5" : ""}`}></div>
                      </div>
                      <div className="text-xs font-semibold text-gray-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
                        Hot Lead {leadData.priority === "hot" && "🔥"}
                      </div>
                    </label>
                  </div>

                  {showEnrollmentId && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Enrollment ID
                      </label>

                      {renderReadOnlyField(leadData.enrollment_id)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Course Info */}

            {currentStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-gray-800">
                  Course Information
                </h3>

                {/* Combined Course Type and Course Editor - Full Width */}
                {renderCombinedCourseFields()}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Batch
                    </label>

                    {renderField("batch_ids", "Batch", "multiselect", batches)}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Assigned To <span className="text-red-500">*</span>
                    </label>

                    {renderField(
                      "user_id",
                      "Assigned To",
                      "select",
                      assignees,
                      { required: true }
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Business Unit <span className="text-red-500">*</span>
                    </label>

                    {renderField("unit_id", "Business Unit", "select", units, {
                      required: true,
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Card Type <span className="text-red-500">*</span>
                    </label>

                    {renderField(
                      "card_type_id",
                      "Card Type",
                      "select",
                      cardTypes,
                      { required: true }
                    )}
                  </div>

                  {/* Only show course structure for Training or Both card types */}
                  {String(leadData.card_type_id) !== String(cardTypeIds.PLACEMENT) && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Course Structure <span className="text-red-500">*</span>
                      </label>

                      {renderField(
                        "course_structure",
                        "Course Structure",
                        "select",
                        [
                          { id: "single", name: "Single Course" },

                          { id: "multiple", name: "Multiple Courses" },
                        ],
                        { required: true }
                      )}
                    </div>
                  )}

                  {/* Show Inquired Course if it exists (captured externally) - Placed nearby Structure */}
                  {leadData?.inquired_course && (
                    <div>
                      <label className="block text-xs font-medium text-orange-800 mb-1">
                        Inquired Course (Unmatched)
                      </label>
                      <div className="min-h-[32px] w-full rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs text-orange-900 flex items-center">
                        {leadData.inquired_course}
                      </div>
                    </div>
                  )}
                </div>

                {/* Requirements field - show if data exists or it's an external lead */}
                {(leadData?.requirements || leadData?.inquired_course) && (
                  <div className="mt-4">
                    <label className="block text-xs font-medium text-gray-700 mb-1 flex items-center gap-1">
                      <span>Requirements</span>
                      <span className="text-[10px] text-gray-400 font-normal italic">(from external submission)</span>
                    </label>
                    {renderField("requirements", "Requirements", "textarea")}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment Info */}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold mb-4 text-gray-800">
                  Payment Information
                </h3>

                {(() => {
                  // Determine which fields to show based on card type

                  const selectedCardTypeId = String(
                    leadData.card_type_id || ""
                  );

                  const isTrainingOnly =
                    selectedCardTypeId === String(cardTypeIds.TRAINING);

                  const isPlacementOnly =
                    selectedCardTypeId === String(cardTypeIds.PLACEMENT);

                  const isBoth =
                    selectedCardTypeId === String(cardTypeIds.BOTH);

                  const showTraining = isTrainingOnly || isBoth;

                  const showPlacement = isPlacementOnly || isBoth;

                  return (
                    <>
                      {showTraining && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-700 mb-3">
                            Training Fee Information
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Actual Fee
                              </label>

                              {renderField(
                                "actual_fee",
                                "Actual Fee",
                                "number"
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Discounted Fee (before 6% GST)
                              </label>

                              {renderField(
                                "discounted_fee",
                                "Discounted Fee (before 6% GST)",
                                "number"
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Fee Paid
                              </label>

                              {renderReadOnlyField(
                                formatCurrency(leadData.fee_paid)
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Fee Balance
                              </label>

                              {renderReadOnlyField(
                                formatCurrency(leadData.fee_balance)
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Paid Status
                              </label>

                              {renderField(
                                "paid_status",
                                "Paid Status",
                                "select",
                                [
                                  { id: "paid", name: "Paid" },

                                  {
                                    id: "partially paid",
                                    name: "Partially Paid",
                                  },

                                  { id: "not paid", name: "Not Paid" },
                                ]
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {showPlacement && (
                        <div>
                          {showTraining && (
                            <div className="h-px w-full bg-gray-200 my-4" />
                          )}

                          <h4 className="text-xs font-semibold text-gray-700 mb-3">
                            Placement Fee Information
                          </h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Placement Actual Fee
                              </label>

                              {renderField(
                                "placement_fee",
                                "Placement Actual Fee",
                                "number"
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Placement Discounted Fee (before 6% GST)
                              </label>

                              {renderField(
                                "placement_discounted_fee",
                                "Placement Discounted Fee (before 6% GST)",
                                "number"
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Placement Paid
                              </label>

                              {renderReadOnlyField(
                                formatCurrency(leadData.placement_paid)
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Placement Balance
                              </label>

                              {renderReadOnlyField(
                                formatCurrency(leadData.placement_balance)
                              )}
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Placement Paid Status
                              </label>

                              {renderField(
                                "placement_paid_status",
                                "Placement Paid Status",
                                "select",
                                [
                                  { id: "paid", name: "Paid" },

                                  {
                                    id: "partially paid",
                                    name: "Partially Paid",
                                  },

                                  { id: "not paid", name: "Not Paid" },
                                ]
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!showTraining && !showPlacement && (
                        <div className="text-center py-8 text-gray-500 text-xs">
                          Please select a card type to view payment information
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Step 4: Trainer & Training */}

            {currentStep === 3 && (
              <div className="space-y-4">
               

                {(() => {
                  const selectedCardTypeId = String(leadData.card_type_id || "");
                  const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
                  const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);
                  const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);

                  const isSingle =
                    normalizedCourseStructure === "single" ||
                    normalizedCourseStructure.startsWith("single ");
                  const isMultiple =
                    normalizedCourseStructure === "multiple" ||
                    normalizedCourseStructure === "multi" ||
                    normalizedCourseStructure.startsWith("multiple ");

                  return (
                    <>
                      {isTrainingOnly && (
                        <div className="flex justify-center mb-6">
                          <div className="inline-flex items-center gap-2 px-6 py-2 bg-green-50 border border-green-100 rounded-full">
                            <FaChalkboardTeacher className="text-green-600 text-lg" />
                            <h3 className="text-sm font-bold text-green-800 uppercase tracking-wide">
                              Training Details
                            </h3>
                          </div>
                        </div>
                      )}
                      {isPlacementOnly && (
                        <div className="flex justify-center mb-6">
                          <div className="inline-flex items-center gap-2 px-6 py-2 bg-blue-50 border border-blue-100 rounded-full">
                            <FaBriefcase className="text-blue-600 text-lg" />
                            <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wide">
                              Placement Details
                            </h3>
                          </div>
                        </div>
                      )}
                      {isBoth && (
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
                      )}

                      {/* Training Details Section */}
                      {((isTrainingOnly || isBoth) && trainingPlacementTab === "training") && (
                        <div className="animate-fadeIn">
                          {isSingle && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer
                          </label>

                          {renderField(
                            "trainer_id",
                            "Trainer",
                            "select",
                            Array.isArray(trainers) && trainers.length > 0
                              ? trainers
                              : []
                          )}
                          {(!trainers || trainers.length === 0) && (
                            <p className="text-[11px] text-amber-600 mt-1">
                              No trainers available. Please refresh the page.
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Training Status
                          </label>

                          {renderField(
                            "training_status",
                            "Training Status",
                            "select",
                            TRAINING_STATUS_OPTIONS
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Training Start Date
                          </label>

                          {renderField(
                            "training_start_date",
                            "Training Start Date",
                            "date"
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Training End Date
                          </label>

                          {renderField(
                            "training_end_date",
                            "Training End Date",
                            "date"
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer Share (%)
                          </label>

                          {renderField(
                            "trainer_share",
                            "Trainer Share",
                            "number"
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Trainer Share Amount
                          </label>

                          {renderReadOnlyField(
                            formatCurrency(leadData.trainer_share_amount),
                            "bg-gray-100 text-gray-500"
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount Paid to Trainer
                          </label>

                          {renderField(
                            "amount_paid_trainer",
                            "Amount Paid to Trainer",
                            "number"
                          )}
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Pending Amount
                          </label>

                          {renderReadOnlyField(
                            formatCurrency(leadData.pending_amount),
                            "bg-gray-100 text-gray-500"
                          )}
                            </div>
                            </div>
                          )}

                          {isMultiple && (
                            <div className="space-y-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-xs font-medium text-gray-600">
                              Sub-Courses ({subCourseList.length})
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={handleAddSubCourseRow}
                                className="rounded-md bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700"
                              >
                                + Add Sub-Course
                              </button>
                              {subCourseList.length > 0 && (
                                <button
                                  type="button"
                                  onClick={handleSaveSubCourses}
                                  disabled={savingSubCourses}
                                  className="rounded-md bg-green-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                                >
                                  {savingSubCourses
                                    ? "Saving..."
                                    : "Save Sub-Courses"}
                                </button>
                              )}
                            </div>
                          </div>
                          {/* <p className="text-[11px] text-gray-500">
                            Update sub-course details below and click “Save Sub-Courses” to apply changes.
                          </p> */}
                        </div>

                        {subCourseList.length === 0 ? (
                          <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-lg bg-white text-xs text-gray-500">
                            No sub-courses added yet. Use “Add Sub-Course” to
                            begin assigning trainers.
                          </div>
                        ) : (
                          subCourseList.map((subCourse, index) => {
                            const inputClasses =
                              "w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
                            const trainerOptions = Array.isArray(trainers)
                              ? trainers
                              : [];

                            return (
                              <div
                                key={
                                  subCourse.tempId ||
                                  subCourse.sub_course_id ||
                                  index
                                }
                                className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3"
                              >
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-gray-700">
                                    Sub-Course {index + 1}
                                  </h4>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemoveSubCourseRow(index)
                                    }
                                    className="text-red-500 hover:text-red-700 text-base font-semibold"
                                    aria-label="Remove sub-course"
                                  >
                                    ×
                                  </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Sub-Course{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={subCourse.sub_course_id || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "sub_course_id",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      <option value="">
                                        Select Sub-Course
                                      </option>
                                      {combinedSubCourseOptions.map(
                                        (option) => (
                                          <option
                                            key={option.sub_course_id}
                                            value={option.sub_course_id}
                                          >
                                            {option.sub_course_name}
                                          </option>
                                        )
                                      )}
                                    </select>
                                    {combinedSubCourseOptions.length === 0 && (
                                      <p className="text-[11px] text-amber-600 mt-1">
                                        No sub-courses available for the
                                        selected course.
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Trainer{" "}
                                      <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                      value={subCourse.trainer_id || ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "trainer_id",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      <option value="">Select Trainer</option>
                                      {trainerOptions.map((trainer) => {
                                        const id =
                                          trainer.trainer_id ||
                                          trainer.id ||
                                          trainer.user_id;
                                        const name =
                                          trainer.trainer_name ||
                                          trainer.name ||
                                          trainer.username ||
                                          `Trainer ${id}`;
                                        return (
                                          <option key={id} value={id}>
                                            {name}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training Status
                                    </label>
                                    <select
                                      value={
                                        subCourse.training_status || "nottaken"
                                      }
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_status",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    >
                                      {TRAINING_STATUS_OPTIONS.map((option) => (
                                        <option
                                          key={option.value}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Trainer Share (%)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      step="0.01"
                                      value={subCourse.trainer_share ?? ""}
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "trainer_share",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Share Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        subCourse.trainer_share_amount ?? ""
                                      }
                                      readOnly
                                      className={`${inputClasses} bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200`}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Amount Paid (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={
                                        subCourse.amount_paid_trainer ?? ""
                                      }
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "amount_paid_trainer",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Pending Amount (₹)
                                    </label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={subCourse.pending_amount ?? ""}
                                      readOnly
                                      className={`${inputClasses} bg-gray-100 text-gray-600 border-gray-200 cursor-not-allowed focus:ring-0 focus:border-gray-200`}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training Start Date
                                    </label>
                                    <input
                                      type="date"
                                      value={
                                        formatDateForInput(
                                          subCourse.training_start_date
                                        ) || ""
                                      }
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_start_date",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Training End Date
                                    </label>
                                    <input
                                      type="date"
                                      value={
                                        formatDateForInput(
                                          subCourse.training_end_date
                                        ) || ""
                                      }
                                      onChange={(e) =>
                                        handleSubCourseInputChange(
                                          index,
                                          "training_end_date",
                                          e.target.value
                                        )
                                      }
                                      className={inputClasses}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                            </div>
                          )}
                          
                          {!isSingle && !isMultiple && (
                            <div className="text-center py-8 text-gray-500 text-xs border border-gray-200 rounded-lg p-4 bg-gray-50">
                              Please select a course structure (Single Course or
                              Multiple Courses) in the Course Info step.
                            </div>
                          )}
                        </div>
                      )}

                      {/* Placement Details Section */}
                      {((isPlacementOnly || isBoth) && trainingPlacementTab === "placement") && (
                        <div className="animate-fadeIn grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Trainer <span className="text-red-500">*</span>
                            </label>
                            {renderField(
                              "placement_trainer",
                              "Trainer",
                              "select",
                              Array.isArray(trainers) && trainers.length > 0
                                ? trainers
                                : []
                            )}
                            {(!trainers || trainers.length === 0) && (
                              <p className="text-[11px] text-amber-600 mt-1">
                                No trainers available. Please refresh the page.
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Status <span className="text-red-500">*</span>
                            </label>
                            {renderField("placement_status", "Placement Status", "select", PLACEMENT_STATUS_OPTIONS)}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Placement Start Date
                            </label>
                            {renderField("placement_start_date", "Placement Start Date", "date")}
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Placement End Date
                            </label>
                            {renderField("placement_end_date", "Placement End Date", "date")}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Navigation Buttons */}

        <div className="px-6 py-4 flex justify-end gap-2 bg-white border-t border-b mb-4">
          <button
            onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
            disabled={currentStep === 0}
          >
            Previous
          </button>

          <button
            onClick={handlePrimaryButtonClick}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            {currentStep === STEPS.length - 1 ? "Save Changes" : "Next"}
          </button>
        </div>

        {/* Follow-up reminder (contact-by date) */}
        <div className="px-6 pb-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-amber-950 flex items-center gap-2 mb-3">
              <span className="bg-amber-200 text-amber-900 p-1.5 rounded-md">
                <FaBell size={14} />
              </span>
              Follow-up reminder
            </h4>
            <p className="text-xs text-amber-900/80 mb-3">
              Pick the exact date and time to call back (e.g. tomorrow 10:00). The board highlights the card
              once that time is reached, and you get a daily summary of due follow-ups.
            </p>
            <div className="mb-3 grid gap-2 rounded-lg border border-amber-200 bg-white p-3 text-xs text-amber-900 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold">Saved reminder</span>
                <span className="text-right font-medium">
                  {savedFollowUpDateTime || "Not set yet"}
                </span>
              </div>
              {!!leadData?.follow_up_note && (
                <div className="rounded bg-amber-50 px-2 py-1 text-[11px] text-amber-900/90">
                  Note: {leadData.follow_up_note}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <label className="flex flex-col gap-1 text-[11px] font-medium text-gray-700">
                <span className="flex items-center gap-1">
                  <FaCalendarAlt className="text-amber-700" size={12} />
                  Date &amp; time
                </span>
                <input
                  type="datetime-local"
                  step={60}
                  value={followUpAtLocal}
                  onChange={(e) => setFollowUpAtLocal(e.target.value)}
                  className="min-w-[220px] rounded border border-amber-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm"
                />
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { d: 1, label: "+1d" },
                  { d: 2, label: "+2d" },
                  { d: 7, label: "+1w" },
                ].map(({ d, label }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setFollowUpPresetDays(d)}
                    className="rounded border border-amber-300 bg-white px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <label className="block text-[11px] font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <textarea
              value={followUpNote}
              onChange={(e) => setFollowUpNote(e.target.value)}
              rows={2}
              placeholder="e.g. Call after salary day, prefers evening"
              className="mb-3 w-full rounded border border-amber-200 bg-white px-2 py-1.5 text-sm text-gray-900 shadow-sm"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveFollowUp}
                disabled={savingFollowUp}
                className="rounded bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-amber-700 disabled:opacity-50"
              >
                {savingFollowUp ? "Saving…" : "Save reminder"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setFollowUpAtLocal("");
                  setFollowUpNote("");
                }}
                className="rounded border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Clear fields
              </button>
              <button
                type="button"
                onClick={async () => {
                  setFollowUpAtLocal("");
                  setFollowUpNote("");
                  if (!leadId || !leadData) return;
                  setSavingFollowUp(true);
                  try {
                    const payload = {
                      ...leadData,
                      follow_up_at: null,
                      follow_up_date: null,
                      follow_up_note: null,
                    };
                    await apiClient.put(`${endpoints.leads.root}/${leadId}`, payload);
                    setLeadData(payload);
                    showToast({ icon: "success", title: "Reminder removed" });
                    notifyLeadUpdated();
                  } catch {
                    showToast({ icon: "error", title: "Could not remove reminder" });
                  } finally {
                    setSavingFollowUp(false);
                  }
                }}
                disabled={savingFollowUp}
                className="rounded border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                Remove from lead
              </button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="px-6 pb-6">
          <div className="rounded-xl border bg-gray-50 flex flex-col h-[500px]">
            <div className="border-b px-4 py-3 bg-white rounded-t-xl flex items-center justify-between shadow-sm z-10">
              <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 p-1 rounded-md">
                  <FaRegSmile size={14} />
                </span>
                Comments & Activity
              </h4>
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                {commentsList.length} comments
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {loadingComments ? (
                <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-2"></div>
                  Loading conversation...
                </div>
              ) : commentsList?.length ? (
                commentsList.map((c, idx) => {
                  const id = getCommentId(c, idx);
                  const text = c.comment_text || c.text || c.html || "";
                  const created = getRelativeTime(c.created_at);
                  const isEditing = editingId === id;

                  // Get user data from backend response (joined from users table)
                  const createdByUsername = c.created_by || "";
                  const userFullName =
                    c.user_username ||
                    c.user_email ||
                    createdByUsername ||
                    "Unknown User";
                  const userProfileImage = c.user_profile_image || null;

                  const currentUser = getCurrentUser();

                  // Create user data object from backend data
                  const commentUserData = {
                    username: createdByUsername,
                    fullName: userFullName,
                    profileImage: userProfileImage,
                  };

                  // More robust comparison - case insensitive and trimmed
                  let isMe =
                    createdByUsername.toLowerCase().trim() ===
                    currentUser.username.toLowerCase().trim();

                  // TEMPORARY: Show Edit/Delete on ALL comments for testing
                  // TODO: Remove this once username matching is confirmed working
                  isMe = true;

                  // Check if this is a reply
                  const isReply = text.includes("<strong>@");

                  return (
                    <div
                      key={id}
                      className="flex gap-3 pb-4 border-b border-gray-100 last:border-0"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {commentUserData.profileImage ? (
                          <img
                            src={commentUserData.profileImage?.startsWith('http') || commentUserData.profileImage?.startsWith('data:') ? commentUserData.profileImage : `${API_BASE_URL}/${commentUserData.profileImage.startsWith('/') ? commentUserData.profileImage.slice(1) : commentUserData.profileImage}`}
                            alt={commentUserData.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm">
                            {commentUserData.fullName
                              ? commentUserData.fullName
                                  .split(" ")
                                  .map((w) => w[0])
                                  .join("")
                                  .slice(0, 2)
                                  .toUpperCase()
                              : "SJ"}
                          </div>
                        )}
                      </div>

                      {/* Comment Content */}
                      <div className="flex-1 min-w-0">
                        {/* Header: Name and Date */}
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900">
                            {commentUserData.fullName}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getFormattedDate(
                              c.created_at,
                              c.updated_at && c.updated_at !== c.created_at
                            )}
                          </span>
                        </div>

                        {!isEditing ? (
                          <>
                            {/* Flag/Label if exists */}
                            {c.flag && (
                              <div className="flex items-center gap-1.5 mb-2">
                                <span className="text-red-600">🚩</span>
                                <span className="text-sm font-medium text-gray-700">
                                  {c.flag}
                                </span>
                              </div>
                            )}

                            {/* Comment Text */}
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                              {(() => {
                                const mentionMatch = text.match(
                                  /<strong>@([^<]+)<\/strong>/
                                );
                                if (mentionMatch) {
                                  const mentionedUsername = mentionMatch[1];
                                  const mentionedUserData =
                                    getUserData(mentionedUsername);
                                  const restOfText = text.replace(
                                    /<strong>@[^<]+<\/strong>\s*/,
                                    ""
                                  );

                                  return (
                                    <div>
                                      <div className="text-xs text-gray-500 mb-1">
                                        Replying to{" "}
                                        <span className="font-medium text-gray-700">
                                          @{mentionedUserData.fullName}
                                        </span>
                                      </div>
                                      <div
                                        dangerouslySetInnerHTML={{
                                          __html: sanitizeHtml(restOfText),
                                        }}
                                      />
                                    </div>
                                  );
                                } else {
                                  return (
                                    <div
                                      dangerouslySetInnerHTML={{
                                        __html: sanitizeHtml(text),
                                      }}
                                    />
                                  );
                                }
                              })()}
                            </div>

                            {/* Action Buttons Below Comment - Jira Style */}
                            <div className="flex items-center gap-1 mt-3">
                              {/* Reply Button */}
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                onClick={() => {
                                  if (editorRef.current) {
                                    // Insert mention safely using DOM APIs (avoid string-based HTML injection).
                                    editorRef.current.innerHTML = "";
                                    const mention = document.createElement("strong");
                                    mention.textContent = `@${commentUserData.fullName}`;
                                    editorRef.current.appendChild(mention);
                                    editorRef.current.appendChild(
                                      document.createTextNode("\u00A0")
                                    );
                                    editorRef.current.focus();
                                    const range = document.createRange();
                                    const sel = window.getSelection();
                                    range.selectNodeContents(editorRef.current);
                                    range.collapse(false);
                                    sel.removeAllRanges();
                                    sel.addRange(range);
                                  }
                                }}
                                title="Reply"
                              >
                                <FaReply size={14} />
                              </button>

                              {/* Dynamic Like/Reaction Button */}
                              {(() => {
                                let activeReaction = null;
                                let activeReactionCount = 0;
                                let isLikeAction = false;

                                // Check for Like (👍) - Treat as emoji for display
                                if (isLiked(id)) {
                                  activeReaction = "👍";
                                  activeReactionCount = getLikeCount(id);
                                  isLikeAction = true;
                                }

                                // Check for Emoji reactions (override Like if present)
                                const options =
                                  typeof EMOJI_OPTIONS !== "undefined"
                                    ? EMOJI_OPTIONS
                                    : [
                                        "👍",
                                        "❤️",
                                        "😊",
                                        "🎉",
                                        "🔥",
                                        "👏",
                                        "💯",
                                        "😮",
                                      ];
                                for (const emoji of options) {
                                  if (hasUserReacted(id, emoji)) {
                                    activeReaction = emoji;
                                    activeReactionCount =
                                      getReactions(id)[emoji] || 0;
                                    isLikeAction = false; // It's a reaction, not a simple like
                                    break;
                                  }
                                }

                                return (
                                  <button
                                    className={`flex items-center gap-1.5 rounded transition-all ${
                                      activeReaction
                                        ? "px-2 py-0.5 bg-blue-50 border border-blue-500 hover:bg-blue-100"
                                        : "p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 border border-transparent"
                                    }`}
                                    onClick={() => {
                                      if (isLikeAction) {
                                        handleToggleLike(id);
                                      } else if (activeReaction) {
                                        handleAddReaction(id, activeReaction);
                                      } else {
                                        handleToggleLike(id);
                                      }
                                    }}
                                    title={
                                      activeReaction
                                        ? "Remove reaction"
                                        : "Like"
                                    }
                                  >
                                    {activeReaction ? (
                                      <span className="text-base leading-none">
                                        {activeReaction}
                                      </span>
                                    ) : (
                                      <FaRegThumbsUp size={14} />
                                    )}

                                    {/* Show count */}
                                    {(activeReaction
                                      ? activeReactionCount > 0
                                      : getLikeCount(id) > 0) && (
                                      <span
                                        className={`text-xs font-semibold ${
                                          activeReaction
                                            ? "text-blue-700"
                                            : "text-gray-500"
                                        }`}
                                      >
                                        {activeReaction
                                          ? activeReactionCount
                                          : getLikeCount(id)}
                                      </span>
                                    )}
                                  </button>
                                );
                              })()}

                              {/* Emoji Reaction Button with Picker */}
                              <div className="relative">
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={() =>
                                    setShowEmojiPicker(
                                      showEmojiPicker === id ? null : id
                                    )
                                  }
                                  title="Add reaction"
                                >
                                  <FaRegSmile size={14} />
                                </button>
                                {showEmojiPicker === id && (
                                  <div
                                    ref={emojiPickerRef}
                                    className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-2 z-50 flex gap-1"
                                  >
                                    {EMOJI_OPTIONS.map((emoji) => {
                                      const hasReacted = hasUserReacted(
                                        id,
                                        emoji
                                      );
                                      return (
                                        <button
                                          key={emoji}
                                          className={`text-lg hover:scale-125 transition-transform p-1.5 rounded-md ${
                                            hasReacted
                                              ? "bg-blue-50 border border-blue-200"
                                              : "hover:bg-gray-50"
                                          }`}
                                          onClick={() => {
                                            handleAddReaction(id, emoji);
                                            setShowEmojiPicker(null);
                                          }}
                                        >
                                          {emoji}
                                        </button>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Edit Button - Only for own comments */}
                              {isMe && (
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={() => {
                                    setEditingId(id);
                                    setTimeout(() => {
                                      if (editRef.current) {
                                        editRef.current.innerHTML = sanitizeHtml(text);
                                        editRef.current.focus();
                                      }
                                    }, 0);
                                  }}
                                  title="Edit"
                                >
                                  <MdEdit size={14} />
                                </button>
                              )}

                              {/* Delete Button - Only for own comments */}
                              {isMe && (
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={() => handleDeleteComment(id)}
                                  title="Delete"
                                >
                                  <MdDelete size={14} />
                                </button>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="w-full min-w-[350px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
                            <div className="flex items-center gap-1 border-b bg-gray-50 px-2 py-1.5">
                              <ToolbarButton
                                onClick={() => document.execCommand("bold")}
                                label="B"
                                bold
                              />
                              <ToolbarButton
                                onClick={() => document.execCommand("italic")}
                                label="I"
                                italic
                              />
                              <ToolbarButton
                                onClick={() =>
                                  document.execCommand("underline")
                                }
                                label="U"
                                underline
                              />
                            </div>
                            <div
                              ref={editRef}
                              contentEditable
                              className="min-h-[80px] w-full p-3 text-sm outline-none"
                            />
                            <div className="flex justify-end gap-2 p-2 bg-gray-50 border-t">
                              <button
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-md transition-colors"
                                onClick={() => setEditingId(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                                onClick={() => handleSaveCommentEdit(id)}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                    <FaRegSmile size={24} className="text-gray-300" />
                  </div>
                  <p className="text-sm">
                    No comments yet. Start the conversation!
                  </p>
                </div>
              )}
            </div>

            {/* Input Area - Jira Style */}
            <div className="p-4 bg-white border-t rounded-b-xl">
              <div className="flex gap-3">
                {/* User Avatar */}
                <div className="flex-shrink-0">
                  {(() => {
                    const currentUser = getCurrentUser();
                    return currentUser.profileImage ? (
                      <img
                        src={currentUser.profileImage?.startsWith('http') || currentUser.profileImage?.startsWith('data:') ? currentUser.profileImage : `${API_BASE_URL}/${currentUser.profileImage.startsWith('/') ? currentUser.profileImage.slice(1) : currentUser.profileImage}`}
                        alt={currentUser.fullName}
                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-blue-200 shadow-sm">
                        {currentUser.fullName
                          ? currentUser.fullName
                              .split(" ")
                              .map((w) => w[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()
                          : "AV"}
                      </div>
                    );
                  })()}
                </div>

                {/* Editor Container */}
                <div className="flex-1">
                  <div className="relative rounded-lg border-2 border-gray-300 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all bg-white shadow-sm">
                    {/* Rich Text Toolbar */}
                    <div className="flex items-center gap-1 border-b border-gray-200 px-3 py-2 bg-gray-50/80 flex-wrap">
                      {/* Text Style Dropdown */}
                      <select
                        className="text-xs border-0 bg-transparent text-gray-700 font-medium focus:outline-none cursor-pointer hover:bg-gray-100 rounded px-2 py-1 mr-1"
                        onChange={(e) => exec("formatBlock", e.target.value)}
                        defaultValue="p"
                      >
                        <option value="p">Normal text</option>
                        <option value="h1">Heading 1</option>
                        <option value="h2">Heading 2</option>
                        <option value="h3">Heading 3</option>
                      </select>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      {/* Formatting Buttons */}
                      <button
                        type="button"
                        onClick={() => exec("bold")}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Bold"
                      >
                        <FaBold size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => exec("italic")}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Italic"
                      >
                        <FaItalic size={12} />
                      </button>

                      {/* More Formatting Dropdown */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors formatting-menu-button"
                          title="More formatting"
                          onClick={() =>
                            setShowFormattingMenu(!showFormattingMenu)
                          }
                        >
                          <FaEllipsisV size={12} />
                        </button>

                        {showFormattingMenu && (
                          <div className="formatting-menu-dropdown absolute left-0 top-full mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec("underline");
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Underline</span>
                              <span className="text-xs text-gray-400">
                                Ctrl+U
                              </span>
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec("strikeThrough");
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Strikethrough</span>
                              <span className="text-xs text-gray-400">
                                Ctrl+Shift+S
                              </span>
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec(
                                  "insertHTML",
                                  '<code style="background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;">Code</code>'
                                );
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Code</span>
                              <span className="text-xs text-gray-400">
                                Ctrl+Shift+M
                              </span>
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec("subscript");
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Subscript</span>
                              <span className="text-xs text-gray-400">
                                Ctrl+Shift+,
                              </span>
                            </button>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec("superscript");
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Superscript</span>
                              <span className="text-xs text-gray-400">
                                Ctrl+Shift+.
                              </span>
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                              type="button"
                              className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-100 flex items-center justify-between"
                              onClick={() => {
                                exec("removeFormat");
                                setShowFormattingMenu(false);
                              }}
                            >
                              <span>Clear formatting</span>
                              <span className="text-xs">Ctrl+\</span>
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      {/* Text Color (Placeholder) */}
                      {/* Text Color */}
                      <div className="relative inline-flex items-center">
                        <button
                          type="button"
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors font-serif font-bold"
                          title="Text Color"
                          onClick={() =>
                            document.getElementById("textColorInput").click()
                          }
                        >
                          A
                        </button>
                        <input
                          id="textColorInput"
                          type="color"
                          className="absolute opacity-0 w-0 h-0 overflow-hidden"
                          onChange={(e) => exec("foreColor", e.target.value)}
                        />
                      </div>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      {/* Lists */}
                      <button
                        type="button"
                        onClick={() => exec("insertUnorderedList")}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Bullet List"
                      >
                        <FaListUl size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => exec("insertOrderedList")}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Numbered List"
                      >
                        <FaListOl size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          exec("insertHTML", '<input type="checkbox" />&nbsp;')
                        }
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Task List"
                      >
                        <FaCheckSquare size={12} />
                      </button>

                      <div className="w-px h-4 bg-gray-300 mx-1"></div>

                      {/* Insert Objects */}
                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter Link URL:");
                          if (url) exec("createLink", url);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Link"
                      >
                        <FaLink size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter Image URL:");
                          if (url) exec("insertImage", url);
                        }}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Image"
                      >
                        <FaImage size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() => exec("insertHTML", "@")}
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Mention"
                      >
                        <FaAt size={12} />
                      </button>

                      {/* Emoji Picker */}
                      <div className="relative inline-block">
                        <button
                          type="button"
                          className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors emoji-picker-button"
                          title="Insert Emoji"
                          onClick={() =>
                            setShowEmojiPickerToolbar(!showEmojiPickerToolbar)
                          }
                        >
                          <FaRegSmile size={12} />
                        </button>

                        {showEmojiPickerToolbar && (
                          <div className="emoji-picker-dropdown absolute left-0 top-full mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                            {/* Smileys & Emotion */}
                            <div className="p-2 border-b">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Smileys & Emotion
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "😀",
                                  "😃",
                                  "😄",
                                  "😁",
                                  "😆",
                                  "😅",
                                  "🤣",
                                  "😂",
                                  "🙂",
                                  "🙃",
                                  "😉",
                                  "😊",
                                  "😇",
                                  "🥰",
                                  "😍",
                                  "🤩",
                                  "😘",
                                  "😗",
                                  "😚",
                                  "😙",
                                  "🥲",
                                  "😋",
                                  "😛",
                                  "😜",
                                  "🤪",
                                  "😝",
                                  "🤑",
                                  "🤗",
                                  "🤭",
                                  "🤫",
                                  "🤔",
                                  "🤐",
                                  "🤨",
                                  "😐",
                                  "😑",
                                  "😶",
                                  "😏",
                                  "😒",
                                  "🙄",
                                  "😬",
                                  "🤥",
                                  "😌",
                                  "😔",
                                  "😪",
                                  "🤤",
                                  "😴",
                                  "😷",
                                  "🤒",
                                  "🤕",
                                  "🤢",
                                  "🤮",
                                  "🤧",
                                  "🥵",
                                  "🥶",
                                  "🥴",
                                  "😵",
                                  "🤯",
                                  "🤠",
                                  "🥳",
                                  "🥸",
                                  "😎",
                                  "🤓",
                                  "🧐",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* People & Body */}
                            <div className="p-2 border-b">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                People & Body
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "👋",
                                  "🤚",
                                  "🖐",
                                  "✋",
                                  "🖖",
                                  "👌",
                                  "🤌",
                                  "🤏",
                                  "✌️",
                                  "🤞",
                                  "🤟",
                                  "🤘",
                                  "🤙",
                                  "👈",
                                  "👉",
                                  "👆",
                                  "🖕",
                                  "👇",
                                  "☝️",
                                  "👍",
                                  "👎",
                                  "✊",
                                  "👊",
                                  "🤛",
                                  "🤜",
                                  "👏",
                                  "🙌",
                                  "👐",
                                  "🤲",
                                  "🤝",
                                  "🙏",
                                  "✍️",
                                  "💅",
                                  "🤳",
                                  "💪",
                                  "🦾",
                                  "🦿",
                                  "🦵",
                                  "🦶",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Nature */}
                            <div className="p-2 border-b">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Animals & Nature
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🐶",
                                  "🐱",
                                  "🐭",
                                  "🐹",
                                  "🐰",
                                  "🦊",
                                  "🐻",
                                  "🐼",
                                  "🐨",
                                  "🐯",
                                  "🦁",
                                  "🐮",
                                  "🐷",
                                  "🐸",
                                  "🐵",
                                  "🐔",
                                  "🐧",
                                  "🐦",
                                  "🐤",
                                  "🦆",
                                  "🦅",
                                  "🦉",
                                  "🦇",
                                  "🐺",
                                  "🐗",
                                  "🐴",
                                  "🦄",
                                  "🐝",
                                  "🐛",
                                  "🦋",
                                  "🐌",
                                  "🐞",
                                  "🐜",
                                  "🦟",
                                  "🦗",
                                  "🕷",
                                  "🦂",
                                  "🐢",
                                  "🐍",
                                  "🦎",
                                  "🦖",
                                  "🦕",
                                  "🐙",
                                  "🦑",
                                  "🦐",
                                  "🦞",
                                  "🦀",
                                  "🐡",
                                  "🐠",
                                  "🐟",
                                  "🐬",
                                  "🐳",
                                  "🐋",
                                  "🦈",
                                  "🐊",
                                  "🐅",
                                  "🐆",
                                  "🦓",
                                  "🦍",
                                  "🦧",
                                  "🐘",
                                  "🦛",
                                  "🦏",
                                  "🐪",
                                  "🐫",
                                  "🦒",
                                  "🦘",
                                  "🐃",
                                  "🐂",
                                  "🐄",
                                  "🐎",
                                  "🐖",
                                  "🐏",
                                  "🐑",
                                  "🦙",
                                  "🐐",
                                  "🦌",
                                  "🐕",
                                  "🐩",
                                  "🦮",
                                  "🐈",
                                  "🐓",
                                  "🦃",
                                  "🦚",
                                  "🦜",
                                  "🦢",
                                  "🦩",
                                  "🕊",
                                  "🐇",
                                  "🦝",
                                  "🦨",
                                  "🦡",
                                  "🦦",
                                  "🦥",
                                  "🐁",
                                  "🐀",
                                  "🐿",
                                  "🦔",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Food & Drink */}
                            <div className="p-2 border-b">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Food & Drink
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "🍇",
                                  "🍈",
                                  "🍉",
                                  "🍊",
                                  "🍋",
                                  "🍌",
                                  "🍍",
                                  "🥭",
                                  "🍎",
                                  "🍏",
                                  "🍐",
                                  "🍑",
                                  "🍒",
                                  "🍓",
                                  "🥝",
                                  "🍅",
                                  "🥥",
                                  "🥑",
                                  "🍆",
                                  "🥔",
                                  "🥕",
                                  "🌽",
                                  "🌶",
                                  "🥒",
                                  "🥬",
                                  "🥦",
                                  "🧄",
                                  "🧅",
                                  "🍄",
                                  "🥜",
                                  "🌰",
                                  "🍞",
                                  "🥐",
                                  "🥖",
                                  "🥨",
                                  "🥯",
                                  "🥞",
                                  "🧇",
                                  "🧀",
                                  "🍖",
                                  "🍗",
                                  "🥩",
                                  "🥓",
                                  "🍔",
                                  "🍟",
                                  "🍕",
                                  "🌭",
                                  "🥪",
                                  "🌮",
                                  "🌯",
                                  "🥙",
                                  "🧆",
                                  "🥚",
                                  "🍳",
                                  "🥘",
                                  "🍲",
                                  "🥣",
                                  "🥗",
                                  "🍿",
                                  "🧈",
                                  "🧂",
                                  "🥫",
                                  "🍱",
                                  "🍘",
                                  "🍙",
                                  "🍚",
                                  "🍛",
                                  "🍜",
                                  "🍝",
                                  "🍠",
                                  "🍢",
                                  "🍣",
                                  "🍤",
                                  "🍥",
                                  "🥮",
                                  "🍡",
                                  "🥟",
                                  "🥠",
                                  "🥡",
                                  "🦀",
                                  "🦞",
                                  "🦐",
                                  "🦑",
                                  "🦪",
                                  "🍦",
                                  "🍧",
                                  "🍨",
                                  "🍩",
                                  "🍪",
                                  "🎂",
                                  "🍰",
                                  "🧁",
                                  "🥧",
                                  "🍫",
                                  "🍬",
                                  "🍭",
                                  "🍮",
                                  "🍯",
                                  "🍼",
                                  "🥛",
                                  "☕",
                                  "🍵",
                                  "🍶",
                                  "🍾",
                                  "🍷",
                                  "🍸",
                                  "🍹",
                                  "🍺",
                                  "🍻",
                                  "🥂",
                                  "🥃",
                                  "🥤",
                                  "🧋",
                                  "🧃",
                                  "🧉",
                                  "🧊",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Activities */}
                            <div className="p-2 border-b">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Activities
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "⚽",
                                  "🏀",
                                  "🏈",
                                  "⚾",
                                  "🥎",
                                  "🎾",
                                  "🏐",
                                  "🏉",
                                  "🥏",
                                  "🎱",
                                  "🪀",
                                  "🏓",
                                  "🏸",
                                  "🏒",
                                  "🏑",
                                  "🥍",
                                  "🏏",
                                  "🥅",
                                  "⛳",
                                  "🪁",
                                  "🏹",
                                  "🎣",
                                  "🤿",
                                  "🥊",
                                  "🥋",
                                  "🎽",
                                  "🛹",
                                  "🛼",
                                  "🛷",
                                  "⛸",
                                  "🥌",
                                  "🎿",
                                  "⛷",
                                  "🏂",
                                  "🪂",
                                  "🏋️",
                                  "🤼",
                                  "🤸",
                                  "🤺",
                                  "🤾",
                                  "🏌️",
                                  "🏇",
                                  "🧘",
                                  "🏊",
                                  "🤽",
                                  "🚣",
                                  "🧗",
                                  "🚴",
                                  "🚵",
                                  "🎪",
                                  "🎭",
                                  "🎨",
                                  "🎬",
                                  "🎤",
                                  "🎧",
                                  "🎼",
                                  "🎹",
                                  "🥁",
                                  "🎷",
                                  "🎺",
                                  "🎸",
                                  "🪕",
                                  "🎻",
                                  "🎲",
                                  "♟",
                                  "🎯",
                                  "🎳",
                                  "🎮",
                                  "🎰",
                                  "🧩",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {/* Objects */}
                            <div className="p-2">
                              <div className="text-xs text-gray-500 font-medium mb-2">
                                Objects
                              </div>
                              <div className="grid grid-cols-8 gap-1">
                                {[
                                  "💼",
                                  "📁",
                                  "📂",
                                  "📅",
                                  "📆",
                                  "🗒",
                                  "🗓",
                                  "📇",
                                  "📈",
                                  "📉",
                                  "📊",
                                  "📋",
                                  "📌",
                                  "📍",
                                  "📎",
                                  "🖇",
                                  "📏",
                                  "📐",
                                  "✂️",
                                  "🗃",
                                  "🗄",
                                  "🗑",
                                  "🔒",
                                  "🔓",
                                  "🔏",
                                  "🔐",
                                  "🔑",
                                  "🗝",
                                  "🔨",
                                  "🪓",
                                  "⛏",
                                  "⚒",
                                  "🛠",
                                  "🗡",
                                  "⚔️",
                                  "🔫",
                                  "🪃",
                                  "🏹",
                                  "🛡",
                                  "🪚",
                                  "🔧",
                                  "🪛",
                                  "🔩",
                                  "⚙️",
                                  "🗜",
                                  "⚖️",
                                  "🦯",
                                  "🔗",
                                  "⛓",
                                  "🪝",
                                  "🧰",
                                  "🧲",
                                  "🪜",
                                  "⚗️",
                                  "🧪",
                                  "🧫",
                                  "🧬",
                                  "🔬",
                                  "🔭",
                                  "📡",
                                  "💉",
                                  "🩸",
                                  "💊",
                                  "🩹",
                                  "🩺",
                                  "🚪",
                                  "🛗",
                                  "🪞",
                                  "🪟",
                                  "🛏",
                                  "🛋",
                                  "🪑",
                                  "🚽",
                                  "🪠",
                                  "🚿",
                                  "🛁",
                                  "🪤",
                                  "🪒",
                                  "🧴",
                                  "🧷",
                                  "🧹",
                                  "🧺",
                                  "🧻",
                                  "🪣",
                                  "🧼",
                                  "🪥",
                                  "🧽",
                                  "🧯",
                                  "🛒",
                                  "🚬",
                                  "⚰️",
                                  "🪦",
                                  "⚱️",
                                  "🗿",
                                  "🪧",
                                ].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    className="text-xl hover:bg-gray-100 rounded p-1 transition-colors"
                                    onClick={() => {
                                      exec("insertText", emoji);
                                      setShowEmojiPickerToolbar(false);
                                    }}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          exec(
                            "insertHTML",
                            '<table border="1" style="border-collapse: collapse; width: 100%;"><tbody><tr><td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td><td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td></tr><tr><td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td><td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td></tr></tbody></table>'
                          )
                        }
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Table"
                      >
                        <FaTable size={12} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          exec(
                            "insertHTML",
                            '<code style="background: #f4f4f4; padding: 2px 4px; rounded: 4px; font-family: monospace;">Code</code>'
                          )
                        }
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="Code"
                      >
                        <FaCode size={12} />
                      </button>

                      <button
                        type="button"
                        className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        title="More"
                      >
                        <FaPlus size={12} />
                      </button>
                    </div>

                    {/* Editor Area */}
                    <div
                      ref={editorRef}
                      contentEditable
                      className="min-h-[100px] max-h-[200px] overflow-y-auto w-full px-4 py-3 text-sm outline-none text-gray-800 leading-relaxed"
                      data-placeholder="Type @ to mention and notify someone."
                      style={{
                        empty:
                          editorRef?.current?.textContent === ""
                            ? "true"
                            : "false",
                      }}
                    />

                    {/* Add Mentions Section */}
                    {editorRef?.current?.innerHTML?.includes("@") && (
                      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50/50">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-gray-600">
                            Add mentions:
                          </span>
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-xs font-medium text-blue-600">
                              +
                            </span>
                            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-bold">
                              SJ
                            </div>
                            <span className="text-xs text-gray-700">
                              Savitha J
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      type="button"
                      disabled={savingComment}
                      onClick={handleAddComment}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded hover:bg-blue-700 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {savingComment ? (
                        <span className="flex items-center gap-2">
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (editorRef.current) {
                          editorRef.current.innerHTML = "";
                        }
                      }}
                      className="px-4 py-2 text-gray-700 text-sm font-medium hover:bg-gray-100 rounded transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components for Comments

function Pill({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full px-2.5 py-1 text-[11.5px]",

        active
          ? "bg-gray-200 text-gray-900"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ToolbarButton({ onClick, label, bold, italic, underline }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-2 py-1 text-xs rounded hover:bg-gray-100",

        bold ? "font-bold" : "",

        italic ? "italic" : "",

        underline ? "underline" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="mx-2 h-4 w-px bg-gray-200 inline-block" />;
}

function MenuBtn({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full px-4 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50"
    >
      {label}
    </button>
  );
}

export default EditLeadForm;
