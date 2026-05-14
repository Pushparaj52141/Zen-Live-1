import React, { lazy, Suspense, useState, useEffect, useMemo, useCallback } from "react";
import Swal from "sweetalert2";
import SearchableSelect from "@shared/components/SearchableSelect";
import {
  validateMobileByCountry,
  stripMobileSpaces as stripMobile,
} from "@shared/utils/countryMobileValidation";
import {
  discountedTotalWithGst,
  placementBaseAmount,
} from "@shared/utils/feeGst";
import {
  STEPS,
  TRAINING_STATUS_OPTIONS,
  PLACEMENT_STATUS_OPTIONS,
} from "./addLeadModal/constants/addLeadModalConstants";
import { addLeadModalService } from "./addLeadModal/services/addLeadModalService";
import { useAddLeadModalSwalStyles } from "./addLeadModal/hooks/useAddLeadModalSwalStyles";

const AddLeadTrainingPlacementStep = lazy(() =>
  import("./addLeadModal/components/AddLeadTrainingPlacementStep")
);
const AddLeadCourseInfoStep = lazy(() =>
  import("./addLeadModal/components/AddLeadCourseInfoStep")
);
const AddLeadBasicInfoStep = lazy(() =>
  import("./addLeadModal/components/AddLeadBasicInfoStep")
);
const AddLeadPaymentInfoStep = lazy(() =>
  import("./addLeadModal/components/AddLeadPaymentInfoStep")
);

