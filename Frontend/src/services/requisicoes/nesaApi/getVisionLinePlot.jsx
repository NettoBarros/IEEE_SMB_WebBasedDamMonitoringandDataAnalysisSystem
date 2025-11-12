import api from "../../api";

export default async function getVisionLinePlot(structureId, inspectionId, label="ndvi"){
    try{
        return await api.get(`/nesa/vision_lineplot/${structureId}/${inspectionId}/${label}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}