import { apiRequest } from "./base.js";

export const ImagesAPI = {
    uploadProfile: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('/images/profile-img', {
            method: 'POST',
            body: formData,
        });
    },
    uploadPost: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiRequest('/images/post-img', {
            method: 'POST',
            body: formData,
        });
    },
}
