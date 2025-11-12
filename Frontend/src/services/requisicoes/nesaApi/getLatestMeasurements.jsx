import api from "../../api";

export default async function getLatestMeasurements(id, initial_date, final_date){
    try{
        return await api.get(`/nesa/latest_measurements/${id}/${initial_date}/${final_date}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}