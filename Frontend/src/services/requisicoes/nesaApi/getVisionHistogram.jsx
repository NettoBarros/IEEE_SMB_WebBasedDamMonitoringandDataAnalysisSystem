import api from "../../api";

export default async function getVisionHistogram(inspectionId, label){
    try{
        return await api.get(`/nesa/vision_histogram/${inspectionId}/${label}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}