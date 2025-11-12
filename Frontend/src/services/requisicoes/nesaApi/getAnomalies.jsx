import api from "../../api";

export default async function getAnomalies(id, initial_date, final_date){
    try{
        return await api.get(`/nesa/anomalies/${id}/${initial_date}/${final_date}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}