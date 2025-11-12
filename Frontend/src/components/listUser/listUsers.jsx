import React, { useState, useEffect } from 'react';
import getUsers from "../../services/requisicoes/nesaApi/getUsers";
import patchUser from "../../services/requisicoes/nesaApi/patchUser";
import deleteUser from "../../services/requisicoes/nesaApi/deleteUser";
import editIcon from "./icon/edit-text.png"
import AttentionMessage from '../attentionMessage/AttentionMessage';
import Message from '../message/Message';
import ErrorMessage from '../errorMessage/ErrorMessage';
import './listUsers.css'

function ListUsers({ newUserUpdate}) {

    const [users = [], setUser] = useState()
    const [infoUser = [], setInfoUser] = useState()
    const [showDeleteSuccessMessage, setShowDeleteSuccessMessage] = useState(false);
    const [showUpdateSuccessMessage, setShowUpdateSuccessMessage] = useState(false);
    const [updateUserList, setupdateUserList] = useState(false);
    const [patchSelectUser, setpatchSelectUser] = useState({})
    
    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getUsers().then((response) => {
            setUser(response.data.sort((a, b) => a.registration - b.registration))
        })
    }, [newUserUpdate, updateUserList])


    // Recebe os valores do forms e coloca dentro de "patchSelectUser"
    const handleInputUpdateUser = (event) =>{
        setpatchSelectUser({...patchSelectUser, [event.target.name]: event.target.value})
    }

    // Pega os valores dentro de "patchSelectUser" e passa para a rota "patchUser"
    function handleSubmitUpdateUser(e){
        e.preventDefault()
        patchUser(patchSelectUser, infoUser.id)
        .then((response) => {
            if (response.status === 200) {
                document.getElementById('InfoUser').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowUpdateSuccessMessage(true);
                setTimeout(() => {
                    setShowUpdateSuccessMessage(false);
                }, 3000); // 5000 milissegundos = 5 segundos
                setupdateUserList(!updateUserList);
            } else {
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorUpdateMessage').click()
            }
        })
    }

    const handleShowPassword2 = (e) => {
        const passwordInput = document.querySelector('#passwordinput2');
        if (passwordInput) {
          const passwordType = passwordInput.type === 'password' ? 'text' : 'password';
          passwordInput.type = passwordType;
        }
      };

    function deleteUserSelect(e) {
        e.preventDefault()
        deleteUser(infoUser.id)
        .then((response) => {
            if (response.status === 200) {
                document.getElementById('DelUserr').click()
                document.getElementById('InfoUser').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowDeleteSuccessMessage(true);
                setTimeout(() => {
                    setShowDeleteSuccessMessage(false);
                }, 3000); // 3000 milissegundos = 3 segundos
                setupdateUserList(!updateUserList);
            } else {
                console.log("Erro")
            }
        })
    }

    return (
        <>
            {/* Tabela de usuários */}
            <table className="table max-table">
                <thead>
                    <tr>
                        <th scope="col">Nº</th>
                        <th scope="col">NOME</th>
                        <th scope="col">EMAIL</th>
                        <th scope="col">CARGO</th>
                        <th scope="col">ADMIN</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((item, index) => {
                        return (
                            <tr key={index}>
                                <td id='max-firstTable'>{item.registration}</td>
                                <td>{item.first_name} {item.last_name}</td>
                                <td>{item.email}</td>
                                <td>{item.role}</td>
                                <td>{item.is_admin ? "Sim" : "Não"}</td>
                                <td className='configespecial'>
                                    <button className='' data-bs-toggle="modal" data-bs-target="#InfoUser" onClick={() => setInfoUser(item)}>
                                        <img className="max-iconEdit" src={editIcon} alt="icon edit" />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>

            {/* Modal de modificar usuario */}
            <div className="modal fade" tabIndex="-1" id="InfoUser" role='dialog'>
                <div key={infoUser.id} className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title modalTitle">Modificar Usuário</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">

                            <div className="container">

                                <form onSubmit={handleSubmitUpdateUser}>
                                    <div className="mb-3">
                                        <label className="form-label">Número de registro:</label>
                                        <input defaultValue={infoUser.registration} type="number" className="form-control" placeholder="" onChange={handleInputUpdateUser} name="registration" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Primeiro nome:</label>
                                        <input maxLength="45" defaultValue={infoUser.first_name} type="text" className="form-control" placeholder="" onChange={handleInputUpdateUser} name="first_name" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Último nome:</label>
                                        <input maxLength="45" defaultValue={infoUser.last_name} type="text" className="form-control" placeholder=""onChange={handleInputUpdateUser} name="last_name"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Cargo:</label>
                                        <input maxLength="15" defaultValue={infoUser.role} type="text" className="form-control" placeholder="" onChange={handleInputUpdateUser} name="role"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Email:</label>
                                        <input maxLength="50" autoComplete='new-password' defaultValue={infoUser.email} type="email" className="form-control" placeholder="xxxx@xxxx.xxx" onChange={handleInputUpdateUser} name="email"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Senha:</label>
                                        <div className="input-group">
                                        <input
                                            type="password"
                                            maxLength="255"
                                            minLength = "6"
                                            autoComplete='new-password'
                                            className="form-control"
                                            onChange={handleInputUpdateUser}
                                            name="password"
                                            id='passwordinput2'
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={handleShowPassword2}
                                        >
                                            Mostrar
                                        </button>
                                        </div>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Admin:</label>
                                        <div className="btn-group" role="group" aria-label="Escolha">
                                            <input defaultChecked={infoUser.is_admin === true} type="radio" id="sim" name="is_admin" value={1} onChange={handleInputUpdateUser} className="btn-check" />
                                            <label htmlFor="sim" className="btn btn-outline-secondary">Sim</label>
                                            
                                            <input defaultChecked={infoUser.is_admin === false} type="radio" id="nao" name="is_admin" value={0} onChange={handleInputUpdateUser} className="btn-check" />
                                            <label htmlFor="nao" className="btn btn-outline-secondary">Não</label>
                                        </div>
                                    </div>


                                    <div className='mb-3 text-center' >
                                        <input className="btnn" type="submit" value='Atualizar usuário' />
                                    </div>
                                </form>
                                <div className='text-center'>
                                    <button className='btnn max-deleteuser' data-bs-toggle="modal" data-bs-target="#DelUserr">Deletar usuário</button>
                                </div>
                            </div>   
                    </div>
                </div>
            </div>
            </div>

            <AttentionMessage id='DelUserr' title='Atenção' message='Confirmando esta operação, você não conseguirá recuperar as informações deletadas.' funcao={deleteUserSelect} />
            <ErrorMessage title={"Erro ao atualizar"} id={"errorUpdateMessage"} message={"Ocorreu um erro ao tentar atualizar o usuário. Verifique se o número de registro e/ou o e-mail informado já não estão sendo usados por outros usuários."} />
            
            <Message message={"Usuário deletado com sucesso!"} visible={showDeleteSuccessMessage} />
            <Message message={"Usuário atualizado com sucesso!"} visible={showUpdateSuccessMessage} />
        </>
    )
}

export default ListUsers;