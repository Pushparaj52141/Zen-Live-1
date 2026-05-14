import { useMemo } from "react";
import { useSelector } from "react-redux";
import { getProfileImageSrc } from "../utils/profileUtils";

export function useProfileUser() {
  const user = useSelector((state) => state.auth.user) || {};

  return useMemo(() => {
    const username = user.username || user.name || "User";
    const profileImage = user.profile_image || null;
    const imageSrc = getProfileImageSrc(profileImage);
    return { user, username, profileImage, imageSrc };
  }, [user]);
}

