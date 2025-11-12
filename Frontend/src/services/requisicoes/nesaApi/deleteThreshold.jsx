import api from "../../api";

export default async function deleteThreshold(id){
    try{
        return await api.delete(`/nesa/project_threshold/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}