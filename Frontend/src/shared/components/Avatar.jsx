import React, { useMemo, useState, useEffect } from 'react';
import apiClient from '../api/client';

// Simple in-memory cache for avatar images to prevent redundant fetches
const avatarCache = new Map();

/**
 * Avatar Component - Displays user profile image or initials
 * @param {Object} props
 * @param {string} props.profileImage - Base64 encoded image string from backend (optional)
 * @param {string} props.userId - User ID to fetch image if profileImage is missing (optional)
 * @param {string} props.name - User name for initials fallback
 * @param {string} props.size - Size class (default: 'h-7 w-7')
 * @param {string} props.bgColor - Background color for initials (default: '#444')
 * @param {string} props.textColor - Text color for initials (default: 'text-white')
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.title - Tooltip text
 */
const Avatar = React.memo(function Avatar({
  profileImage,
  userId,
  name = '',
  size = 'h-7 w-7',
  bgColor = 'bg-[#444]',
  textColor = 'text-white',
  className = '',
  title,
  ...props
}) {
  const [fetchedImage, setFetchedImage] = useState(null);

  // Get initials from name
  const initials = useMemo(() => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((w) => w[0]?.toUpperCase())
      .join('')
      .slice(0, 2);
  }, [name]);

  // Fetch image if userId is provided and no profileImage is passed
  useEffect(() => {
    if (profileImage) return;
    if (!userId) return;

    // Check cache first
    if (avatarCache.has(userId)) {
      const cached = avatarCache.get(userId);
      if (cached !== 'error') {
        setFetchedImage(cached);
      }
      return;
    }

    let isMounted = true;

    const fetchImage = async () => {
      try {
        const response = await apiClient.get(`/api/users/image/${userId}`, {
          responseType: 'blob',
        });
        
        if (response.data && response.data.size > 0) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (isMounted) {
              const base64data = reader.result;
              avatarCache.set(userId, base64data);
              setFetchedImage(base64data);
            }
          };
          reader.readAsDataURL(response.data);
        } else {
          avatarCache.set(userId, 'error');
        }
      } catch (error) {
        // console.error(`Failed to fetch avatar for user ${userId}`, error);
        avatarCache.set(userId, 'error');
      }
    };

    fetchImage();

    return () => {
      isMounted = false;
    };
  }, [userId, profileImage]);

  // Determine the final image source
  const imageSrc = useMemo(() => {
    if (profileImage) {
      // Check if it's already a data URL or just base64
      if (profileImage.startsWith('data:') || profileImage.startsWith('http')) {
        return profileImage;
      }
      return `data:image/png;base64,${profileImage}`;
    }
    return fetchedImage;
  }, [profileImage, fetchedImage]);

  const hasValidImage = !!imageSrc;
  const displayTitle = title || name || 'User';

  return (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full ${bgColor} ${textColor} text-xs font-semibold uppercase shadow-sm relative ${className}`}
      title={displayTitle}
      {...props}
    >
      {hasValidImage ? (
        <>
          <img
            src={imageSrc}
            alt={name || 'User'}
            loading="lazy"
            className="h-full w-full rounded-full object-cover absolute inset-0"
            onError={(e) => {
              // If image fails to load, hide image and show initials
              e.target.style.display = 'none';
              const parent = e.target.parentElement;
              if (parent) {
                const initialsSpan = parent.querySelector('.avatar-initials');
                if (initialsSpan) {
                  initialsSpan.style.display = 'flex';
                }
              }
            }}
          />
          <span className="avatar-initials hidden">{initials}</span>
        </>
      ) : (
        <span className="avatar-initials">{initials}</span>
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

export default Avatar;
