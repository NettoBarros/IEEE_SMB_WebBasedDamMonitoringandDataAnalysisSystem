import api from "../../api";

export default async function getModels(){
    try{
        return await api.get(`/nesa/models`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}