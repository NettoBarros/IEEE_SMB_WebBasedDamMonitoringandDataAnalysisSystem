import api from "../../api";

export default async function getAutomatization(id){
    try{
        return await api.get(`/nesa/automatization/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}