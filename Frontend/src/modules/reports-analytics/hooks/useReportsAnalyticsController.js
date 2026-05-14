import { useMemo } from "react";
import {
  REPORTS_ANALYTICS_EMPTY_MESSAGE,
  REPORTS_ANALYTICS_TITLE,
} from "../constants/reportsAnalyticsConstants";

export function useReportsAnalyticsController() {
  return useMemo(
    () => ({
      title: REPORTS_ANALYTICS_TITLE,
      message: REPORTS_ANALYTICS_EMPTY_MESSAGE,
    }),
    []
  );
}
