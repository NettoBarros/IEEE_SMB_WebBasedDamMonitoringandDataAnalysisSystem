import api from "../../api";

export default async function postStructures(data){
    try{
        return await api.post(`/nesa/structure`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}