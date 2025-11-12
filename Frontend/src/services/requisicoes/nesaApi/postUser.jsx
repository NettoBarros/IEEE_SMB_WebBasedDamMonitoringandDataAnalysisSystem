import api from "../../api";

export default async function postUser(data){
    try{
        return await api.post(`/nesa/user`, data, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        return error.response
    }
}