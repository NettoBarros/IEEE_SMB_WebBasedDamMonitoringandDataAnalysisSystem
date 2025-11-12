import api from "../../api";

export default async function patchThreshold(data, id){
    try{
        return await api.patch(`/nesa/project_threshold/${id}`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        return error.response
    }
}