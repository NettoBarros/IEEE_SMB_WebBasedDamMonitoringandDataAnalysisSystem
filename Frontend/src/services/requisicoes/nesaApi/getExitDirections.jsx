import api from "../../api";

export default async function getExitDirections(id){
    try{
        return await api.get(`/nesa/get_exit_directions/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}