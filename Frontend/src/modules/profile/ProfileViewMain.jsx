import { FaLinkedin } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useProfileUser } from "./hooks/useProfileUser";
import { getInitials } from "./utils/profileUtils";

export default function ProfileViewMain() {
  const navigate = useNavigate();
  const { username, imageSrc } = useProfileUser();
  const about = "Not added yet";
  const linkedIn = "";
  const showLinkedIn = false;

  return (
    <div className="min-h-full bg-[#f6f7f9]">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 overflow-hidden rounded-full border bg-gray-100">
              {imageSrc ? (
                <img src={imageSrc} alt={username} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-200 text-sm font-semibold text-gray-600">
                  {getInitials(username)}
                </div>
              )}
            </div>
            <h1 className="text-2xl font-semibold uppercase">{username}</h1>
          </div>

          <button
            type="button"
            onClick={() => navigate("/profile-details")}
            className="rounded border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit profile
          </button>
        </div>

        <div className="mt-3 border-b border-gray-200">
          <button type="button" className="border-b-2 border-orange-300 px-1 py-2 text-sm font-medium text-orange-400">
            Posts
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 py-4 lg:grid-cols-[300px_1fr]">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="mb-2 text-base font-semibold">Bio</h3>
            <p className="mb-4 text-sm text-gray-600">{about || "Not added yet"}</p>
            {showLinkedIn && linkedIn ? (
              <a
                href={linkedIn}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black text-white"
              >
                <FaLinkedin size={11} />
              </a>
            ) : null}
          </div>

          <div>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#1d2230]">Feed Posts</h3>
              <select className="rounded border border-gray-300 bg-white px-3 py-1 text-sm text-gray-600 outline-none">
                <option>Post type</option>
              </select>
            </div>

            <div className="flex min-h-[260px] flex-col items-center justify-center rounded-xl bg-transparent text-center">
              <p className="mb-2 text-xl font-semibold text-gray-700">Start creating content!</p>
              <p className="text-sm text-gray-500">You can post photos, videos, audios and even links! Let's go 💪</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
