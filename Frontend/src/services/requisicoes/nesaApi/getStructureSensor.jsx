import api from "../../api";

export default async function getStructureSensor(){
    try{
        return await api.get(`/nesa/filters_sensors_structures`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}