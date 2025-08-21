// validation.js

export const validateUserForm = (form) => {
  const errors = {};

  // First Name
  if (!form.firstName.trim()) {
    errors.firstName = "First name is required";
  } else if (!/^[A-Za-z]+$/.test(form.firstName)) {
    errors.firstName = "First name can only contain letters";
  }

  // Last Name
  if (!form.lastName.trim()) {
    errors.lastName = "Last name is required";
  } else if (!/^[A-Za-z]+$/.test(form.lastName)) {
    errors.lastName = "Last name can only contain letters";
  }

  // Email
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (
    !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)
  ) {
    errors.email = "Invalid email address";
  }

  // Password
  if (!form.password) {
    errors.password = "Password is required";
  } else if (form.password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  } else if (!/(?=.*[0-9])/.test(form.password)) {
    errors.password = "Password must contain at least one number";
  } else if (!/(?=.*[A-Z])/.test(form.password)) {
    errors.password = "Password must contain at least one uppercase letter";
  }

  // WhatsApp Number
  if (!form.whatsappNumber.trim()) {
    errors.whatsappNumber = "WhatsApp number is required";
  } else if (!/^\+?[0-9]{7,15}$/.test(form.whatsappNumber)) {
    errors.whatsappNumber = "Invalid phone number";
  }

  // School Name
  if (!form.schoolName.trim()) {
    errors.schoolName = "School name is required";
  }

  // Grade
  if (!form.grade.trim()) {
    errors.grade = "Grade is required";
  }

  // Gender
  if (!form.gender.trim()) {
    errors.gender = "Gender is required";
  }

  // Age
  if (!form.age.trim()) {
    errors.age = "Age is required";
  } else if (!/^\d+$/.test(form.age)) {
    errors.age = "Age must be a number";
  } else if (parseInt(form.age) < 5 || parseInt(form.age) > 100) {
    errors.age = "Age must be between 5 and 100";
  }

  return errors;
};
