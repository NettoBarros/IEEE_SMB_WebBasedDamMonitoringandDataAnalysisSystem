import api from "../../api";

export default async function getSensorsWithAnomalies(structure_id){
    try{
        return await api.get(`/nesa/get_sensors_with_anomalies/${structure_id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}