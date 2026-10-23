import React, { memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../store/services/authApi";
import { setCredentials } from "../store/slices/authSlice";
import { toast } from "react-toastify";
import { useFormData } from "../hooks/useFormData";
import { handleApiError, handleApiSuccess } from "../utils/errorHandler";
import FormInput from "../components/FormInput";
import FileUpload from "../components/FileUpload";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";

const Register = memo(() => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const validationSchema = {
    name: {
      required: true,
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/
    },
    email: {
      required: true,
      type: 'email',
      maxLength: 100
    },
    password: {
      required: true,
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,128}$/
    },
    confirmPassword: {
      required: true,
      match: 'password'
    },
    photo: {
      required: false,
      type: 'file',
      accept: 'image/*',
      maxSize: 5 * 1024 * 1024 // 5MB
    },
    termsAccepted: {
      required: true,
      type: 'boolean'
    }
  };

  const {
    formData,
    errors,
    updateField,
    handleSubmit,
    getFieldProps,
    getFileFieldProps,
    isValid
  } = useFormData({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    photo: null,
    termsAccepted: false
  }, validationSchema);

  const onSubmit = async (data) => {
    const form = new FormData();
    form.append("name", data.name);
    form.append("email", data.email);
    form.append("password", data.password);
    form.append("termsAccepted", data.termsAccepted);
    if (data.photo) {
      form.append("photo", data.photo);
    }

    const userData = await register(form).unwrap();
    dispatch(setCredentials(userData));
    return userData;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSubmit(onSubmit, {
      onSuccess: () => {
        handleApiSuccess(null, { message: "Registration successful!" });
        navigate("/");
      },
      onError: (error) => {
        handleApiError(error, { customMessage: "Registration failed" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-primary shadow-2xl my-2 sm:my-4 md:my-8 flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-12 rounded-2xl overflow-x-hidden">
      <div className="w-full max-w-md">
        {/* Logo/Brand Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="mx-auto h-12 w-12 sm:h-16 sm:w-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 shadow-lg" style={{background: 'linear-gradient(to right, var(--success), var(--info))'}}>
            <span className="text-white text-lg sm:text-2xl font-bold">LT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Join Mentora!</h1>
          <p className="text-sm sm:text-base text-secondary">Start your learning journey today</p>
        </div>

        {/* Registration Card */}
        <div className="card rounded-2xl p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-primary mb-2">
              Create your account
            </h2>
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium hover:underline transition-colors" style={{color: 'var(--success)'}} onMouseEnter={(e) => e.target.style.color = 'var(--success-dark)'} onMouseLeave={(e) => e.target.style.color = 'var(--success)'}
              >
                Sign in here
              </Link>
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleFormSubmit}>
            <div className="space-y-4">
              <FormInput
                label="Full Name"
                placeholder="Enter your full name"
                {...getFieldProps('name')}
                helpText="Only letters and spaces allowed"
              />
              
              <FormInput
                label="Email Address"
                type="email"
                placeholder="Enter your email address"
                {...getFieldProps('email')}
              />
              
              <FormInput
                label="Password"
                type="password"
                placeholder="Create a strong password"
                {...getFieldProps('password')}
                helpText="Must contain 8+ characters, uppercase, lowercase, number, and special character"
              />
              
              <FormInput
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
                {...getFieldProps('confirmPassword')}
              />
              
              <FileUpload
                label="Profile Photo (Optional)"
                {...getFileFieldProps('photo')}
                preview={true}
                helpText="Upload a profile picture (max 5MB)"
              />

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start space-x-3">
                <div className="flex items-center h-5">
                  <input
                    id="termsAccepted"
                    name="termsAccepted"
                    type="checkbox"
                    checked={formData.termsAccepted}
                    onChange={(e) => updateField('termsAccepted', e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                </div>
                <div className="text-sm">
                  <label htmlFor="termsAccepted" className="text-gray-700">
                    I agree to the{' '}
                    <Link
                      to="/terms-and-conditions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      Terms and Conditions
                    </Link>
                    {' '}and acknowledge that I have read and understood the platform policies.
                  </label>
                  {errors.termsAccepted && (
                    <p className="mt-1 text-sm text-red-600">{errors.termsAccepted}</p>
                  )}
                </div>
              </div>
            </div>


            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              disabled={!isValid || isLoading}
            >
              Create Account
            </Button>
          </form>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" style={{borderColor: 'var(--card-border)'}} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-4 text-muted">or</span>
            </div>
          </div>

          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => navigate("/instructor-register")}
            className="mt-4"
          >
            Register as Instructor
          </Button>

          {/* Additional Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-secondary">
              Need help? {" "}
              <Link to="/contact" className="font-medium hover:underline transition-colors" style={{color: 'var(--success)'}} onMouseEnter={(e) => e.target.style.color = 'var(--success-dark)'} onMouseLeave={(e) => e.target.style.color = 'var(--success)'}>
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

Register.displayName = 'Register';

export default Register;
