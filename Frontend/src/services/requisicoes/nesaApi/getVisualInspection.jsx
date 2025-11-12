import api from "../../api";

export default async function getVisualInspection(id){
    try{
        return await api.get(`/nesa/visual_inspection/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}