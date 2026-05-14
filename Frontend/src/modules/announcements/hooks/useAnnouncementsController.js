import { useMemo } from "react";
import {
  ANNOUNCEMENTS_EMPTY_MESSAGE,
  ANNOUNCEMENTS_TITLE,
} from "../constants/announcementsConstants";

export function useAnnouncementsController() {
  return useMemo(
    () => ({
      title: ANNOUNCEMENTS_TITLE,
      message: ANNOUNCEMENTS_EMPTY_MESSAGE,
    }),
    []
  );
}
