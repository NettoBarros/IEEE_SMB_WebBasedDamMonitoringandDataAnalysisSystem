import api from "../../api";

export default async function getSensors(){
    try{
        return await api.get(`/nesa/sensor`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}