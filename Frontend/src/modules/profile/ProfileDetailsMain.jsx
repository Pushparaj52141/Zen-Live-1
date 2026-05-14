import { FaSignOutAlt, FaTrashAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import apiClient from "@shared/api/client";
import { endpoints } from "@shared/api/endpoints";
import { PROFILE_CARDS } from "./constants/profileCards";
import { useProfileUser } from "./hooks/useProfileUser";
import { getInitials } from "./utils/profileUtils";

export default function ProfileDetailsMain({ onLogout }) {
  const navigate = useNavigate();
  const { username, imageSrc } = useProfileUser();

  const handleLogout = async () => {
    if (typeof onLogout === "function") {
      onLogout();
      return;
    }
    try {
      await apiClient.post(endpoints.auth.logout);
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-full bg-[#f6f7f9] py-4">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-5 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Hello,</p>
              <h1 className="text-2xl font-semibold uppercase tracking-wide text-gray-900">
                {username}
              </h1>
            </div>
            <div className="h-14 w-14 overflow-hidden rounded-full border bg-gray-100">
              {imageSrc ? (
                <img src={imageSrc} alt={username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-semibold text-gray-600">
                  {getInitials(username)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {PROFILE_CARDS.map(({ title, description, icon: Icon, path }) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(path)}
              className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md"
            >
              <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
                <Icon className="h-4 w-4" />
              </div>
              <h3 className="mb-1 text-base font-semibold text-gray-900">{title}</h3>
              <p className="text-xs text-gray-500">{description}</p>
            </button>
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-md">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl bg-pink-100 py-3 text-sm font-semibold text-pink-600 transition hover:bg-pink-200"
          >
            <span className="inline-flex items-center gap-2">
              <FaSignOutAlt />
              Logout
            </span>
          </button>

          <button
            type="button"
            className="mt-4 w-full text-sm font-medium text-pink-500 transition hover:text-pink-600"
          >
            <span className="inline-flex items-center gap-2">
              <FaTrashAlt />
              Permanently delete your account
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
