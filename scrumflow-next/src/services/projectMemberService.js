import api from "@/api/axiosConfig";
import { asArray } from "@/utils/apiNormalize";

export const projectMemberService = {
    getByProject: async (projectId) => {
        const response = await api.get(`/project-members/project/${projectId}`);
        return asArray(response.data);
    },

    addToProject: async (userId, projectId) => {
        const response = await api.post(`/project-members/user/${userId}/project/${projectId}`);
        return response.data;
    },

    getByUser: async (userId) => {
        const response = await api.get(`/project-members/user/${userId}`);
        return asArray(response.data);
    },
};