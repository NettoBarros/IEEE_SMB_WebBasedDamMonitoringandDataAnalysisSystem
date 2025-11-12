import api from "../../api";

export default async function deleteModel(id){
    try{
        return await api.delete(`/nesa/models/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}