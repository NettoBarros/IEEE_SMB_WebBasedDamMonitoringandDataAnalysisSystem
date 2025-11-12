import api from "../../api";

export default async function redefinePassword(id, data) {
  try {
    return await api.post(`/nesa/redefine_password/${id}`, data, {
      headers: {
        Authorization: "Bearer " + localStorage.getItem("JWT"),
      },
    });
  } catch (err) {
    return err.response.data.detail;
  }
}
