import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateInstructorRequestMutation } from "../store/services/instructorRequestApi";
import { toast } from "react-toastify";
const InstructorRequestForm = () => {
  const navigate = useNavigate();
  // Text fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [field, setField] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [iban, setIban] = useState("");
  const [bio, setBio] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  // File fields
  const [photo, setPhoto] = useState(null);
  const [universityCertificate, setUniversityCertificate] = useState(null);
  const [experienceCertificates, setExperienceCertificates] = useState([]);
  const [createInstructorRequest, { isLoading }] =
    useCreateInstructorRequestMutation();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("field", field);
      formData.append("bankAccountNumber", bankAccountNumber);
      formData.append("bankName", bankName);
      formData.append("iban", iban);
      formData.append("bio", bio);
      formData.append("termsAccepted", termsAccepted);
      if (photo) formData.append("photo", photo);
      if (universityCertificate)
        formData.append("universityCertificate", universityCertificate);
      experienceCertificates.forEach((file) =>
        formData.append("experienceCertificates", file)
      );
      await createInstructorRequest(formData).unwrap();
      toast.success("Instructor request submitted successfully!");
      navigate("/");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to submit request");
    }
  };
  return <InstructorRequestFormView />;
};

export default InstructorRequestForm;
