import api from "../../api";

export default async function getUploadOrthoimage(id, name){
    try{
        return await api.get(`/nesa/upload_orthoimage/${id}/${name}`, {
            headers:{
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            },
            responseType: 'arraybuffer'
        })
    } catch(error){
        console.log(error)
    }
}