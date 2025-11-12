import api from "../../api";

export default async function getStructure(id){
    try{
        return await api.get(`/nesa/structure/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}