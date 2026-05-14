import { FaQuestionCircle } from "react-icons/fa";
import { useProfileContactDetails } from "./hooks/useProfileContactDetails";

export default function ProfileContactDetailsMain() {
  const { contact, handleEdit } = useProfileContactDetails();

  return (
    <div className="min-h-full bg-[#f6f7f9] px-4 py-4">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <section>
          <p className="mb-1 text-sm text-gray-500">
            Account <span className="mx-2">›</span> <span className="font-medium text-black">Update number/email</span>
          </p>
          <h1 className="mb-4 text-2xl font-semibold text-[#0f172a]">Update number/email</h1>

          <div className="border-b border-gray-200 py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-[#394056]">Phone number</p>
              <button type="button" onClick={() => handleEdit("phone")} className="text-sm text-orange-400 hover:text-orange-500">
                Edit
              </button>
            </div>
            <p className="text-base font-semibold text-black">{contact.phone}</p>
          </div>

          <div className="my-3 rounded-md border border-[#d8bf7a] bg-[#f7efde] px-4 py-2.5 text-sm text-[#6c5527]">
            Only Indian phone numbers can be updated currently.
          </div>

          <div className="border-b border-gray-200 py-3">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-sm font-medium text-[#394056]">Email</p>
              <button type="button" onClick={() => handleEdit("email")} className="text-sm text-orange-400 hover:text-orange-500">
                Edit
              </button>
            </div>
            <p className="text-base font-semibold text-black">{contact.email}</p>
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-gray-200 text-white">
            <FaQuestionCircle />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-black">Update email/number</h3>
          <p className="text-sm leading-6 text-[#394056]">
            Update your email id or Indian phone number by entering the new details and verifying via OTP. International phone numbers can't be updated presently.
          </p>
        </aside>
      </div>
    </div>
  );
}
