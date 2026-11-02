import React from "react";
const AdminSettingsPaymentsTab = (props) => {
  return (
    <>
              {activeTab === "payments" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">💰 Payment & Profit Configuration</h2>
                    <button
                      onClick={handleResetPaymentSettings}
                      disabled={isResetting}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin inline" />
                          Resetting...
                        </>
                      ) : (
                        <>🔄 Reset to Defaults</>
                      )}
                    </button>
                  </div>
                  {/* Profit Settings */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                      <span className="mr-2">📈</span>
                      Platform Profit Settings
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Global Deduction Percentage (%)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10}
                          onChange={(e) => handleLegacySettingChange("globalDeductionPercentage", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Percentage deducted from each course payment as platform profit
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.paymentSettings?.currency || settings.currency || "USD"}
                          onChange={(e) => handleLegacySettingChange("currency", e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                          <option value="GBP">GBP - British Pound</option>
                          <option value="CAD">CAD - Canadian Dollar</option>
                          <option value="AUD">AUD - Australian Dollar</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Annual User Fees */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
                      <span className="mr-2">👥</span>
                      Annual User Fees
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Instructor Annual Fee ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.instructorAnnualFee || settings.instructorAnnualFee || 100}
                          onChange={(e) => handleLegacySettingChange("instructorAnnualFee", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Annual fee charged to instructors for platform access
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Student Admin Fee ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.studentAdminFee || settings.studentAdminFee || 5}
                          onChange={(e) => handleLegacySettingChange("studentAdminFee", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border rounded-lg transition-colors" style={{borderColor: 'var(--card-border)'}} onFocus={(e) => {e.target.style.borderColor = 'var(--primary)'; e.target.style.outline = '2px solid var(--primary)'; e.target.style.outlineOffset = '2px'}} onBlur={(e) => {e.target.style.borderColor = 'var(--card-border)'; e.target.style.outline = 'none'}}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Annual administrative fee for student accounts
                        </p>
                      </div>
                    </div>
                  </div>
                  {/* Payment Gateway Settings */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
                      <span className="mr-2">💳</span>
                      Payment Gateway Configuration
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-secondary mb-2">
                          Minimum Payment Amount ({settings.paymentSettings?.currency || settings.currency || "USD"})
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={settings.paymentSettings?.minimumPaymentAmount || settings.minimumPaymentAmount || 5}
                          onChange={(e) => handleLegacySettingChange("minimumPaymentAmount", parseFloat(e.target.value))}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">💳</span>
                            Stripe Payments
                          </div>
                          <div className="text-sm text-gray-500">Enable Stripe payment gateway</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.stripeEnabled ?? settings.stripeEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("stripeEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">🅿️</span>
                            PayPal Payments
                          </div>
                          <div className="text-sm text-gray-500">Enable PayPal payment gateway</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.paypalEnabled ?? settings.paypalEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("paypalEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 flex items-center">
                            <span className="mr-2">🏦</span>
                            Direct Transfer
                          </div>
                          <div className="text-sm text-gray-500">Enable direct bank transfers</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.directTransferEnabled ?? settings.directTransferEnabled ?? true}
                          onChange={(e) => handleLegacySettingChange("directTransferEnabled", e.target.checked)}
                          className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                      </label>
                    </div>
                  </div>
                  {/* Enrollment Settings */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
                      <span className="mr-2">🎓</span>
                      Enrollment Automation
                    </h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Auto-enroll on Card Payment</div>
                          <div className="text-sm text-gray-500">Automatically enroll students after successful card payments</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.autoEnrollOnCardPayment ?? settings.autoEnrollOnCardPayment ?? true}
                          onChange={(e) => handleLegacySettingChange("autoEnrollOnCardPayment", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Auto-enroll on PayPal Payment</div>
                          <div className="text-sm text-gray-500">Automatically enroll students after successful PayPal payments</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.autoEnrollOnPaypalPayment ?? settings.autoEnrollOnPaypalPayment ?? true}
                          onChange={(e) => handleLegacySettingChange("autoEnrollOnPaypalPayment", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>
                      <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Require Admin Approval for Direct Transfers</div>
                          <div className="text-sm text-gray-500">Direct transfer payments require manual admin approval</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.paymentSettings?.requireAdminApprovalForDirectTransfer ?? settings.requireAdminApprovalForDirectTransfer ?? true}
                          onChange={(e) => handleLegacySettingChange("requireAdminApprovalForDirectTransfer", e.target.checked)}
                          className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                        />
                      </label>
                    </div>
                  </div>
                  {/* Profit Calculator Preview */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <span className="mr-2">🧮</span>
                      Profit Calculator Preview
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-blue-600">$100</div>
                        <div className="text-sm text-gray-600">Course Price</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-green-600">${(100 * (settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10) / 100).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Platform Profit ({settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10}%)</div>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <div className="text-2xl font-bold text-purple-600">${(100 - (100 * (settings.paymentSettings?.globalDeductionPercentage || settings.globalDeductionPercentage || 10) / 100)).toFixed(2)}</div>
                        <div className="text-sm text-gray-600">Instructor Earnings</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
    </>
  );
};

export default AdminSettingsPaymentsTab;
