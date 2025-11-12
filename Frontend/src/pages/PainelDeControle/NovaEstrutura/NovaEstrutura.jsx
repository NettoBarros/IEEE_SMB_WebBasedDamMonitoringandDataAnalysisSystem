import React, { useState} from 'react';
import postStructures from "../../../services/requisicoes/nesaApi/postStructure";
import ListStructure from '../../../components/listStructure/listEstruture';
import Message from '../../../components/message/Message';
import ErrorMessage from '../../../components/errorMessage/ErrorMessage';
import './NovaEstrutura.css'

function NovaEstrutura() {
    
    const [postStruct, setPostStruct] = useState({structure_name:"", structure_location:"", inspection_frequency:"", as_built_document:""})
    const [showCreateStructureSuccess, setShowCreateStructureSuccess] = useState(false);
    const [submitStructureComplete, setSubmitStructureComplete] = useState(false);

    // Recebe os valores do forms e coloca dentro de "postStruct"
    const handleInputStructure = (event) =>{
        setPostStruct({...postStruct, [event.target.name]: event.target.value})
    }

    // Pega os valores dentro de "postStruct" e passa para a rota "postStructures"
    function handleSubmitStructure(event){
        event.preventDefault()
        postStructures(postStruct)
        .then((response) => {
            if (response.status === 200) {
                setSubmitStructureComplete(!submitStructureComplete);
                document.getElementById('NovaEstrutura').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowCreateStructureSuccess(true);
                setTimeout(() => {
                    setShowCreateStructureSuccess(false);
                }, 3000); // 5000 milissegundos = 5 segundos
            } else {
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorCreateStructure').click()
            }
        })
    }


    return (
        <div className='pcUser-container'>
            <div className='pcUser-bloco'>
                <header className='max-header'>
                    <h1>Lista de estruturas</h1>
                    <button id='max-newStrutureButton' data-bs-toggle="modal" data-bs-target="#NovaEstrutura">Novo Estrutura</button>
                </header>
                <ListStructure newStructureUpdate={submitStructureComplete} />
            </div>

            {/* Modal de adicionar nova estrutura */}
            <div className="modal fade" tabIndex="-1" id="NovaEstrutura">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title">Nova Estrutura</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className=''>

                                <div className="container">

                                    <form onSubmit={handleSubmitStructure}>
                                        <div className="mb-3">
                                            <label className="form-label">Nome da estrutura:</label>
                                            <input maxLength="45" required type="text" className="form-control" id="exampleFormControlInput1" onChange={handleInputStructure} name="structure_name" />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Localização da estrutura:</label>
                                            <input maxLength="45" required type="text" className="form-control" id="exampleFormControlInput1" onChange={handleInputStructure} name="structure_location"/>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Frequencia de Inspeção:</label>
                                            <input maxLength="45" required type="text" className="form-control" id="exampleFormControlInput1" onChange={handleInputStructure} name="inspection_frequency"/>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Documento Construido:</label>
                                            <input maxLength="45" required type="text" className="form-control" id="exampleFormControlInput1" onChange={handleInputStructure} name="as_built_document"/>
                                        </div>
                                        <div className='mb-3 text-center'>
                                            <input className="btnn" type="submit" value='Adicionar' />
                                        </div>
                                    </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ErrorMessage title={"Erro ao criar estrutura"} id={"errorCreateStructure"} message={"Erro ao criar estrutura. Verifique as informações e tente novamente."}/>
            <Message message={"Estrutura criada com sucesso!"} visible={showCreateStructureSuccess}/>
        </div>
    )
}

export default NovaEstrutura;