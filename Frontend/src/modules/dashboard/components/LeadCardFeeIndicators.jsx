import React from "react";

const StatusCircleOutline = React.memo(function StatusCircleOutline({ color, title }) {
  return (
    <span
      className="ml-[2px]  pr-1  inline-flex cursor-pointer items-center"
      title={title}
      aria-label={title}
    >
      <svg className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9" fill="none" stroke={color} strokeWidth={3} />
      </svg>
    </span>
  );
});

const StatusCircleFilled = React.memo(function StatusCircleFilled({ color, title }) {
  return (
    <span
      className="mr-[1px]  inline-flex cursor-pointer items-center"
      title={title}
      aria-label={title}
    >
      <svg className="h-3.5 w-3.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r="9" fill={color} stroke="none" />
      </svg>
    </span>
  );
});

export function LeadCardFeeIndicators({
  cardType,
  paidStatus,
  placementPaidStatus,
  paidStatusColor,
  placementStatusColor,
}) {
  const showTrainingDot =
    (cardType === "trainingonly" || cardType === "training&placement") &&
    !!String(paidStatus || "").trim();
  const showPlacementDot =
    (cardType === "placementonly" || cardType === "training&placement") &&
    !!String(placementPaidStatus || "").trim();

  return (
    <div className="absolute right-12 top-[13px] z-20 flex items-center gap-[3px]">
      {showTrainingDot && (
        <StatusCircleFilled
          color={paidStatusColor}
          title={`Training Fee Status: ${paidStatus}`}
        />
      )}
      {showPlacementDot && (
        <StatusCircleOutline
          color={placementStatusColor}
          title={`Placement Fee Status: ${placementPaidStatus}`}
        />
      )}
    </div>
  );
}
