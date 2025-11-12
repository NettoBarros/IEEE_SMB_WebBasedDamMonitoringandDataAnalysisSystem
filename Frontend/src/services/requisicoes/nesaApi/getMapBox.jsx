import api from "../../api";

export default async function getMapBox(sensor_id){
    try{
        return await api.get(`/nesa/map_box/${sensor_id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}