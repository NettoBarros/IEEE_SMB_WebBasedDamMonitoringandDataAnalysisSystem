import api from "../../api";

export default async function getAutomatization(id, n){
    try{
        return await api.get(`/nesa/automatization/${id}/${n}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}