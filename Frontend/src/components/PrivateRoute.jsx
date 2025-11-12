import { Navigate } from "react-router-dom";
import api from "../services/api";
import { useEffect, useState } from "react";

export default function PrivateRoute({setLogged, children}) {
    const [redirectToLogin, setRedirectToLogin] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('JWT')
        if(token){ 
            api.get('/nesa/authenticated', {headers:{
            Authorization: 'Bearer ' + token}})
            .then(() => {
                setLogged(true)
                setRedirectToLogin(false)
            })
            .catch((err) => {
                console.log('ops! Erro: ' + err);
                localStorage.removeItem('JWT')
                setLogged(false)
                setRedirectToLogin(true)
            })
        }
        else {
            setLogged(false)
            setRedirectToLogin(true)
        }
    }, [])

    return(redirectToLogin === true ? <Navigate to="/login" replace={true}/> : children)
}