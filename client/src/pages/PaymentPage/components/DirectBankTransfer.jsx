import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  useGetAdminBankDetailsQuery,
} from "../../../store/services/paymentApi";
import { useCreateEnrollmentRequestMutation } from "../../../store/services/enrollmentRequestApi";

const DirectBankTransfer = ({ course, user }) => {
  const navigate = useNavigate();
  const [bankDetails, setBankDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    transferDate: "",
    referenceNumber: "",
    receiptFile: null,
    bankName: "",
  });

  // 📦 SIMPLIFIED: Get ADMIN bank details (not instructor)
  // Students transfer money to admin, admin pays instructor directly
  const { data: adminData, isLoading: isLoadingAdmin } =
    useGetAdminBankDetailsQuery();
  const [createEnrollmentRequest] = useCreateEnrollmentRequestMutation();

  React.useEffect(() => {
    if (
      adminData?.success &&
      adminData?.data?.paymentDetails?.bankDetails
    ) {
      setBankDetails({
        bankName:
          adminData.data.paymentDetails.bankDetails.bankName ||
          "Bank Name Not Provided",
        accountNumber:
          adminData.data.paymentDetails.bankDetails.accountNumber ||
          "Please contact admin",
        accountHolder: adminData.data.name || "Mentora Admin",
        swift:
          adminData.data.paymentDetails.bankDetails.swift ||
          "Not available",
        iban:
          adminData.data.paymentDetails.bankDetails.iban ||
          "Not available",
      });

      // Auto-populate bank name in form
      setFormData(prev => ({
        ...prev,
        bankName: adminData.data.paymentDetails.bankDetails.bankName || ""
      }));
    }
  }, [adminData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.receiptFile ||
      !formData.transferDate ||
      !formData.referenceNumber ||
      !formData.bankName
    ) {
      toast.error("Please fill all fields and upload receipt");
      return;
    }

    setLoading(true);
    
    try {
      const submitData = new FormData();
      submitData.append("courseId", course._id);
      submitData.append("paymentMethod", "direct_transfer");
      submitData.append("transferredAmount", course.finalPrice || course.price);
      submitData.append("bankName", formData.bankName);
      submitData.append("referenceNumber", formData.referenceNumber);
      submitData.append("transferDate", formData.transferDate);
      submitData.append("bankTransferProof", formData.receiptFile);
      submitData.append("message", `Direct bank transfer payment for ${course.title}`);

      await createEnrollmentRequest(submitData).unwrap();

      setRequestSubmitted(true);
      toast.success(
        "Enrollment request with bank transfer submitted successfully! Your enrollment is pending admin approval."
      );
    } catch (error) {
      console.error("Error submitting enrollment request:", error);
      toast.error(error.data?.message || "Failed to submit enrollment request");
    } finally {
      setLoading(false);
    }
  };

  if (requestSubmitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="font-semibold text-green-800 mb-2">
          Enrollment Request Submitted Successfully!
        </h3>
        <p className="text-green-700 mb-4">
          Your enrollment request with bank transfer proof is under review. You'll be enrolled once approved by admin.
        </p>
        <button
          onClick={() => navigate(`/courses/${course._id}`)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Back to Course
        </button>
      </div>
    );
  }

  if (isLoadingAdmin) {
    return (
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading admin bank details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bank Details Display */}
      {bankDetails && (
        <>
          <div className="bg-white border rounded-xl overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                💳 Admin Bank Details
              </h3>
              <p className="text-sm text-gray-600">
                Transfer the course amount to this account. Admin will pay the instructor directly.
              </p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Bank Name
                  </label>
                  <p className="text-gray-900 font-semibold">
                    {bankDetails.bankName}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Account Number
                  </label>
                  <p className="text-gray-900 font-mono">
                    {bankDetails.accountNumber}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Account Holder
                  </label>
                  <p className="text-gray-900">{bankDetails.accountHolder}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    SWIFT Code
                  </label>
                  <p className="text-gray-900 font-mono">{bankDetails.swift}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Amount to Transfer
                  </label>
                  <p className="text-2xl font-bold text-green-600">
                    ${course.finalPrice}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Course
                  </label>
                  <p className="text-gray-900">{course.title}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white border rounded-xl p-6"
          >
            <h3 className="font-semibold text-gray-900 mb-4">
              📝 Confirm Your Transfer
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Amount
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                    <span className="text-2xl font-bold text-green-600">
                      ${course.finalPrice || course.price}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter bank name"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number *
                  </label>
                  <input
                    type="text"
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceNumber: e.target.value,
                      })
                    }
                    placeholder="Enter transaction reference number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transfer Date *
                  </label>
                  <input
                    type="date"
                    value={formData.transferDate}
                    onChange={(e) =>
                      setFormData({ ...formData, transferDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Receipt (PDF/Image) *
                </label>
                <input
                  type="file"
                  onChange={(e) =>
                    setFormData({ ...formData, receiptFile: e.target.files[0] })
                  }
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Submitting..." : "Submit Enrollment Request"}
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default DirectBankTransfer;
