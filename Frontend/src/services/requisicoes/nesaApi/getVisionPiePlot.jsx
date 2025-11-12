import api from "../../api";

export default async function getVisionPiePlot(inspectionId, label){
    try{
        return await api.get(`/nesa/vision_pieplot/${inspectionId}/${label}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}