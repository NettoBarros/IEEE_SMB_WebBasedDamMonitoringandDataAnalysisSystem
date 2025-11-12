import api from "../../api";

export default async function getVisualInspection(){
    try{
        return await api.get(`/nesa/visual_inspection`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}