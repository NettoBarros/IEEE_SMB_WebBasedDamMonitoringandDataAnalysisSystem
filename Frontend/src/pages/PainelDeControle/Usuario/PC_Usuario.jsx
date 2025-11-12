import React, { useState} from 'react';
import postUserr from "../../../services/requisicoes/nesaApi/postUser";
import ListUsers from '../../../components/listUser/listUsers';
import Message from '../../../components/message/Message';
import ErrorMessage from '../../../components/errorMessage/ErrorMessage';
import './PC_Usuario.css'

function PCUsuario() {

    
    const [postUser, setPostUser] = useState({})
    const [showSuccessMessage, setShowSuccessMessage] = useState(false);
    const [submitUserComplete, setsubmitUserComplete] = useState(false);

    // Recebe os valores do forms e coloca dentro de "postUser"
    const handleInput = (event) =>{
        setPostUser({...postUser, [event.target.name]: event.target.value})
    }

    // Pega os valores dentro de "postUser" e passa para a rota "postUser"
    function handleSubmitUser(event){
        event.preventDefault()
        postUserr(postUser)
        .then((response) => {
            if (response.status === 200) {
                setsubmitUserComplete(!submitUserComplete);
                document.getElementById('NovaUsuario').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowSuccessMessage(true);
                setTimeout(() => {
                    setShowSuccessMessage(false);
                }, 3000); // 5000 milissegundos = 5 segundos
            } else {
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorMessage').click()
            }
        })
    }

    const handleShowPassword = (e) => {
        const passwordInput = document.querySelector("#passwordinput1");
        if (passwordInput) {
          const passwordType = passwordInput.type === 'password' ? 'text' : 'password';
          passwordInput.type = passwordType;
        }
      };

    return (
        <div className='pcUser-container'>
            <div className='pcUser-bloco'>
                <header className='max-header'>
                    <h1>Lista de usuários</h1>
                    <button id='max-newUserButton' data-bs-toggle="modal" data-bs-target="#NovaUsuario">Novo Usuário</button>
                </header>
                <ListUsers newUserUpdate={submitUserComplete}/>
            </div>

            {/* Modal de adicionar nova usuário */}
            <div className="modal fade" tabIndex="-1" id="NovaUsuario" role='dialog'>
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header max-modalheader">
                            <h5 className="modal-title">Novo usuário</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className=''>

                                <div className="container">

                                    <form onSubmit={handleSubmitUser}>
                                        <div className="mb-3">
                                            <label className="form-label">Número de registro:</label>
                                            <input required type="number" className="form-control" onChange={handleInput} name="registration" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Primeiro nome:</label>
                                            <input maxLength="45" required type="text" className="form-control" onChange={handleInput} name="first_name" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Último nome:</label>
                                            <input maxLength="45" required type="text" className="form-control" onChange={handleInput} name="last_name"/>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Cargo:</label>
                                            <input maxLength="15" required type="text" className="form-control" onChange={handleInput} name="role"/>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Email:</label>
                                            <input maxLength="50" autoComplete='new-password' required type="email" className="form-control" placeholder="xxxx@xxxx.xxx" onChange={handleInput} name="email"/>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Senha:</label>
                                            <div className="input-group">
                                            <input
                                                required
                                                maxLength="255"
                                                minLength = "6"
                                                autoComplete='new-password'
                                                type="password"
                                                className="form-control"
                                                onChange={handleInput}
                                                name="password"
                                                id='passwordinput1'
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={handleShowPassword}
                                            >
                                                Mostrar
                                            </button>
                                            </div>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Admin:</label>
                                            <div className="btn-group" role="group" aria-label="Escolha">
                                                <input type="radio" id="sim1" name="is_admin" value={1} onChange={handleInput} className="btn-check" />
                                                <label htmlFor="sim1" className="btn btn-outline-secondary">Sim</label>
                                                
                                                <input defaultChecked type="radio" id="nao1" name="is_admin" value={0} onChange={handleInput} className="btn-check" />
                                                <label htmlFor="nao1" className="btn btn-outline-secondary">Não</label>
                                            </div>
                                        </div>


                                        <div className='mb-3 text-center' >
                                            <input className="btnn" type="submit" value='Adicionar' />
                                        </div>
                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ErrorMessage title={"Erro ao criar usuário"} id={"errorMessage"} message={"Ocorreu um erro ao tentar criar o novo usuário. Verifique se o número de registro e/ou o e-mail informado já não estão sendo usados por outros usuários."} />
            <Message message={"Usuário adicionado com sucesso!"} visible={showSuccessMessage} />
        </div>
    )
}

export default PCUsuario;