const AddLeadModal = ({ open, onClose, onSaved }) => {
  useAddLeadModalSwalStyles();
  // =========================
  // 🔹 Form States
  // =========================
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Basic Info
  const [name, setName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [manualCountryCode, setManualCountryCode] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [college, setCollege] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");
  const [referredBy, setReferredBy] = useState("");
  const [status, setStatus] = useState("enquiry");
  const [priority, setPriority] = useState("normal");
  const [metaCampaignId, setMetaCampaignId] = useState("");

  // Course Info
  const [courseType, setCourseType] = useState("");
  const [course, setCourse] = useState("");
  const [selectedBatchIds, setSelectedBatchIds] = useState([]);
  const [assignee, setAssignee] = useState("");
  const [unit, setUnit] = useState("");
  const [cardType, setCardType] = useState("");
  const [courseStructure, setCourseStructure] = useState("");

  // Payment Info
  const [actualFee, setActualFee] = useState("");
  const [discountedFee, setDiscountedFee] = useState("");
  const [paidStatus, setPaidStatus] = useState("");
  const [placementActualFee, setPlacementActualFee] = useState("");
  const [placementDiscountedFee, setPlacementDiscountedFee] = useState("");
  const [placementPaid, setPlacementPaid] = useState("");
  const [placementPending, setPlacementPending] = useState("");
  const [placementPaidStatus, setPlacementPaidStatus] = useState("");

  // Single Course Trainer
  const [trainerIdSingle, setTrainerIdSingle] = useState("");
  const [trainerShare, setTrainerShare] = useState("");
  const [trainerShareAmount, setTrainerShareAmount] = useState("");
  const [amountPaidTrainer, setAmountPaidTrainer] = useState("");
  const [pendingAmount, setPendingAmount] = useState("");
  const [trainingStatusSingle, setTrainingStatusSingle] = useState("nottaken");
  const [trainingStartDateSingle, setTrainingStartDateSingle] = useState("");
  const [trainingEndDateSingle, setTrainingEndDateSingle] = useState("");
  const [trainerPaidSingle, setTrainerPaidSingle] = useState(false);

  // Placement Info
  const [placementTrainerId, setPlacementTrainerId] = useState("");
  const [placementStatus, setPlacementStatus] = useState("");
  const [placementStartDate, setPlacementStartDate] = useState("");
  const [placementEndDate, setPlacementEndDate] = useState("");

  // Tab control for Step 4
  const [trainingPlacementTab, setTrainingPlacementTab] = useState("training");

  // Sub-courses
  const [subCourseList, setSubCourseList] = useState([]);

  // Dropdown Data
  const [courseTypes, setCourseTypes] = useState([]);
  const [courses, setCourses] = useState([]);
  const [subCourses, setSubCourses] = useState([]);
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

  // Validation
  const [fieldErrors, setFieldErrors] = useState({});

  // Collapsible sections state
  const [feeSectionOpen, setFeeSectionOpen] = useState(false);
  const [placementFeeSectionOpen, setPlacementFeeSectionOpen] = useState(true);

  // =========================
  // 🔹 Filtered Courses by Course Type
  // =========================
  const filteredCourses = useMemo(() => {
    if (!courseType) return courses;
    // Match by course_type field (can be string or object property)
    return courses.filter((c) => {
      const courseTypeValue = c.course_type || c.courseType || c.type || "";
      return String(courseTypeValue) === String(courseType);
    });
  }, [courseType, courses]);

  // =========================
  // 🔹 Check if source is Referral
  // =========================
  const isReferralSource = useMemo(() => {
    const referralSource = sources.find(
      (s) => String(s.name || "").toLowerCase() === "referral"
    );
    return source === String(referralSource?.id);
  }, [source, sources]);

  // =========================
  // 🔹 Check if source is Meta Ads
  // =========================
  const isMetaAdsSource = useMemo(() => {
    const metaAdsSource = sources.find(
      (s) =>
        String(s.name || "").toLowerCase() === "metaad" ||
        String(s.name || "").toLowerCase() === "meta ad" ||
        String(s.name || "").toLowerCase() === "meta ads"
    );
    return source === String(metaAdsSource?.id);
  }, [source, sources]);

  // =========================
  // 🔹 Card Type Visibility Logic
  // =========================
  const cardTypeVisibility = useMemo(() => {
    const selectedCardTypeId = String(cardType);
    const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
    const isPlacementOnly =
      selectedCardTypeId === String(cardTypeIds.PLACEMENT);
    const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);

    return {
      showTraining: isTrainingOnly || isBoth,
      showPlacement: isPlacementOnly || isBoth,
    };
  }, [cardType, cardTypeIds]);

  // =========================
  // 🔹 Auto-select Tab Based on Card Type
  // =========================
  useEffect(() => {
    if (!cardType) return;
    
    const selectedCardTypeId = String(cardType);
    const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
    const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);
    
    if (isTrainingOnly) {
      setTrainingPlacementTab("training");
    } else if (isPlacementOnly) {
      setTrainingPlacementTab("placement");
    }
    // For "Training & Placement", keep current tab or default to training
  }, [cardType, cardTypeIds]);

  // =========================
  // 🔹 Fetch All Dropdown Data
  // =========================
  useEffect(() => {
    if (!open) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [
          courseTypesRes,
          coursesRes,
          trainersRes,
          batchesRes,
          assigneesRes,
          unitsRes,
          cardTypesRes,
          sourcesRes,
          rolesRes,
        ] = await addLeadModalService.fetchDropdownData();

        if (courseTypesRes?.success) {
          // getCourseTypes returns array of strings, normalize to objects
          const courseTypesData = courseTypesRes.data || [];
          const normalizedCourseTypes = courseTypesData.map((ct) => {
            if (typeof ct === "string") {
              return { id: ct, name: ct, course_type: ct };
            }
            return {
              id: ct.id || ct.course_type || ct,
              name: ct.name || ct.course_type || String(ct),
              course_type: ct.course_type || ct.name || ct,
            };
          });
          setCourseTypes(normalizedCourseTypes);
          console.log("Course types loaded:", normalizedCourseTypes);
        } else {
          console.error("Failed to load course types:", courseTypesRes?.error);
          setCourseTypes([]);
        }
        if (coursesRes?.success) {
          // Normalize courses data - handle different response structures
          const coursesData = coursesRes.data || [];
          let rawCourses = coursesData;
          
          // Handle if data is wrapped in 'courses' property
          if (coursesData.courses && Array.isArray(coursesData.courses)) {
            rawCourses = coursesData.courses;
          } else if (coursesData.data && Array.isArray(coursesData.data)) {
            rawCourses = coursesData.data;
          }
          
          // Normalize course objects
          const normalizedCourses = (Array.isArray(rawCourses) ? rawCourses : []).map((c) => ({
            course_id: c.course_id || c.id || c._id,
            id: c.course_id || c.id || c._id,
            course_name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            name: c.course_name || c.name || c.title || String(c.course_id || c.id),
            course_type: c.course_type || c.courseType || c.type || "",
            _raw: c,
          }));
          setCourses(normalizedCourses);
          console.log("Courses loaded:", normalizedCourses);
        } else {
          console.error("Failed to load courses:", coursesRes?.error);
          setCourses([]);
        }
        if (trainersRes?.success) {
          setTrainers(trainersRes.data || []);
        }
        if (batchesRes?.success) {
          setBatches(batchesRes.data || []);
        }
        if (assigneesRes?.success) {
          setAssignees(assigneesRes.data || []);
        }
        if (unitsRes?.success) {
          setUnits(unitsRes.data || []);
        }
        if (cardTypesRes?.success) {
          const cardTypesData = cardTypesRes.data || [];
          console.log('CardTypes loaded from API:', cardTypesData);
          console.log('CardTypes sample item:', cardTypesData[0]);
          setCardTypes(cardTypesData);

          // Build card type IDs mapping
          const ids = { TRAINING: null, PLACEMENT: null, BOTH: null };
          cardTypesData.forEach((card) => {
            const label = String(card.name || "").toLowerCase();
            if (label.includes("training") && label.includes("placement")) {
              ids.BOTH = card.id;
            } else if (label === "training only") {
              ids.TRAINING = card.id;
            } else if (label === "placement only") {
              ids.PLACEMENT = card.id;
            }
          });
          setCardTypeIds(ids);
          console.log('CardType IDs mapping:', ids);
        } else {
          console.error('Failed to load card types:', cardTypesRes?.error);
          setCardTypes([]);
        }
        if (sourcesRes?.success) {
          setSources(sourcesRes.data || []);
          console.log("Sources loaded:", sourcesRes.data);
        } else {
          console.error("Failed to load sources:", sourcesRes?.error);
          setSources([]);
        }
        if (rolesRes?.success) {
          setRoles(rolesRes.data || []);
          console.log("Roles loaded:", rolesRes.data);
        } else {
          console.error("Failed to load roles:", rolesRes?.error);
          setRoles([]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
        // Set empty arrays on error to prevent undefined state
        setCourseTypes([]);
        setCourses([]);
        setSources([]);
        setRoles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [open]);

  // =========================
  // 🔹 Fetch Sub-Courses when Course Changes
  // =========================
  useEffect(() => {
    if (!course) {
      setSubCourses([]);
      return;
    }

    const fetchSubCourses = async () => {
      try {
        const data = await addLeadModalService.getSubCoursesByCourseId(course);
        setSubCourses(data);
      } catch (error) {
        console.error("Error fetching sub-courses:", error);
        setSubCourses([]);
      }
    };

    fetchSubCourses();
  }, [course]);

  // =========================
  // 🔹 Fetch Meta Campaigns when Meta Ads is selected
  // =========================
  useEffect(() => {
    if (!isMetaAdsSource) {
      setMetaCampaigns([]);
      return;
    }

    const fetchMetaCampaigns = async () => {
      try {
        const data = await addLeadModalService.getMetaCampaigns();
        setMetaCampaigns(data);
      } catch (error) {
        console.error("Error fetching meta campaigns:", error);
        setMetaCampaigns([]);
      }
    };

    fetchMetaCampaigns();
  }, [isMetaAdsSource]);

  // =========================
  // 🔹 Auto-calculate Fee Balance
  // =========================
  // =========================
  // 🔹 Auto-calculate Placement Pending
  // =========================
  useEffect(() => {
    const base = placementBaseAmount(
      placementDiscountedFee,
      placementActualFee
    );
    const fee =
      (base != null ? discountedTotalWithGst(base) : null) || 0;
    const paid = parseFloat(placementPaid) || 0;
    const pending = fee - paid;
    setPlacementPending(pending > 0 ? pending.toFixed(2) : "");
  }, [placementActualFee, placementDiscountedFee, placementPaid]);

  // =========================
  // 🔹 Auto-calculate Trainer Share Amount (Single Course)
  // =========================
  useEffect(() => {
    const baseDf = parseFloat(discountedFee);
    const totalFee =
      (Number.isFinite(baseDf) && baseDf > 0
        ? discountedTotalWithGst(baseDf)
        : null) ||
      parseFloat(actualFee) ||
      0;
    const sharePercent = parseFloat(trainerShare) || 0;
    const shareAmount =
      totalFee > 0 && sharePercent > 0
        ? ((totalFee * sharePercent) / 100).toFixed(2)
        : "";
    setTrainerShareAmount(shareAmount);

    const paid = parseFloat(amountPaidTrainer) || 0;
    const pending = shareAmount
      ? (parseFloat(shareAmount) - paid).toFixed(2)
      : "";
    setPendingAmount(pending);
  }, [discountedFee, actualFee, trainerShare, amountPaidTrainer]);

  // =========================
  // 🔹 Validation Helpers
  // =========================
  const clearFieldError = useCallback((fieldKey) => {
    setFieldErrors((prev) => {
      if (!prev || !prev[fieldKey]) return prev;
      const updated = { ...prev };
      delete updated[fieldKey];
      return updated;
    });
  }, []);

  const getInputClasses = (field, extra = "w-full") => {
    const base =
      "border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2";
    const errorState =
      "border-red-500 bg-red-50 focus:ring-red-500 focus:border-red-500";
    const normalState =
      "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
    return `${extra} ${base} ${
      fieldErrors[field] ? errorState : normalState
    }`.trim();
  };

  const buildAlertContent = (errors = {}) => {
    const messages = [...new Set(Object.values(errors).filter(Boolean))];
    if (!messages.length) {
      return { title: "Validation Error", text: "Please fill all required fields." };
    }

    const requiredFields = messages
      .map((msg) => {
        const match = msg.match(/^(.+?) is required\.?$/i);
        if (match) return match[1];
        return null;
      })
      .filter(Boolean);

    if (requiredFields.length) {
      const uniqueFields = [...new Set(requiredFields)];
      const isPlural = uniqueFields.length > 1;
      return {
        title: "Missing Fields",
        text: `Please fill the ${isPlural ? "fields" : "field"}: ${uniqueFields.join(", ")}.`,
      };
    }

    if (messages.length === 1) {
      return { title: "Validation Error", text: messages[0] };
    }

    const listItems = messages.map((msg) => `<li>${msg}</li>`).join("");
    return {
      title: "Validation Error",
      html: `<div style="text-align:left;"><p style="margin:0 0 0.35rem 0;">Please fix the following:</p><ul style="margin:0;padding-left:1.25rem;">${listItems}</ul></div>`,
    };
  };

  // =========================
  // 🔹 Sub-Course Handlers
  // =========================
  const handleAddSubCourse = () => {
    setSubCourseList((prev) => [
      ...prev,
      {
        sub_course_id: "",
        trainer_id: "",
        trainer_share: "",
        trainer_share_amount: "",
        amount_paid_to_trainer: "",
        pending_amount: "",
        training_status: "nottaken",
        training_start_date: "",
        training_end_date: "",
        trainer_paid: false,
      },
    ]);
  };

  const handleSubCourseChange = (index, field, value) => {
    setSubCourseList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // Auto-calculate trainer share amount and pending
      if (field === "trainer_share" || field === "amount_paid_to_trainer") {
        const discountedFeeVal = parseFloat(discountedFee) || 0;
        const feeInclGst =
          discountedTotalWithGst(discountedFeeVal) ?? discountedFeeVal;
        const sharePercent = parseFloat(updated[index].trainer_share) || 0;
        const paid = parseFloat(updated[index].amount_paid_to_trainer) || 0;

        const shareAmount =
          feeInclGst > 0 && sharePercent > 0
            ? ((feeInclGst * sharePercent) / 100).toFixed(2)
            : "";
        updated[index].trainer_share_amount = shareAmount;

        const pending = shareAmount
          ? (parseFloat(shareAmount) - paid).toFixed(2)
          : "";
        updated[index].pending_amount = pending;
      }

      return updated;
    });

    if (field === "sub_course_id") {
      clearFieldError(`subCourse_${index}`);
    }
    if (field === "trainer_id") {
      clearFieldError(`subTrainer_${index}`);
    }
  };

  const handleRemoveSubCourse = (index) => {
    setSubCourseList((prev) => prev.filter((_, i) => i !== index));
    clearFieldError(`subCourse_${index}`);
    clearFieldError(`subTrainer_${index}`);
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 0) {
      // Step 1: Basic Info
      if (!name.trim()) errors.name = "Name is required";
      const finalCountryCode =
        countryCode === "manual" ? manualCountryCode : countryCode;
      if (!finalCountryCode.trim()) errors.countryCode = "Country code is required";
      const mobileDigits = stripMobile(mobileNumber);
      if (!mobileDigits) {
        errors.mobile = "Mobile number is required.";
      } else {
        const result = validateMobileByCountry(mobileDigits, finalCountryCode);
        if (!result.valid) errors.mobile = result.message;
      }
      if (!status) errors.status = "Status is required";
      if (!source) errors.source = "Source is required";
    } else if (step === 1) {
      // Step 2: Course Info
      if (!assignee || assignee.toString().trim() === '') errors.assignee = "Assign To is required";
      if (!unit || unit.toString().trim() === '') errors.unit = "Business Unit is required";
      if (!cardType || cardType.toString().trim() === '') errors.cardType = "Card Type is required";
      if (!courseType || courseType.toString().trim() === '') errors.courseType = "Course Type is required";
      
      // Validate course - handle different types
      if (!course) {
        errors.course = "Course is required";
      } else if (typeof course === 'string' && course.trim() === '') {
        errors.course = "Course is required";
      } else if (typeof course === 'object' && course !== null) {
        // If course is an object, check if it has a valid ID
        const courseId = course.course_id || course.id || course._id;
        if (!courseId || (typeof courseId === 'string' && courseId.trim() === '')) {
          errors.course = "Course is required";
        }
      } else if (typeof course === 'number' && (isNaN(course) || course <= 0)) {
        errors.course = "Course is required";
      }
      
      // Only validate course structure for Training or Both card types (not for Placement Only)
      const selectedCardTypeId = String(cardType);
      const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);
      
      if (!isPlacementOnly && !courseStructure) {
        errors.courseStructure = "Course Structure is required";
      }

      // Validate sub-courses if multiple structure
      if (courseStructure === "multiple") {
        subCourseList.forEach((sub, idx) => {
          if (!sub.sub_course_id) {
            errors[`subCourse_${idx}`] = "Sub-course is required";
          }
          if (!sub.trainer_id) {
            errors[`subTrainer_${idx}`] = "Trainer is required";
          }
        });
      }
    } else if (step === 3) {
      // Step 4: Trainer & Training / Placement
      const selectedCardTypeId = String(cardType);
      const isTrainingOnly = selectedCardTypeId === String(cardTypeIds.TRAINING);
      const isPlacementOnly = selectedCardTypeId === String(cardTypeIds.PLACEMENT);
      const isBoth = selectedCardTypeId === String(cardTypeIds.BOTH);
      
      // Validate training fields if training tab is active or required
      if ((isTrainingOnly || isBoth) && trainingPlacementTab === "training") {
        if (courseStructure === "single") {
          if (!trainerIdSingle) errors.trainerIdSingle = "Trainer is required";
          if (!trainingStatusSingle) errors.trainingStatusSingle = "Training Status is required";
          if (trainerShare && parseFloat(trainerShare) > 100) {
            errors.trainerShare = "Trainer Share cannot exceed 100%";
          }
        }
      }
      
      // Validate placement fields if placement tab is active or required
      if ((isPlacementOnly || isBoth) && trainingPlacementTab === "placement") {
        if (!placementTrainerId) errors.placementTrainerId = "Trainer is required";
        if (!placementStatus) errors.placementStatus = "Placement Status is required";
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(currentStep);
    if (Object.keys(errors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...errors }));

      let targetStep = currentStep;
      if (
        errors.trainerIdSingle ||
        errors.trainingStatusSingle ||
        errors.trainerShare ||
        errors.placementDomain ||
        errors.placementStatus ||
        Object.keys(errors).some((key) => key.startsWith("subCourse_") || key.startsWith("subTrainer_"))
      ) {
        targetStep = 3;
      } else if (
        errors.assignee ||
        errors.unit ||
        errors.cardType ||
        errors.courseType ||
        errors.courseStructure ||
        errors.course
      ) {
        targetStep = 1;
      } else if (errors.name || errors.mobile || errors.status || errors.source || errors.countryCode) {
        targetStep = 0;
      }
      if (targetStep !== currentStep) {
        setCurrentStep(targetStep);
      }

      const alertContent = buildAlertContent(errors);
      Swal.fire({
        icon: "error",
        title: alertContent.title || "Validation Error",
        ...(alertContent.text
          ? { text: alertContent.text }
          : { html: alertContent.html }),
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // =========================
  // 🔹 Helper function to parse UUID values (for unit_id, card_type_id, etc.)
  // =========================
  const parseUuidValue = (value, fieldName) => {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      console.log(`${fieldName} is null/undefined/empty:`, value);
      return null;
    }
    
    // Convert to string and trim
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
      console.log(`${fieldName} string value is empty or invalid:`, strValue);
      return null;
    }
    
    // Validate UUID format (8-4-4-4-12 hexadecimal characters)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(strValue)) {
      console.log(`${fieldName} is not a valid UUID:`, strValue);
      return null;
    }
    
    console.log(`${fieldName} successfully parsed as UUID:`, value, '->', strValue);
    return strValue;
  };

  // =========================
  // 🔹 Helper function to parse ID values (numeric only - for batch_id, etc.)
  // =========================
  const parseIdValue = (value, fieldName) => {
    // Handle null, undefined, empty string
    if (value === null || value === undefined || value === '') {
      console.log(`${fieldName} is null/undefined/empty:`, value);
      return null;
    }
    
    // Convert to string and trim
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined' || strValue === '0') {
      console.log(`${fieldName} string value is empty or invalid:`, strValue);
      return null;
    }
    
    // Parse as integer
    const parsed = parseInt(strValue, 10);
    if (isNaN(parsed) || parsed <= 0) {
      console.log(`${fieldName} parsed value is invalid:`, parsed, 'from:', strValue);
      return null;
    }
    
    console.log(`${fieldName} successfully parsed:`, value, '->', strValue, '->', parsed);
    return parsed;
  };

  // =========================
  // 🔹 Helper function to parse Course ID (can be string like "CRS-DEV-001" or number)
  // =========================
  const parseCourseId = (value) => {
    if (value === null || value === undefined || value === '') {
      console.log('Course is null/undefined/empty:', value);
      return null;
    }
    
    // Handle object case
    if (typeof value === 'object' && value !== null) {
      const courseId = value.course_id || value.id || value._id;
      if (courseId) {
        return parseCourseId(courseId);
      }
      console.log('Course is object but no ID found:', value);
      return null;
    }
    
    const strValue = String(value).trim();
    if (strValue === '' || strValue === 'null' || strValue === 'undefined') {
      console.log('Course string value is empty or invalid:', strValue);
      return null;
    }
    
    // Try to parse as number first
    const parsed = parseInt(strValue, 10);
    if (!isNaN(parsed) && parsed > 0) {
      console.log('Course successfully parsed as number:', value, '->', parsed);
      return parsed;
    }
    
    // If not a number, check if it's a valid string ID (like "CRS-DEV-001" or "CRS-.NE-001")
    // Allow alphanumeric strings with hyphens/underscores/dots
    if (/^[A-Za-z0-9._-]+$/.test(strValue) && strValue.length > 0) {
      console.log('Course successfully parsed as string ID:', value, '->', strValue);
      return strValue;
    }
    
    console.log('Course value is invalid (not a number or valid string ID):', strValue);
    return null;
  };

  // =========================
  // 🔹 Helper to normalize training status values for API (handles enum constraints)
  // =========================
  const normalizeTrainingStatusForApi = (value) => {
    if (value === null || value === undefined) return null;

    const raw = String(value).trim().toLowerCase();
    if (!raw) return null;

    const mapping = {
      nottaken: "nottaken",
      "not_taken": "nottaken",
      "not taken": "nottaken",
      scheduled: "scheduled",
      inprogress: "in_progress",
      "in_progress": "in_progress",
      "in progress": "in_progress",
      "in-progress": "in_progress",
      onhold: "onhold",
      "on_hold": "onhold",
      "on hold": "onhold",
      "on-hold": "onhold",
      completed: "completed",
    };

    const normalized = mapping[raw] || raw;
    console.log('normalizeTrainingStatusForApi:', value, '->', normalized);
    return normalized;
  };

  // =========================
  // 🔹 Form Submission
  // =========================
  const handleSubmit = async () => {
    // Validate ALL steps before submission, not just the current step
    const allErrors = {};
    for (let step = 0; step < STEPS.length; step++) {
      const stepErrors = validateStep(step);
      Object.assign(allErrors, stepErrors);
    }
    
    if (Object.keys(allErrors).length > 0) {
      setFieldErrors((prev) => ({ ...prev, ...allErrors }));
      const alertContent = buildAlertContent(allErrors);
      
      Swal.fire({
        icon: "error",
        title: alertContent.title || "Validation Error",
        ...(alertContent.text
          ? { text: alertContent.text }
          : { html: alertContent.html }),
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      return;
    }

    const finalCountryCode =
      countryCode === "manual" ? manualCountryCode : countryCode;
    const normalizedMobileNumber = stripMobile(mobileNumber);
    const parsedCourseIdForDuplicateCheck = parseCourseId(course);
    let allowDuplicate = false;

    try {
      const duplicateCheck = await addLeadModalService.checkDuplicateLead({
        name: name.trim(),
        mobile_number: normalizedMobileNumber,
        course_id: parsedCourseIdForDuplicateCheck,
      });

      if (duplicateCheck?.isDuplicate) {
        if (duplicateCheck?.isExactCourseDuplicate) {
          await Swal.fire({
            icon: "error",
            title: "Error",
            text: "Lead already exists with the same details.",
            customClass: {
              popup: "swal-small",
              title: "swal-small-title",
              content: "swal-small-content",
            },
            width: "350px",
            padding: "1rem",
          });
          return;
        }

        const duplicateResult = await Swal.fire({
          icon: "warning",
          title: "Duplicate Lead Found",
          text: "A user already exists with the same name and mobile number. Do you want to create again?",
          showCancelButton: true,
          confirmButtonText: "Create Again",
          cancelButtonText: "Cancel",
          customClass: {
            popup: "swal-small",
            title: "swal-small-title",
            content: "swal-small-content",
          },
          width: "420px",
          padding: "1rem",
        });

        if (!duplicateResult.isConfirmed) {
          return;
        }

        allowDuplicate = true;
      }
    } catch (duplicateCheckError) {
      console.error("Duplicate check failed:", duplicateCheckError);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to validate duplicate lead. Please try again.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      return;
    }

    setLoading(true);

    // Debug: Log all state values before building payload
    console.log('=== Form State Values Before Payload ===');
    console.log('course:', course, 'type:', typeof course);
    console.log('unit:', unit, 'type:', typeof unit);
    console.log('cardType:', cardType, 'type:', typeof cardType, 'value:', cardType);
    console.log('cardTypes array:', cardTypes);
    console.log('assignee:', assignee, 'type:', typeof assignee);
    console.log('selectedBatchIds:', selectedBatchIds);
    console.log('courseType:', courseType, 'type:', typeof courseType);
    console.log('courseStructure:', courseStructure, 'type:', typeof courseStructure);
    
    // Additional validation check
    if (!cardType || cardType.toString().trim() === '') {
      console.error('❌ CardType is EMPTY at payload building time!');
      console.error('CardType state:', cardType);
      console.error('CardType toString:', cardType?.toString());
    } else {
      console.log('✅ CardType has value:', cardType);
    }

    // Parse required ID fields and validate they're not null
    // unit_id and card_type_id are UUIDs, not integers
    const parsedUnitId = parseUuidValue(unit, 'Unit');
    const parsedCardTypeId = parseUuidValue(cardType, 'CardType');
    const parsedCourseId = parseCourseId(course);

    // Validate required ID fields before building payload
    if (!parsedCourseId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid course.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }
    
    if (!parsedUnitId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid business unit.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }

    if (!parsedCardTypeId) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please select a valid card type.",
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
      setLoading(false);
      return;
    }
    
    // Parse optional UUID fields
    const parsedRoleId = role && role.toString().trim() !== "" ? parseUuidValue(role, 'Role') : null;
    const parsedSourceId = source && source.toString().trim() !== "" ? parseUuidValue(source, 'Source') : null;
    const parsedAssigneeId = assignee && assignee.toString().trim() !== "" ? parseUuidValue(assignee, 'Assignee') : null;

    const payload = {
      name,
      country_code: finalCountryCode,
      mobile_number: normalizedMobileNumber,
      email: email || null,
      role_id: parsedRoleId,
      college_company: college || null,
      location: location || null,
      source_id: parsedSourceId,
      referred_by: isReferralSource && referredBy ? referredBy : null,
      course_id: parsedCourseId,
      batch_ids: (() => {
        const ids = (Array.isArray(selectedBatchIds) ? selectedBatchIds : [])
          .map((x) => parseInt(String(x), 10))
          .filter((n) => !Number.isNaN(n));
        return [...new Set(ids)];
      })(),
      batch_id: (() => {
        const ids = (Array.isArray(selectedBatchIds) ? selectedBatchIds : [])
          .map((x) => parseInt(String(x), 10))
          .filter((n) => !Number.isNaN(n));
        const uniq = [...new Set(ids)];
        return uniq.length ? uniq[0] : null;
      })(),
      status,
      assignee_id: parsedAssigneeId,
      user_id: parsedAssigneeId, // user_id is the same as assignee_id
      unit_id: parsedUnitId,
      card_type_id: parsedCardTypeId,
      priority,
      course_structure: cardTypeVisibility.showPlacement && !cardTypeVisibility.showTraining 
        ? "N/A" 
        : courseStructure,
      meta_campaign_id: isMetaAdsSource && metaCampaignId && metaCampaignId.toString().trim() !== "" 
        ? parseInt(metaCampaignId, 10) || null 
        : null,
      allow_duplicate: allowDuplicate,
    };

    // Payment fields
    if (cardTypeVisibility.showTraining) {
      payload.actual_fee = actualFee && actualFee.trim() !== "" 
        ? parseFloat(actualFee) || null 
        : null;
      payload.discounted_fee = discountedFee && discountedFee.trim() !== "" 
        ? parseFloat(discountedFee) || null 
        : null;
      payload.paid_status = paidStatus || null;
    }

    if (cardTypeVisibility.showPlacement) {
      const placementActual =
        placementActualFee && placementActualFee.trim() !== ""
          ? parseFloat(placementActualFee) || null
          : null;
      const placementDiscounted =
        placementDiscountedFee && placementDiscountedFee.trim() !== ""
          ? parseFloat(placementDiscountedFee) || null
          : null;

      payload.placement_actual_fee = placementActual;
      payload.placement_fee = placementDiscounted ?? placementActual;
      payload.placement_paid = placementPaid && placementPaid.trim() !== "" 
        ? parseFloat(placementPaid) || null 
        : null;
      payload.placement_pending = placementPending && placementPending.trim() !== "" 
        ? parseFloat(placementPending) || null 
        : null;
      payload.placement_paid_status = placementPaidStatus || null;
      
      // Placement Details
      const parsedPlacementTrainer = placementTrainerId && placementTrainerId.toString().trim() !== "" 
        ? parseInt(placementTrainerId, 10) || null 
        : null;
      
      console.log('=== PLACEMENT TRAINER DEBUG (Frontend) ===');
      console.log('placementTrainerId state:', placementTrainerId);
      console.log('parsedPlacementTrainer:', parsedPlacementTrainer);
      console.log('placementStatus:', placementStatus);
      console.log('placementStartDate:', placementStartDate);
      console.log('placementEndDate:', placementEndDate);
      console.log('cardType:', cardType);
      console.log('cardTypeVisibility.showPlacement:', cardTypeVisibility.showPlacement);
      console.log('==========================================');
      
      payload.placement_trainer = parsedPlacementTrainer;
      payload.placement_status = placementStatus || null;
      payload.placement_start_date = placementStartDate || null;
      payload.placement_end_date = placementEndDate || null;
    }

    // Single course trainer fields
    if (courseStructure === "single") {
      payload.trainer_id = trainerIdSingle && trainerIdSingle.toString().trim() !== "" 
        ? parseInt(trainerIdSingle, 10) || null 
        : null;
      // Convert to numbers, default to 0 or null
      payload.trainer_share = trainerShare && trainerShare.trim() !== "" 
        ? parseFloat(trainerShare) || 0 
        : 0;
      payload.trainer_share_amount = trainerShareAmount && trainerShareAmount.trim() !== "" 
        ? parseFloat(trainerShareAmount) || 0 
        : 0;
      payload.amount_paid_trainer = amountPaidTrainer && amountPaidTrainer.trim() !== "" 
        ? parseFloat(amountPaidTrainer) || 0 
        : 0;
      payload.pending_amount = pendingAmount && pendingAmount.trim() !== "" 
        ? parseFloat(pendingAmount) || 0 
        : 0;
      payload.training_status = normalizeTrainingStatusForApi(trainingStatusSingle);
      payload.training_start_date = trainingStartDateSingle || null;
      payload.training_end_date = trainingEndDateSingle || null;
      payload.trainer_paid = trainerPaidSingle || false;
    }

    // Sub-courses
    if (courseStructure === "multiple" && subCourseList.length > 0) {
      payload.sub_courses = subCourseList
        .filter((sc) => sc.sub_course_id && sc.trainer_id)
        .map((sc) => ({
          sub_course_id: sc.sub_course_id && sc.sub_course_id.toString().trim() !== "" 
            ? parseInt(sc.sub_course_id, 10) || null 
            : null,
          trainer_id: sc.trainer_id && sc.trainer_id.toString().trim() !== "" 
            ? parseInt(sc.trainer_id, 10) || null 
            : null,
          trainer_share: sc.trainer_share && sc.trainer_share.toString().trim() !== "" 
            ? parseFloat(sc.trainer_share) || 0 
            : 0,
          trainer_share_amount: sc.trainer_share_amount && sc.trainer_share_amount.toString().trim() !== "" 
            ? parseFloat(sc.trainer_share_amount) || 0 
            : 0,
          amount_paid_to_trainer: sc.amount_paid_to_trainer && sc.amount_paid_to_trainer.toString().trim() !== "" 
            ? parseFloat(sc.amount_paid_to_trainer) || 0 
            : 0,
          pending_amount: sc.pending_amount && sc.pending_amount.toString().trim() !== "" 
            ? parseFloat(sc.pending_amount) || 0 
            : 0,
          training_status: normalizeTrainingStatusForApi(sc.training_status) || "nottaken",
          training_start_date: sc.training_start_date || null,
          training_end_date: sc.training_end_date || null,
          trainer_paid: sc.trainer_paid || false,
        }));
    }

    try {
      // Log payload for debugging
      // Add placement data if applicable
      if (cardTypeVisibility.showPlacement) {
        payload.placement_trainer_id = placementTrainerId && placementTrainerId.toString().trim() !== ""
          ? parseInt(placementTrainerId, 10) || null
          : null;
        payload.placement_status = placementStatus || null;
        payload.placement_start_date = placementStartDate || null;
        payload.placement_end_date = placementEndDate || null;
      }

      console.log("Submitting payload:", payload);
      console.log("Required fields check:", {
        course_id: payload.course_id,
        unit_id: payload.unit_id,
        card_type_id: payload.card_type_id,
        name: payload.name,
        mobile_number: payload.mobile_number,
        status: payload.status
      });
      
      const result = await addLeadModalService.createLead(payload);
      if (result?.success || result?.id || result?.lead_id) {
        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Lead added successfully!",
          timer: 1500,
          showConfirmButton: false,
          customClass: {
            popup: "swal-small",
            title: "swal-small-title",
            content: "swal-small-content",
          },
          width: "350px",
          padding: "1rem",
        });
        onSaved?.();
        onClose?.();
        // Reset form
        resetForm();
    } else {
      Swal.fire({
        icon: "error",
          title: "Error",
          text: result?.error || "Failed to add lead.",
          customClass: {
            popup: "swal-small",
            title: "swal-small-title",
            content: "swal-small-content",
          },
          width: "350px",
          padding: "1rem",
        });
      }
    } catch (error) {
      console.error("Error creating lead:", error);
      const errorMessage = error?.response?.data?.error || error?.message || "Failed to add lead. Please check the console for details.";
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        customClass: {
          popup: "swal-small",
          title: "swal-small-title",
          content: "swal-small-content",
        },
        width: "350px",
        padding: "1rem",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep(0);
    setName("");
    setMobileNumber("");
    setCountryCode("+91");
    setManualCountryCode("");
    setEmail("");
    setRole("");
    setCollege("");
    setLocation("");
    setSource("");
    setReferredBy("");
    setStatus("enquiry");
    setPriority("normal");
    setMetaCampaignId("");
    setCourseType("");
    setCourse("");
    setSelectedBatchIds([]);
    setAssignee("");
    setUnit("");
    setCardType("");
    setCourseStructure("");
    setActualFee("");
    setDiscountedFee("");
    setPaidStatus("");
    setPlacementActualFee("");
    setPlacementDiscountedFee("");
    setPlacementPaid("");
    setPlacementPending("");
    setPlacementPaidStatus("");
    setTrainerIdSingle("");
    setTrainerShare("");
    setTrainerShareAmount("");
    setAmountPaidTrainer("");
    setPendingAmount("");
    setTrainingStatusSingle("nottaken");
    setTrainingStartDateSingle("");
    setTrainingEndDateSingle("");
    setTrainerPaidSingle(false);
    
    // Reset Placement Info
    setPlacementTrainerId("");
    setPlacementStatus("");
    setPlacementStartDate("");
    setPlacementEndDate("");
    setTrainingPlacementTab("training");

    setSubCourseList([]);
    setFieldErrors({});
    // Reset collapsible sections
    setFeeSectionOpen(false);
    setPlacementFeeSectionOpen(true);
  };

  // =========================
  // 🔹 Close on ESC
  // =========================
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  // =========================
  // 🔹 Reset form when modal opens
  // =========================
  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black bg-opacity-60 py-8">
      <div className="bg-white rounded-lg shadow-2xl w-[75vw] max-w-3xl max-h-[92vh] overflow-y-auto my-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10 shadow-sm">
          <h2 className="text-base font-semibold text-gray-800">Lead Registration Form</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            {STEPS.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                      idx <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span
                    className={`ml-1.5 text-xs font-medium ${
                      idx <= currentStep ? "text-blue-600" : "text-gray-500"
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
        <div className="px-6 py-5">
          {/* Step 1: Basic Info */}
          {currentStep === 0 && (
            <Suspense fallback={<div className="text-xs text-gray-500">Loading step...</div>}>
              <AddLeadBasicInfoStep
                name={name}
                setName={setName}
                clearFieldError={clearFieldError}
                getInputClasses={getInputClasses}
                fieldErrors={fieldErrors}
                countryCode={countryCode}
                setCountryCode={setCountryCode}
                manualCountryCode={manualCountryCode}
                setManualCountryCode={setManualCountryCode}
                mobileNumber={mobileNumber}
                setMobileNumber={setMobileNumber}
                email={email}
                setEmail={setEmail}
                roles={roles}
                role={role}
                setRole={setRole}
                college={college}
                setCollege={setCollege}
                location={location}
                setLocation={setLocation}
                sources={sources}
                source={source}
                setSource={setSource}
                setReferredBy={setReferredBy}
                setMetaCampaignId={setMetaCampaignId}
                status={status}
                setStatus={setStatus}
                isReferralSource={isReferralSource}
                referredBy={referredBy}
                isMetaAdsSource={isMetaAdsSource}
                metaCampaigns={metaCampaigns}
                metaCampaignId={metaCampaignId}
                priority={priority}
                setPriority={setPriority}
              />
            </Suspense>
          )}

          {/* Step 2: Course Info */}
          {currentStep === 1 && (
            <Suspense fallback={<div className="text-xs text-gray-500">Loading step...</div>}>
              <AddLeadCourseInfoStep
                assignees={assignees}
                assignee={assignee}
                setAssignee={setAssignee}
                clearFieldError={clearFieldError}
                fieldErrors={fieldErrors}
                units={units}
                unit={unit}
                setUnit={setUnit}
                cardTypes={cardTypes}
                cardType={cardType}
                setCardType={setCardType}
                courseTypes={courseTypes}
                courseType={courseType}
                setCourseType={setCourseType}
                setCourse={setCourse}
                filteredCourses={filteredCourses}
                course={course}
                batches={batches}
                selectedBatchIds={selectedBatchIds}
                setSelectedBatchIds={setSelectedBatchIds}
                cardTypeIds={cardTypeIds}
                courseStructure={courseStructure}
                setCourseStructure={setCourseStructure}
                setSubCourseList={setSubCourseList}
              />
            </Suspense>
          )}

          {/* Step 3: Payment Info */}
          {currentStep === 2 && (
            <Suspense fallback={<div className="text-xs text-gray-500">Loading step...</div>}>
              <AddLeadPaymentInfoStep
                cardTypeVisibility={cardTypeVisibility}
                feeSectionOpen={feeSectionOpen}
                setFeeSectionOpen={setFeeSectionOpen}
                actualFee={actualFee}
                setActualFee={setActualFee}
                discountedFee={discountedFee}
                setDiscountedFee={setDiscountedFee}
                placementFeeSectionOpen={placementFeeSectionOpen}
                setPlacementFeeSectionOpen={setPlacementFeeSectionOpen}
                placementActualFee={placementActualFee}
                setPlacementActualFee={setPlacementActualFee}
                placementDiscountedFee={placementDiscountedFee}
                setPlacementDiscountedFee={setPlacementDiscountedFee}
              />
            </Suspense>
          )}

          {/* Step 4: Training & Placement */}
          {currentStep === 3 && (
            <Suspense fallback={<div className="text-xs text-gray-500">Loading step...</div>}>
              <AddLeadTrainingPlacementStep
                cardType={cardType}
                cardTypeIds={cardTypeIds}
                trainingPlacementTab={trainingPlacementTab}
                setTrainingPlacementTab={setTrainingPlacementTab}
                cardTypeVisibility={cardTypeVisibility}
                courseStructure={courseStructure}
                trainers={trainers}
                fieldErrors={fieldErrors}
                clearFieldError={clearFieldError}
                setTrainerIdSingle={setTrainerIdSingle}
                trainerIdSingle={trainerIdSingle}
                trainingStatusSingle={trainingStatusSingle}
                setTrainingStatusSingle={setTrainingStatusSingle}
                trainingStartDateSingle={trainingStartDateSingle}
                setTrainingStartDateSingle={setTrainingStartDateSingle}
                trainingEndDateSingle={trainingEndDateSingle}
                setTrainingEndDateSingle={setTrainingEndDateSingle}
                trainerShare={trainerShare}
                setTrainerShare={setTrainerShare}
                getInputClasses={getInputClasses}
                trainerShareAmount={trainerShareAmount}
                amountPaidTrainer={amountPaidTrainer}
                pendingAmount={pendingAmount}
                trainerPaidSingle={trainerPaidSingle}
                setTrainerPaidSingle={setTrainerPaidSingle}
                handleAddSubCourse={handleAddSubCourse}
                subCourseList={subCourseList}
                handleRemoveSubCourse={handleRemoveSubCourse}
                subCourses={subCourses}
                handleSubCourseChange={handleSubCourseChange}
                TRAINING_STATUS_OPTIONS={TRAINING_STATUS_OPTIONS}
                placementTrainerId={placementTrainerId}
                setPlacementTrainerId={setPlacementTrainerId}
                PLACEMENT_STATUS_OPTIONS={PLACEMENT_STATUS_OPTIONS}
                placementStatus={placementStatus}
                setPlacementStatus={setPlacementStatus}
                placementStartDate={placementStartDate}
                setPlacementStartDate={setPlacementStartDate}
                placementEndDate={placementEndDate}
                setPlacementEndDate={setPlacementEndDate}
              />
            </Suspense>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-end mt-6 pt-4 border-t">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-5 py-2 bg-gray-100 text-gray-700 rounded-md text-xs font-medium hover:bg-gray-200 mr-3 transition-colors"
              >
                Previous
              </button>
            )}
            {currentStep < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-xs">⏳</span>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span className="text-xs">✓</span>
                    <span>Create Lead</span>
                  </>
                )}
              </button>
            )}
          </div>
          </div>
      </div>
    </div>
  );
};

export default AddLeadModal;
