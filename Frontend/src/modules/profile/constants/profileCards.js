import {
  FaCog,
  FaGlobe,
  FaIdBadge,
  FaMoneyBillWave,
  FaUser,
} from "react-icons/fa";

export const PROFILE_CARDS = [
  {
    title: "View profile",
    description: "View your profile page as others see it",
    icon: FaUser,
    path: "/profile-view",
  },
  {
    title: "Personal details",
    description: "Update your name, bio, gender, birthday and more",
    icon: FaIdBadge,
    path: "/profile-details/personal",
  },
  {
    title: "Social accounts",
    description: "Connect your social accounts",
    icon: FaGlobe,
    path: "/profile-details/social",
  },
  {
    title: "Payment details",
    description: "Manage your bank account & other payment details",
    icon: FaMoneyBillWave,
    path: "/profile-details/payment",
  },
  {
    title: "Update number/email",
    description: "View and update registered phone number & email",
    icon: FaIdBadge,
    path: "/profile-details/contact",
  },
  {
    title: "Settings",
    description: "Manage notifications and messages settings",
    icon: FaCog,
    path: "/settings",
  },
];

