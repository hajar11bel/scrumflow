import api from "../api/axiosConfig";
import { asArray } from "../utils/apiNormalize";

export const taskService = {
    getAll: async () => {
        const response = await api.get("/tasks");
        return asArray(response.data);
    },

    getByDeveloper: async (userId) => {
        const response = await api.get(`/tasks/developer/${userId}`);
        return asArray(response.data);
    },

    getBySprint: async (sprintId) => {
        const response = await api.get(`/tasks/sprint/${sprintId}`);
        return asArray(response.data);
    },

    create: async (payload) => {
        const response = await api.post("/tasks", payload);
        return response.data;
    },

    changeStatus: async (taskId, status) => {
        const response = await api.patch(`/tasks/${taskId}/status/${status}`);
        return response.data;
    },

    assignToUser: async (taskId, userId) => {
        const response = await api.patch(`/tasks/${taskId}/assign/${userId}`);
        return response.data;
    },
};
