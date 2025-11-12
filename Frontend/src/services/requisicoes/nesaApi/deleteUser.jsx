import api from "../../api";

export default async function postUser(id){
    try{
        return await api.delete(`/nesa/user/${id}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}