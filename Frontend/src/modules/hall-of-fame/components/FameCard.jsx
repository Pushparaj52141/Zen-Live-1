import React from "react";
import { MdEmojiEvents, MdWork, MdStar, MdMilitaryTech } from "react-icons/md";
import Avatar from "@shared/components/Avatar";

function FameInitialsAvatar({ name, type }) {
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  return (
    <div className={`fame-initials-avatar ${type}`}>
      <span className="initial-text">{initials}</span>
      <div className="initials-shine"></div>
      <div className="initials-glow"></div>
    </div>
  );
}

export default function FameCard({ name, title, detail, type, image, userId, index }) {
  const getBadgeColor = () => {
    switch (type) {
      case "placement":
        return "linear-gradient(135deg, #10b981 0%, #059669 100%)";
      case "topper":
        return "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)";
      case "employee":
        return "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)";
      default:
        return "linear-gradient(135deg, #64748b 0%, #475569 100%)";
    }
  };

  const getIcon = () => {
    switch (type) {
      case "placement":
        return <MdWork />;
      case "topper":
        return <MdEmojiEvents />;
      case "employee":
        return <MdStar />;
      default:
        return <MdMilitaryTech />;
    }
  };

  const getEmoji = () => {
    switch (type) {
      case "placement":
        return "💼";
      case "topper":
        return "🏆";
      case "employee":
        return "⭐";
      default:
        return "✨";
    }
  };

  const isStudent = type === "placement" || type === "topper";
  const hasPhoto = !!image;

  return (
    <div className={`fame-card ${type}`} style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="card-badge" style={{ background: getBadgeColor() }}>
        <span className="flex items-center gap-1">
          {getIcon()} {type.toUpperCase()}
        </span>
      </div>

      <div className="avatar-wrapper">
        <span className="crown-icon">👑</span>
        {isStudent || !hasPhoto ? (
          <FameInitialsAvatar name={name} type={type} />
        ) : (
          <Avatar
            profileImage={image}
            name={name}
            userId={userId}
            size="h-full w-full"
            className="fame-avatar"
          />
        )}
      </div>

      <h3 className="fame-name">{name}</h3>
      <p className="fame-info">{getEmoji()} {title}</p>
      <div className="fame-detail">{detail}</div>
    </div>
  );
}

