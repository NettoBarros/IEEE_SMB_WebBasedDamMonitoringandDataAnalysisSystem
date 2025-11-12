import api from "../../api";

export default async function getVisionMetric(inspectionId, label="ndvi"){
    try{
        return await api.get(`/nesa/vision_metric/${inspectionId}/${label}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}