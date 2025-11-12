import api from "../../api";

export default async function postThreshold(data){
    try{
        return await api.post(`/nesa/project_threshold`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        return error.response
    }
}