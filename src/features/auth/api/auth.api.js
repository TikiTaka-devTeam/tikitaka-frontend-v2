import { apiClient } from "../../../lib/api/client";

export const login = (payload) =>
  apiClient.post("/auth/login", payload, { skipAuth: true });

export const oauthLogin = (provider, authorizationCode, redirectUri) =>
  apiClient.post(
    `/auth/oauth/${provider}`,
    {
      authorization_code: authorizationCode,
      redirect_uri: redirectUri,
    },
    { skipAuth: true },
  );

export const checkEmailDuplicate = (email) =>
  apiClient.get("/auth/email/check", { params: { email }, skipAuth: true });

export const checkPhoneDuplicate = (phoneNumber) =>
  apiClient.get("/auth/phone/check", {
    params: { phone_number: phoneNumber },
    skipAuth: true,
  });

export const sendPhoneVerification = (phoneNumber) =>
  apiClient.post(
    "/auth/phone/verification",
    {
      phone_number: phoneNumber,
    },
    { skipAuth: true },
  );

export const confirmPhoneVerification = (phoneNumber, verificationCode) =>
  apiClient.post(
    "/auth/phone/verification/confirm",
    {
      phone_number: phoneNumber,
      verification_code: verificationCode,
    },
    { skipAuth: true },
  );

export const signup = (signupData, profileImage = null) => {
  const formData = new FormData();
  formData.append(
    "signup_data",
    new Blob([JSON.stringify(signupData)], { type: "application/json" }),
  );

  if (profileImage) {
    formData.append("profile_image", profileImage);
  }

  return apiClient.post("/auth/signup", formData, { skipAuth: true });
};

export const oauthSignup = (signupData, profileImage = null) => {
  const formData = new FormData();
  formData.append(
    "signup_data",
    new Blob([JSON.stringify(signupData)], { type: "application/json" }),
  );

  if (profileImage) {
    formData.append("profile_image", profileImage);
  }

  return apiClient.post("/auth/oauth/signup", formData, { skipAuth: true });
};

export const getCurrentUser = () => apiClient.get("/users/me");

export const changePassword = (payload) =>
  apiClient.patch("/users/me/password", payload);

export const createInquiry = (payload) => apiClient.post("/inquiries", payload);

export const updateProfileImage = async (file = null, shouldDelete = false) => {
  const formData = new FormData();

  if (file) {
    formData.append("profile_image", file);
  } else if (shouldDelete) {
    formData.append("delete", "true");
  }

  const { data } = await apiClient.patch("/users/me/profile-image", formData);

  return {
    profileUrl: data?.profile_url || "",
  };
};

export const logout = () =>
  apiClient.post("/auth/logout", {
    refresh_token: localStorage.getItem("tikitaka_refresh_token"),
  });
