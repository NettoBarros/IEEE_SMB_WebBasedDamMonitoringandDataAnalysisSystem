import api from "../../api";

export default async function deleteInspection(id){
    try{
        return await api.delete(`/nesa/visual_inspection/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}