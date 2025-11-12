import api from "../../api";

export default async function getVisionTemporalBoxPlot(structureId, inspectionId, label){
    try{
        return await api.get(`/nesa/vision_temporalboxplot/${structureId}/${inspectionId}/${label}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}