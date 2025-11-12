import api from "../../api";

export default async function getStructures(){
    try{
        return await api.get(`/nesa/structure`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}