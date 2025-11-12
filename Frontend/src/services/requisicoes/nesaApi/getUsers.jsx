import api from "../../api";

export default async function getUsers(){
    try{
        return await api.get(`/nesa/user`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}