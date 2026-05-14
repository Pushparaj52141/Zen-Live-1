import React from "react";

/**
 * Cute penguin carrying a follow-up tag — pure SVG, no raster images.
 * Paint order: body → wings → head → tag on top.
 */
function FollowUpPenguinWithTag({ status }) {
  const overdue = status === "overdue";
  const dueNow = status === "due_today";
  const dueTmrw = status === "due_tomorrow";

  const tagBg = overdue ? "#ffe4e6" : dueNow ? "#fffbeb" : dueTmrw ? "#fef9c3" : "#fefce8";
  const tagStroke = overdue ? "#e11d48" : dueNow ? "#dc2626" : dueTmrw ? "#ca8a04" : "#ca8a04";
  const tagInk = overdue ? "#9f1239" : dueNow ? "#991b1b" : dueTmrw ? "#854d0e" : "#854d0e";
  const label = overdue ? "CALL!" : dueNow ? "DUE" : dueTmrw ? "TMRW" : "F·UP";

  const ink = "#0f172a";
  const belly = "#f8fafc";
  const accent = "#f97316";

  return (
    <svg
      viewBox="0 0 50 46"
      className="h-[46px] w-[50px] shrink-0 drop-shadow-md"
      aria-hidden
    >
      {/* Body & belly (back) */}
      <ellipse cx="25" cy="30" rx="13" ry="11" fill={ink} />
      <ellipse cx="25" cy="31" rx="8" ry="9" fill={belly} />

      {/* Left wing */}
      <g
        className="animate-[followup-wing-flap_0.75s_ease-in-out_infinite]"
        style={{ transformOrigin: "11px 25px", transformBox: "fill-box" }}
      >
        <ellipse cx="11" cy="25" rx="5" ry="8" fill={ink} transform="rotate(-34 11 25)" />
      </g>

      {/* Head */}
      <circle cx="25" cy="19" r="9.2" fill={ink} />
      <ellipse cx="25" cy="20" rx="6.5" ry="5.5" fill={belly} />

      {/* Eyes & beak */}
      <circle cx="21.5" cy="18" r="2.2" fill="white" />
      <circle cx="28.5" cy="18" r="2.2" fill="white" />
      <circle cx="22" cy="18.2" r="1.1" fill={ink} />
      <circle cx="29" cy="18.2" r="1.1" fill={ink} />
      <path d="M25 21.5 L21 24.5 L29 24.5 Z" fill={accent} />

      {/* Right wing */}
      <g
        className="animate-[followup-wing-flap-right_0.75s_ease-in-out_infinite]"
        style={{ transformOrigin: "39px 25px", transformBox: "fill-box" }}
      >
        <ellipse cx="39" cy="25" rx="5" ry="8" fill={ink} transform="rotate(34 39 25)" />
      </g>

      {/* Feet */}
      <ellipse cx="19" cy="39.5" rx="4.5" ry="2.8" fill={accent} />
      <ellipse cx="31" cy="39.5" rx="4.5" ry="2.8" fill={accent} />

      {/* Pole + tag (foreground) — pole from tag bottom to forehead */}
      <line
        x1="25"
        y1="13"
        x2="25"
        y2="18.5"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <rect
        x="3"
        y="0.5"
        width="44"
        height="12.5"
        rx="2.5"
        fill={tagBg}
        stroke={tagStroke}
        strokeWidth="1.2"
      />
      <text
        x="25"
        y="9.5"
        textAnchor="middle"
        fill={tagInk}
        fontSize="7.5"
        fontWeight="800"
        fontFamily="system-ui, Segoe UI, sans-serif"
        letterSpacing="0.02em"
      >
        {label}
      </text>
    </svg>
  );
}

/**
 * Follow-up cue: waddling penguin with tag (card border alone shows urgency — no bottom strip).
 * Placed left of the assignee circle; assignee photo hidden while cue shows (initials stay).
 */
export function LeadCardFollowUpCue({ status }) {
  const overdue = status === "overdue";
  const dueNow = status === "due_today";
  const dueTmrw = status === "due_tomorrow";
  const urgent = overdue || dueNow;

  const waddleClass = urgent
    ? "animate-[followup-mascot-waddle_0.85s_ease-in-out_infinite]"
    : dueTmrw
      ? "animate-[followup-mascot-waddle-soft_1.4s_ease-in-out_infinite]"
      : "animate-[followup-mascot-waddle-soft_2.2s_ease-in-out_infinite]";

  const ariaLabel = overdue
    ? "Follow-up overdue — call now"
    : dueNow
      ? "Follow-up due today"
      : dueTmrw
        ? "Follow-up tomorrow"
        : "Follow-up scheduled";

  return (
    <div
      className="pointer-events-none absolute bottom-[2px] right-[36px] z-[14] flex flex-col items-end"
      role="img"
      aria-label={ariaLabel}
    >
      <div className={waddleClass} aria-hidden>
        <FollowUpPenguinWithTag status={status} />
      </div>
    </div>
  );
}
