import { API_BASE_URL } from "@shared/api/client";

export function getInitials(name) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part?.[0]?.toUpperCase())
    .join("")
    .slice(0, 2);
}

export function getProfileImageSrc(profileImage) {
  if (!profileImage) return null;
  if (profileImage.startsWith("data:") || profileImage.startsWith("http")) {
    return profileImage;
  }
  if (profileImage.startsWith("uploads/") || profileImage.startsWith("/uploads/")) {
    return `${API_BASE_URL}/${
      profileImage.startsWith("/") ? profileImage.slice(1) : profileImage
    }`;
  }
  return `data:image/png;base64,${profileImage}`;
}

