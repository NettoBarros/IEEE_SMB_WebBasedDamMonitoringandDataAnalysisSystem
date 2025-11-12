import api from "../../api";

export default async function patchStructureSensor(data, id){
    try{
        return await api.patch(`/nesa/structure/${id}`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        return error.data
    }
}