import api from "../../api";

export default async function authenticated(){
    try{
        return await api.get('/nesa/authenticated', {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}