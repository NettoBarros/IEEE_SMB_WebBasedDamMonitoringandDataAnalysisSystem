import api from "../../api";

export default async function getSensor(id){
    try{
        return await api.get(`/nesa/sensor/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}