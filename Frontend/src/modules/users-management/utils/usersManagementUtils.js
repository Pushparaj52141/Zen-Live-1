export function hasValidProfileImage(profileImage) {
  return (
    profileImage &&
    typeof profileImage === "string" &&
    profileImage.trim() !== "" &&
    profileImage !== "null" &&
    profileImage !== "undefined"
  );
}

export function normalizeUsers(usersArray) {
  return usersArray.map((user) => ({
    ...user,
    profile_image: hasValidProfileImage(user.profile_image)
      ? user.profile_image
      : null,
  }));
}

export function ensureUserImageNormalized(normalizedUsers, userId) {
  const userIndex = normalizedUsers.findIndex((u) => u.id === userId);
  if (userIndex === -1) return normalizedUsers;

  if (!hasValidProfileImage(normalizedUsers[userIndex].profile_image)) {
    const updated = [...normalizedUsers];
    updated[userIndex] = {
      ...updated[userIndex],
      profile_image: null,
    };
    return updated;
  }

  return normalizedUsers;
}

export function buildUpdateUserPayload(editData, removeImage) {
  if (editData.profile_image || removeImage) {
    const formData = new FormData();
    formData.append("username", editData.username.trim());
    formData.append("email", editData.email.trim());
    formData.append("mobile", editData.mobile.trim());
    formData.append("role_id", editData.role_id);
    formData.append("unit_id", editData.unit_id);
    if (editData.password && editData.password.trim()) {
      formData.append("password", editData.password.trim());
    }
    if (removeImage) {
      formData.append("remove_image", "true");
    } else if (editData.profile_image) {
      formData.append("profile_image", editData.profile_image);
    }
    return formData;
  }

  return {
    username: editData.username.trim(),
    email: editData.email.trim(),
    mobile: editData.mobile.trim(),
    role_id: editData.role_id,
    unit_id: editData.unit_id,
    ...(editData.password && editData.password.trim()
      ? { password: editData.password.trim() }
      : {}),
  };
}
