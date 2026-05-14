import { FaQuestionCircle } from "react-icons/fa";
import { useProfilePersonalDetails } from "./hooks/useProfilePersonalDetails";

export default function ProfilePersonalDetailsMain() {
  const { profile, rows, handleEdit, handleToggleSubscribers } =
    useProfilePersonalDetails();

  return (
    <div className="min-h-full bg-[#f6f7f9] px-4 py-4">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <section>
          <p className="mb-1 text-sm text-gray-500">
            Account <span className="mx-2">›</span> <span className="font-medium text-black">Personal details</span>
          </p>
          <h1 className="mb-4 text-2xl font-semibold text-[#0f172a]">Personal details</h1>

          <div className="mb-2 flex items-center justify-between border-b border-gray-200 pb-3">
            <span className="text-sm text-[#394056]">Show subscriber count on your profile</span>
            <button
              type="button"
              onClick={handleToggleSubscribers}
              className={`relative h-6 w-10 rounded-full transition ${profile.showSubscribers ? "bg-orange-400" : "bg-gray-300"}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${profile.showSubscribers ? "right-0.5" : "left-0.5"}`}
              />
            </button>
          </div>

          {rows.map((row) => (
            <div key={row.key} className="border-b border-gray-200 py-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-[#394056]">{row.label}</p>
                <button
                  type="button"
                  onClick={() => handleEdit(row.key, row.value)}
                  className="text-sm text-orange-400 hover:text-orange-500"
                >
                  Edit
                </button>
              </div>
              <p className="text-base font-semibold text-black">{row.value || "-"}</p>
            </div>
          ))}
        </section>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-white">
            <FaQuestionCircle />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-black">Personal details</h3>
          <p className="text-sm leading-6 text-[#394056]">
            You can add your personal information here so that we can get to know you better.
            Only your name, picture and the 'about you' section will be visible to your audience!
          </p>
        </aside>
      </div>
    </div>
  );
}
