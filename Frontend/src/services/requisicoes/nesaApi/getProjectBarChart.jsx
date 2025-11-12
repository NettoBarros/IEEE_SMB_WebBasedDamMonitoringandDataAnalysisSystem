import api from "../../api";

export default async function getProjectBarChart(id, initial_date, final_date){
    try{
        return await api.get(`/nesa/project_bar_plot/${id}/${initial_date}/${final_date}`, {headers:{
            Authorization: 'Bearer ' + localStorage.getItem('JWT')
        }})
    } catch(error){
        console.log(error)
    }
}