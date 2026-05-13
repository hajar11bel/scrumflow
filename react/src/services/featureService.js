import api from "../api/axiosConfig";
import { asArray } from "../utils/apiNormalize";

export const featureService = {
    getByProject: async (projectId) => {
        const response = await api.get(`/features/project/${projectId}`);
        return asArray(response.data);
    },

    create: async (featurePayload) => {
        const response = await api.post("/features", featurePayload);
        return response.data;
    },

    deleteById: async (featureId) => {
        await api.delete(`/features/${featureId}`);
    },
};
