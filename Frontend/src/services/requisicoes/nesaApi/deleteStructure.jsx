import api from "../../api";

export default async function postStructures(id){
    try{
        return await api.delete(`/nesa/structure/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}