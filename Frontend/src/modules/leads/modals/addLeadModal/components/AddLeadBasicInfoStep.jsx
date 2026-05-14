import React from "react";
import SearchableSelect from "@shared/components/SearchableSelect";
import { COUNTRY_CODES, STATUS_OPTIONS } from "../constants/addLeadModalConstants";
import { stripMobileSpaces as stripMobile } from "@shared/utils/countryMobileValidation";

export default function AddLeadBasicInfoStep({
  name,
  setName,
  clearFieldError,
  getInputClasses,
  fieldErrors,
  countryCode,
  setCountryCode,
  manualCountryCode,
  setManualCountryCode,
  mobileNumber,
  setMobileNumber,
  email,
  setEmail,
  roles,
  role,
  setRole,
  college,
  setCollege,
  location,
  setLocation,
  sources,
  source,
  setSource,
  setReferredBy,
  setMetaCampaignId,
  status,
  setStatus,
  isReferralSource,
  referredBy,
  isMetaAdsSource,
  metaCampaigns,
  metaCampaignId,
  priority,
  setPriority,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4 text-gray-800">Lead Basic Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearFieldError("name");
            }}
            className={getInputClasses("name")}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <div className="w-28">
              <SearchableSelect
                options={COUNTRY_CODES}
                value={countryCode}
                onChange={(val) => {
                  setCountryCode(val);
                  clearFieldError("countryCode");
                  if (val !== "manual") {
                    setManualCountryCode("");
                  }
                }}
                error={!!fieldErrors.countryCode}
                placeholder="+91"
                className=""
              />
            </div>
            {countryCode === "manual" && (
              <input
                type="text"
                value={manualCountryCode}
                onChange={(e) => {
                  setManualCountryCode(e.target.value);
                  clearFieldError("countryCode");
                }}
                placeholder="Enter country code"
                className={getInputClasses("countryCode", "flex-1")}
                required
              />
            )}
            <input
              type="tel"
              inputMode="numeric"
              value={mobileNumber}
              onChange={(e) => {
                setMobileNumber(stripMobile(e.target.value));
                clearFieldError("mobile");
              }}
              placeholder="Enter Mobile Number"
              className={getInputClasses("mobile", "flex-1")}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
          <SearchableSelect
            options={roles.map((r) => ({ value: r.id, label: r.name }))}
            value={role}
            onChange={(val) => setRole(val)}
            placeholder="Select Role"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">College/Company</label>
          <input
            type="text"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
            placeholder="Enter College Or Company Name"
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter Location"
            className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Source <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={sources.map((s) => ({ value: s.id, label: s.name }))}
            value={source}
            onChange={(val) => {
              setSource(val);
              clearFieldError("source");
              setReferredBy("");
              setMetaCampaignId("");
            }}
            error={!!fieldErrors.source}
            placeholder="Select Source"
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Lead Status <span className="text-red-500">*</span>
          </label>
          <SearchableSelect
            options={STATUS_OPTIONS}
            value={status}
            onChange={(val) => {
              setStatus(val);
              clearFieldError("status");
            }}
            error={!!fieldErrors.status}
            placeholder="Select Status"
            className="w-full"
          />
        </div>

        {isReferralSource && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Referred By</label>
            <input
              type="text"
              value={referredBy}
              onChange={(e) => setReferredBy(e.target.value)}
              placeholder="Enter referrer name"
              className="w-full border border-gray-300 rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        )}

        {isMetaAdsSource && (
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Meta Campaign <span className="text-gray-400 font-normal"></span>
            </label>
            <SearchableSelect
              options={metaCampaigns.map((c) => ({
                value: c.id || c.campaign_id,
                label: c.name || c.campaign_name || c.id,
              }))}
              value={metaCampaignId}
              onChange={(val) => setMetaCampaignId(val)}
              placeholder="Select Meta Campaign"
              className="w-full"
            />
          </div>
        )}

        <div className="flex items-center h-full pt-4">
          <label className="flex items-center gap-2 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only"
                checked={priority === "hot"}
                onChange={(e) => {
                  setPriority(e.target.checked ? "hot" : "normal");
                  clearFieldError("priority");
                }}
              />
              <div
                className={`block w-10 h-5 rounded-full transition-colors ${
                  priority === "hot" ? "bg-red-500" : "bg-gray-300"
                }`}
              ></div>
              <div
                className={`dot absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${
                  priority === "hot" ? "translate-x-5" : ""
                }`}
              ></div>
            </div>
            <div className="text-xs font-semibold text-gray-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
              Hot Lead {priority === "hot" && "🔥"}
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
