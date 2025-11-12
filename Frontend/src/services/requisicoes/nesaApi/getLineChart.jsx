import api from "../../api";

export default async function getLineChart(id, initial_date, final_date){
    try{
        return await api.get(`/nesa/line_plot/${id}/${initial_date}/${final_date}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}