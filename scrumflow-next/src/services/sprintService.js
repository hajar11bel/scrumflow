import api from "@/api/axiosConfig";
import { asArray } from "@/utils/apiNormalize";

export const sprintService = {
    getByProject: async (projectId) => {
        const response = await api.get(`/sprints/project/${projectId}`);
        return asArray(response.data);
    },

    create: async (payload) => {
        const response = await api.post("/sprints", payload);
        return response.data;
    },

    changeStatus: async (sprintId, status) => {
        const response = await api.patch(`/sprints/${sprintId}/status/${status}`);
        return response.data;
    },
};
