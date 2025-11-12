import api from "../../api";

export default async function getClusterInfo(id){
    try{
        return await api.get(`/nesa/cluster_info/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}