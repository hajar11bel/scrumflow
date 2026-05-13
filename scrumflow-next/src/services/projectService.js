import api from "@/api/axiosConfig";
import { asArray } from "@/utils/apiNormalize";

export const projectService = {
    getAll: async () => {
        const response = await api.get("/projects");
        return asArray(response.data);
    },

    create: async (projectPayload) => {
        const response = await api.post("/projects", projectPayload);
        return response.data;
    },

    update: async (projectId, projectPayload) => {
        const response = await api.put(`/projects/${projectId}`, projectPayload);
        return response.data;
    },

    getByStatus: async (status) => {
        const response = await api.get(`/projects/status/${status}`);
        return asArray(response.data);
    },
};
