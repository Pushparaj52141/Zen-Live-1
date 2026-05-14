import React, { useCallback, useMemo, useState } from "react";
import { API_BASE_URL } from "@shared/api/client";
import { LeadCardFeeIndicators } from "./LeadCardFeeIndicators";
import { LeadCardFooter } from "./LeadCardFooter";
import { LeadCardHotBadge } from "./LeadCardHotBadge";
import { LeadCardFollowUpCue } from "./LeadCardFollowUpCue";
import { LeadCardMainInfo } from "./LeadCardMainInfo";
import { LeadCardTimePill } from "./LeadCardTimePill";
import {
  getStatusColor,
  getTimeDifference,
  getUnitLogo,
} from "../utils/dashboardLeadCardUtils";
import { sanitizeLeadDisplayText } from "@shared/utils/sanitizeLeadDisplayText";
import {
  getFollowUpStatus,
  getFollowUpTitle,
  hasFollowUpReminder,
} from "../utils/followUpUtils";

const DashboardLeadCard = React.memo(
  function DashboardLeadCard({ lead, onClick, isColumnHovered }) {
    const timeDiff = useMemo(
      () => getTimeDifference(lead.created_at),
      [lead.created_at]
    );
    const paidStatusColor = useMemo(
      () => getStatusColor(lead.paid_status),
      [lead.paid_status]
    );
    const placementPaidStatus = useMemo(
      () => (lead.placement_paid_status || "").trim().toLowerCase(),
      [lead.placement_paid_status]
    );
    const placementStatusColor = useMemo(
      () => getStatusColor(placementPaidStatus),
      [placementPaidStatus]
    );
    const cardType = useMemo(
      () => (lead.card_type_name || "").toLowerCase().replace(/\s+/g, ""),
      [lead.card_type_name]
    );
    const normalizedStatus = useMemo(
      () => String(lead.status || "").trim().toLowerCase(),
      [lead.status]
    );
    const placementCardClass = useMemo(() => {
      if (normalizedStatus === "placement") {
        return "ring-1 ring-inset ring-emerald-200/90 bg-emerald-50/35";
      }
      if (normalizedStatus === "placementdue") {
        return "ring-1 ring-inset ring-amber-300/90 bg-amber-50/45";
      }
      if (normalizedStatus === "placementpaid") {
        return "ring-1 ring-inset ring-teal-200/90 bg-teal-50/45";
      }
      return "";
    }, [normalizedStatus]);

    const isMetaLead = String(lead.lead_id).startsWith("meta_");
    const formattedName = useMemo(
      () => sanitizeLeadDisplayText(lead.name),
      [lead.name]
    );
    const unitLogo = useMemo(() => getUnitLogo(lead.unit_name), [lead.unit_name]);
    const assigneeName = useMemo(
      () => lead.assignee_name || "No Assignee",
      [lead.assignee_name]
    );

    const assigneeProfileImage = useMemo(() => {
      if (!lead.user_id) return null;
      return `${API_BASE_URL}/api/users/image/${lead.user_id}`;
    }, [lead.user_id]);

    const timeSpanClass = useMemo(
      () =>
        timeDiff.isOverADay && (lead.status || "").toLowerCase() === "enquiry"
          ? "bg-red-500"
          : isMetaLead
            ? "bg-indigo-600"
            : "bg-green-500",
      [timeDiff.isOverADay, lead.status, isMetaLead]
    );

    const [isHovered, setIsHovered] = useState(false);
    const blackLineOpacity = useMemo(
      () => (!isHovered && !isColumnHovered ? 1 : 0),
      [isHovered, isColumnHovered]
    );

    const handleClick = useCallback(() => {
      onClick && onClick(lead);
    }, [onClick, lead]);

    const handleMouseEnter = useCallback(() => setIsHovered(true), []);
    const handleMouseLeave = useCallback(() => setIsHovered(false), []);
    const accentOpacityClass = blackLineOpacity === 1 ? "opacity-100" : "opacity-0";
    const isHotLead = lead.priority === "hot";
    const followUpStatus = getFollowUpStatus(lead);
    const showFollowUpPin = hasFollowUpReminder(lead);
    const followUpTitle = getFollowUpTitle(lead);

    /** Red: overdue or due today. Yellow: follow-up is tomorrow (one day away). */
    const cardShellClass = useMemo(() => {
      if (
        showFollowUpPin &&
        (followUpStatus === "overdue" || followUpStatus === "due_today")
      ) {
        return "border-2 border-red-500 bg-white";
      }
      if (showFollowUpPin && followUpStatus === "due_tomorrow") {
        return "border-2 border-yellow-400 bg-white";
      }
      return isMetaLead
        ? "border border-indigo-200 bg-white shadow-indigo-50"
        : "border border-gray-200 bg-white";
    }, [showFollowUpPin, followUpStatus, isMetaLead]);

    const cardTitle = [
      formattedName,
      followUpTitle,
      showFollowUpPin && assigneeName && assigneeName !== "No Assignee"
        ? `Assignee: ${assigneeName}`
        : null,
    ]
      .filter(Boolean)
      .join(" — ");

    return (
      <div
        className={`lead-card relative flex h-[140px] min-h-[140px] w-[220px] min-w-[220px] max-w-[220px] cursor-pointer select-none flex-col justify-between overflow-hidden rounded-lg p-3 shadow-sm transition hover:shadow-md ${cardShellClass} ${placementCardClass}`}
        data-lead-id={lead.lead_id}
        title={cardTitle}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {showFollowUpPin ? (
          <LeadCardFollowUpCue status={followUpStatus ?? "scheduled"} />
        ) : null}
        {isHotLead && <LeadCardHotBadge />}
        <LeadCardFeeIndicators
          cardType={cardType}
          paidStatus={lead.paid_status}
          placementPaidStatus={lead.placement_paid_status}
          paidStatusColor={paidStatusColor}
          placementStatusColor={placementStatusColor}
        />
        <LeadCardTimePill
          timeSpanClass={timeSpanClass}
          isMetaLead={isMetaLead}
          timeText={timeDiff.text}
        />
        <LeadCardMainInfo
          lead={lead}
          formattedName={formattedName}
          isMetaLead={isMetaLead}
        />
        <LeadCardFooter
          isMetaLead={isMetaLead}
          unitLogo={unitLogo}
          assigneeName={assigneeName}
          assigneeProfileImage={assigneeProfileImage}
          hideAssigneePhoto={showFollowUpPin}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-0.5 rounded-r-lg bg-[#111] transition-opacity ${accentOpacityClass}`}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.lead.lead_id === nextProps.lead.lead_id &&
      prevProps.lead.status === nextProps.lead.status &&
      prevProps.lead.priority === nextProps.lead.priority &&
      prevProps.lead.name === nextProps.lead.name &&
      prevProps.lead.paid_status === nextProps.lead.paid_status &&
      prevProps.lead.placement_paid_status === nextProps.lead.placement_paid_status &&
      prevProps.lead.created_at === nextProps.lead.created_at &&
      prevProps.lead.follow_up_date === nextProps.lead.follow_up_date &&
      prevProps.lead.follow_up_at === nextProps.lead.follow_up_at &&
      prevProps.lead.assignee_name === nextProps.lead.assignee_name &&
      prevProps.lead.user_id === nextProps.lead.user_id &&
      prevProps.isColumnHovered === nextProps.isColumnHovered &&
      prevProps.onClick === nextProps.onClick
    );
  }
);

export default DashboardLeadCard;
