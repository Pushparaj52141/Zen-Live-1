function startOfLocalDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Local midnight at the start of tomorrow (relative to “now”). */
function startOfTomorrow() {
  const x = new Date();
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + 1);
  return x;
}

/**
 * @returns {'overdue'|'due_today'|'due_tomorrow'|'scheduled'|null}
 * - Red border (overdue | due_today): past due, or due today after follow_up_at time.
 * - Yellow border (due_tomorrow): follow-up calendar day is tomorrow (still in the future).
 * With follow_up_at: after the instant passes, same calendar day → due_today; earlier days → overdue.
 * Legacy follow_up_date: compare calendar days only.
 */
export function getFollowUpStatus(lead) {
  const now = new Date();

  if (lead?.follow_up_at) {
    const t = new Date(lead.follow_up_at);
    if (Number.isNaN(t.getTime())) return null;
    if (now < t) {
      const tDay = startOfLocalDay(t);
      if (tDay.getTime() === startOfTomorrow().getTime()) return "due_tomorrow";
      return "scheduled";
    }
    const nowDay = startOfLocalDay(now);
    const tDay = startOfLocalDay(t);
    if (nowDay.getTime() === tDay.getTime()) return "due_today";
    return "overdue";
  }

  if (!lead?.follow_up_date) return null;
  const raw = lead.follow_up_date;
  const d =
    typeof raw === "string"
      ? new Date(raw.slice(0, 10) + "T12:00:00")
      : new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const fd = new Date(d);
  fd.setHours(0, 0, 0, 0);
  const tomorrow = startOfTomorrow();
  if (fd.getTime() < today.getTime()) return "overdue";
  if (fd.getTime() === today.getTime()) return "due_today";
  if (fd.getTime() === tomorrow.getTime()) return "due_tomorrow";
  return "scheduled";
}

/** True when follow-up time has passed (or legacy: due that day). */
export function isFollowUpDue(lead) {
  const s = getFollowUpStatus(lead);
  return s === "overdue" || s === "due_today";
}

export function countDueFollowUps(columns) {
  let n = 0;
  for (const col of columns || []) {
    for (const lead of col.leads || []) {
      if (isFollowUpDue(lead)) n += 1;
    }
  }
  return n;
}

/** One-line label for table tooltips / exports. */
export function formatFollowUpLine(lead) {
  if (lead?.follow_up_at) {
    const t = new Date(lead.follow_up_at);
    if (Number.isNaN(t.getTime())) return null;
    return `Follow-up: ${t.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    })}`;
  }
  if (lead?.follow_up_date) {
    const raw = lead.follow_up_date;
    const day =
      typeof raw === "string" ? raw.slice(0, 10) : String(raw).slice(0, 10);
    return `Follow-up: ${day} (date only)`;
  }
  return null;
}

/** Native tooltip text for the card wrapper (no in-card copy). */
export function getFollowUpTitle(lead) {
  const st = getFollowUpStatus(lead);
  let when = "";
  if (lead?.follow_up_at) {
    const t = new Date(lead.follow_up_at);
    if (!Number.isNaN(t.getTime())) {
      when = t.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    }
  } else if (lead?.follow_up_date) {
    const raw = lead.follow_up_date;
    when =
      typeof raw === "string" ? raw.slice(0, 10) : String(raw).slice(0, 10);
  }
  if (!when) return null;
  if (st === "overdue") return `Follow-up overdue · ${when}`;
  if (st === "due_today") return `Follow-up due today · ${when}`;
  if (st === "due_tomorrow") return `Follow-up tomorrow · ${when}`;
  if (st === "scheduled") return `Follow-up scheduled · ${when}`;
  return `Follow-up · ${when}`;
}

export function hasFollowUpReminder(lead) {
  return Boolean(lead?.follow_up_at || lead?.follow_up_date);
}
