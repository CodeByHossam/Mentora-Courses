import { useState } from 'react';
import { toast } from 'react-toastify';
import {
  useCreateStudentRefundMutation,
  useGetStudentRefundsQuery,
  useGetRefundStatsQuery
} from '../../store/services/refundApi';
import { useGetBillingAccountQuery } from '../../store/services/billingApi';

export const useStudentRefundRequest = () => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ courseId: '', paymentId: '', reason: '', description: '', requestedAmount: '' });
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [supportingFiles, setSupportingFiles] = useState([]);

  const [createRefund, { isLoading: isCreating }] = useCreateStudentRefundMutation();
  const { data: refunds, isLoading: isLoadingRefunds, refetch: refetchRefunds } = useGetStudentRefundsQuery();
  const { data: refundStats } = useGetRefundStatsQuery({ period: '30d' });
  const { data: billingData } = useGetBillingAccountQuery();

  const coursePurchases = billingData?.data?.coursePurchases || [];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCourseSelect = (e) => {
    const courseId = e.target.value;
    if (courseId === 'test-course') {
      const testCourse = { courseId: 'test-course', courseName: 'Test Course', purchaseAmount: 50, paymentId: 'test-payment', purchaseDate: new Date().toISOString() };
      setSelectedCourse(testCourse);
      setFormData(prev => ({ ...prev, courseId: courseId, paymentId: 'test-payment', requestedAmount: '50' }));
    } else {
      const course = availableCourses.find(c => c.courseId === courseId);
      setSelectedCourse(course);
      setFormData(prev => ({ ...prev, courseId: courseId, paymentId: course?.paymentId || '', requestedAmount: course?.purchaseAmount || '' }));
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSupportingFiles(files);
  };

  const removeFile = (index) => {
    setSupportingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.courseId || !formData.reason || !formData.requestedAmount) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      supportingFiles.forEach(file => {
        submitData.append('supportingDocuments', file);
      });
      await createRefund(submitData).unwrap();
      toast.success('Refund request submitted successfully!');
      setFormData({ courseId: '', paymentId: '', reason: '', description: '', requestedAmount: '' });
      setSelectedCourse(null);
      setSupportingFiles([]);
      setShowForm(false);
      refetchRefunds();
    } catch (error) {
      console.error('Refund submission error:', error);
      toast.error(error?.data?.message || 'Failed to submit refund request');
    }
  };

  const existingRefundCourses = refunds?.refunds?.map(r => r.relatedCourse) || [];
  const availableCourses = coursePurchases.filter(course => !existingRefundCourses.includes(course.courseId));

  const formatCurrency = (amount) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return {
    showForm, setShowForm,
    formData, setFormData,
    selectedCourse, setSelectedCourse,
    supportingFiles, setSupportingFiles,
    createRefund, isCreating,
    refunds, isLoadingRefunds, refetchRefunds,
    refundStats,
    billingData,
    coursePurchases,
    availableCourses,
    handleInputChange,
    handleCourseSelect,
    handleFileChange,
    removeFile,
    handleSubmit,
    formatCurrency,
    formatDate,
  };
};
export default useStudentRefundRequest;
