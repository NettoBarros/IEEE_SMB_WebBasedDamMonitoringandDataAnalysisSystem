import api from "../../api";

export default async function getMeasurements(id){
    try{
        return await api.get(`/nesa/measurements_interval/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}