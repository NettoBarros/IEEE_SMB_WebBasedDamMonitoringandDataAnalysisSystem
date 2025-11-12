import api from "../../api";

export default async function postUser(data, id){
    try{
        return await api.patch(`/nesa/user/${id}`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        return error.response
    }
}