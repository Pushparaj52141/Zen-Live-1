import React from "react";

export default function AddLeadPaymentInfoStep({
  cardTypeVisibility,
  feeSectionOpen,
  setFeeSectionOpen,
  actualFee,
  setActualFee,
  discountedFee,
  setDiscountedFee,
  placementFeeSectionOpen,
  setPlacementFeeSectionOpen,
  placementActualFee,
  setPlacementActualFee,
  placementDiscountedFee,
  setPlacementDiscountedFee,
}) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold mb-4 text-gray-800">Payment Information</h3>

      {cardTypeVisibility.showTraining && (
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setFeeSectionOpen(!feeSectionOpen)}
            className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left text-xs font-semibold text-gray-700 border-b transition-colors"
          >
            <span>Training Fee Information</span>
            <span className="text-gray-500 text-lg">{feeSectionOpen ? "−" : "+"}</span>
          </button>
          {feeSectionOpen && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-600 mb-4">
                Set the training fee details. Fee payments will be tracked separately.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training Actual Fee (Original Price)
                  </label>
                  <input
                    type="number"
                    value={actualFee}
                    onChange={(e) => setActualFee(e.target.value)}
                    className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Actual Fee Amount"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Training Discounted Fee (before 6% GST)
                  </label>
                  <input
                    type="number"
                    value={discountedFee}
                    onChange={(e) => setDiscountedFee(e.target.value)}
                    className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Taxable amount; total due adds 6% GST"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {cardTypeVisibility.showPlacement && (
        <div className="border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setPlacementFeeSectionOpen(!placementFeeSectionOpen)}
            className="w-full px-3 py-2 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left text-xs font-semibold text-gray-700 border-b transition-colors"
          >
            <span>Placement Fee Information</span>
            <span className="text-gray-500 text-lg">{placementFeeSectionOpen ? "−" : "+"}</span>
          </button>
          {placementFeeSectionOpen && (
            <div className="p-4 space-y-4">
              <p className="text-xs text-gray-600 mb-4">
                Set the placement fee. Placement payments will be tracked separately.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Placement Actual Fee (Original Price)
                  </label>
                  <input
                    type="number"
                    value={placementActualFee}
                    onChange={(e) => setPlacementActualFee(e.target.value)}
                    placeholder="Enter Placement Actual Fee"
                    className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Placement Discounted Fee (before 6% GST)
                  </label>
                  <input
                    type="number"
                    value={placementDiscountedFee}
                    onChange={(e) => setPlacementDiscountedFee(e.target.value)}
                    placeholder="Taxable amount; total due adds 6% GST"
                    className="w-full border rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
