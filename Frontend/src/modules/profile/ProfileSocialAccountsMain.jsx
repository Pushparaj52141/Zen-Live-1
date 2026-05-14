import { FaQuestionCircle } from "react-icons/fa";
import { useProfileSocialAccounts } from "./hooks/useProfileSocialAccounts";

export default function ProfileSocialAccountsMain() {
  const { accounts, updateItem } = useProfileSocialAccounts();

  return (
    <div className="min-h-full bg-[#f6f7f9] px-4 py-4">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <section>
          <p className="mb-1 text-sm text-gray-500">
            Account <span className="mx-2">›</span> <span className="font-medium text-black">Social accounts</span>
          </p>
          <h1 className="mb-4 text-2xl font-semibold text-[#0f172a]">Social accounts</h1>

          <div className="space-y-4">
            {accounts.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.key}>
                  <p className="mb-1 text-sm font-semibold text-[#0f172a]">{item.label}</p>
                  <div className="mb-2 flex items-center gap-3">
                    <Icon className={`text-xl ${item.color}`} />
                    <input
                      type="text"
                      placeholder={item.placeholder}
                      value={item.value}
                      onChange={(e) => updateItem(item.key, { value: e.target.value })}
                      className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-[#394056] outline-none focus:border-gray-400"
                    />
                  </div>
                  <div className="ml-8 flex items-center gap-3">
                    <span className="text-sm text-[#394056]">Display on your profile</span>
                    <button
                      type="button"
                      onClick={() => updateItem(item.key, { show: !item.show })}
                      className={`relative h-6 w-10 rounded-full transition ${item.show ? "bg-orange-400" : "bg-gray-300"}`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${item.show ? "right-0.5" : "left-0.5"}`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-white">
            <FaQuestionCircle />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-black">Social accounts</h3>
          <p className="text-sm leading-6 text-[#394056]">
            You can add your social media profile links and enable/disable them to be shown on your profile when someone views it
          </p>
        </aside>
      </div>
    </div>
  );
}
