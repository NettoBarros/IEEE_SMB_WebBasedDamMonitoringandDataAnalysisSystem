import api from "../../api";

export default async function getVisionBoxPlot(id){
    try{
        return await api.get(`/nesa/vision_boxplot/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}