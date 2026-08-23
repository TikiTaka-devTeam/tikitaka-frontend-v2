import { apiClient } from "../../../lib/api/client";

export const login = (payload) => apiClient.post("/auth/login", payload);

export const checkEmailDuplicate = (email) => 
    apiClient.get("/auth/check-email", { params: { email }, skipAuth: true });

export const signup = (payload) =>
  apiClient.post("/auth/signup", payload);

export const getCurrentUser = () => apiClient.get("/users");

export const getProfileImageUploadUrl = (payload) =>
  apiClient.post("/auth/create-profile-image", payload, { skipAuth: true });

export const createProfileImage = async (file) => {
  const { data } = await getProfileImageUploadUrl({
    original_filename: file.name,
    content_type: file.type,
  });

  const uploadUrl = data.upload_url;
  const objectKey = data.object_key;
  const profileUrl = data.profile_url;

  if (!uploadUrl || !objectKey) {
    throw new Error("프로필 이미지 업로드 URL을 가져오지 못했습니다.");
  }

  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
    },
    credentials: "omit",
  });

  // S3 PUT with one retry and detailed logging
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const resp = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
        credentials: "omit",
      });

      if (resp.ok) {
        // success
        lastError = null;
        break;
      }

      const respText = await resp.text().catch(() => "");
      lastError = new Error(
        `S3 업로드 실패: ${resp.status} ${resp.statusText}${
          respText ? ` - ${respText}` : ""
        }`,
      );
      console.warn(`createProfileImage: attempt ${attempt} failed:`, lastError);
    } catch (err) {
      lastError = err;
      console.warn(`createProfileImage: attempt ${attempt} fetch error:`, err);
    }

    if (attempt < 2) {
      // backoff before retry
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  if (lastError) {
    throw lastError;
  }

  return { objectKey, profileUrl };
};

export const getProfileImagePresignedUrl = (payload) =>
  apiClient.post("/auth/profile-image/presigned-url", payload);

export const confirmProfileImage = (payload) =>
  apiClient.post("/auth/profile-image", payload);

export const updateProfileImage = async (file) => {
  const { data: presigned } = await getProfileImagePresignedUrl({
    original_filename: file.name,
    content_type: file.type,
  });

  const uploadUrl = presigned.upload_url;
  const objectKey = presigned.object_key;

  if (!uploadUrl || !objectKey) {
    throw new Error("프로필 이미지 업로드 URL을 가져오지 못했습니다.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
    credentials: "omit",
  });

  if (!uploadResponse.ok) {
    throw new Error("프로필 이미지를 업로드하지 못했습니다.");
  }

  const { data } = await confirmProfileImage({
    object_key: objectKey,
  });

  return {
    profileUrl: data.profile_url || presigned.profile_url || "",
  };
};

export const logout = () => apiClient.post("/auth/logout");
