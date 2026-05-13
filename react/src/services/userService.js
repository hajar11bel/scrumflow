import api from "../api/axiosConfig";
import { asArray } from "../utils/apiNormalize";

export const userService = {
    getAll: async () => {
        const response = await api.get("/users");
        return asArray(response.data);
    },
};
