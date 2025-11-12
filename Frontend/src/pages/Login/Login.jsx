import React, {useState} from "react";
import logo from '../../assets/pic-logo-norte-energia.svg'
import logoANEEL from '../../assets/Logo ANEEL - PDI.png'
import './login.css'
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";


function Login({setLogged}){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate()
    

    const handleSubmit= (e) => {
        e.preventDefault();
        api.post('/nesa/login', {
            email: email,
            password: password
        })
        .then((response) => {
            const token = response.data["jwt"]
            localStorage.setItem("JWT", token)
            setLogged(true)
            navigate('/')
    })
        .catch((err) => {
            setError('Senha ou Email estão incorretos!')})
    }

    return(


        <main className="login">
            <div className="login_block">
                <div className="logosLogin">
                <img className="logo" src={logo} alt="logo Eletro Norte" />
                <img className="logo" src={logoANEEL} alt="logo Eletro Norte" />
                </div>
                <div className="login_container">
                    <h3 className="login_title">SMB</h3>
                    <form className="login_form" onSubmit={handleSubmit}>
                    <input
                        className="login_input"
                        type="email" 
                        placeholder="E-mail"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}/>

                    <span className="login_input_border"></span>
                    <input className="login_input" 
                    type="password" 
                    placeholder="Senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)} />
                    <span className="login_input_border"></span>
                    <button className="login_submit">Login</button>
                    </form>
                    {error?<label style={{color:"red"}}>{error}</label>:null}
                </div>
            </div>

        </main>


    
    )
}

export default Login;