import api from "../../api";

export default async function getThresholds(){
    try{
        return await api.get(`/nesa/project_threshold`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}