import React, { useState, useEffect } from 'react';
import editIcon from '../listUser/icon/edit-text.png'
import getStructureSensor from "../../services/requisicoes/nesaApi/getStructureSensor";
import patchStructureSensor from "../../services/requisicoes/nesaApi/patchStructureSensor";
import deleteStructure from "../../services/requisicoes/nesaApi/deleteStructure";
import AttentionMessage from '../attentionMessage/AttentionMessage';
import Message from '../message/Message';
import ErrorMessage from '../errorMessage/ErrorMessage';
import './listStructure.css'
// import iconNotice from '../../assets/icons/notice.png'
// import Modal from '../../components/Modal/modal'

function ListStructure({newStructureUpdate}) {

    const [structures = [], setStructures] = useState()
    // const [chosenStructure, setChosenStructure] = useState()
    const [infoStructure = [], setInfoStructure] = useState()
    const [patchStructure, setPatchStructure] = useState()
    const [showDeleteSensorSuccess, setShowDeleteSensorSuccess] = useState(false)
    const [showUpdateSensorSuccess, setShowUpdateSensorSuccess] = useState(false)
    const [updateSensorList, setUpdateSensorList] = useState(false)
    
    
    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getStructureSensor().then((response) => {
            setStructures(response.data.sort((a, b) => a.id - b.id))
        })
    }, [newStructureUpdate ,updateSensorList])

    const handleInputUpdateStructure = (event) =>{
        setPatchStructure({...patchStructure, [event.target.name]: event.target.value})
    }

    function handleSubmitUpdateStructure(e){
        e.preventDefault()
        patchStructureSensor(patchStructure, infoStructure.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateSensorList(!updateSensorList);
                document.getElementById('InfoEstructure').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowUpdateSensorSuccess(true);
                setTimeout(() => {
                    setShowUpdateSensorSuccess(false);
                }, 3000); // 5000 milissegundos = 5 segundos
            } else {
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorUpdateSensor').click()
            }
        })
    }

    function deleteStructureSelect(e) {
        e.preventDefault()
        deleteStructure(infoStructure.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateSensorList(!updateSensorList);
                document.getElementById('InfoEstructure').click()
                document.getElementById('DelStructure').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowDeleteSensorSuccess(true);
                setTimeout(() => {
                    setShowDeleteSensorSuccess(false);
                }, 3000); // 5000 milissegundos = 5 segundos
            } else {
                console.log("Erro ao tentar deletar usuário.")
            }
        })
    }

    return (
        <>
            <table className="table max-table">
                <thead>
                    <tr>
                        <th scope="col">Nº</th>
                        <th scope="col">NOME</th>
                        <th className='text-center' scope="col">INSTRUMENTOS</th>
                        <th scope="col"></th>
                    </tr>
                </thead>
                
                <tbody>
                    {structures.map((estructure, index) => {
                        return (
                            <tr key={index}>
                                <td>{estructure.id}</td>
                                <td>{estructure.structure_name}</td>
                                <td className='text-center'>
                                    <label >{estructure.sensors.length}</label>
                                    <select className='selec' name="sensor" >
                                        {/* Map passando por todos os sensores da estrutura */}
                                        {estructure.sensors.map((subitem, subindex) => {
                                            return (
                                                <option key={subindex} value={subitem.sensor_name}>{subitem.sensor_name}</option>
                                            )
                                        })}
                                    </select>
                                </td>
                                <td className='configespecial'>
                                    <button className='' data-bs-toggle="modal" data-bs-target="#InfoEstructure" onClick={() => setInfoStructure(estructure)}>
                                        <img className="max-iconEdit" src={editIcon} alt="icon edit" />
                                    </button>
                                </td>
                                {/* <td>
                                    <button className='btnDel' data-bs-toggle="modal" data-bs-target="#DelEstructure" onClick={() => setChosenStructure(estructure)}>
                                        <img className="icon" src={iconDel} alt="iconEdit" />
                                    </button>
                                </td> */}
                            </tr>
                        )
                    })}
                </tbody>

            </table>

            <div className="modal fade" tabIndex="-1" id="InfoEstructure" role='dialog'>
                <div key={infoStructure.id} className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title modalTitle">Modificar Estrutura</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">

                            <div className="container">

                                <form onSubmit={handleSubmitUpdateStructure}>
                                    <div className="mb-3">
                                        <label className="form-label">Nome da estrutura:</label>
                                        <input maxLength="45" defaultValue={infoStructure.structure_name} type="text" className="form-control" onChange={handleInputUpdateStructure} name="structure_name" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Localização da estrutura:</label>
                                        <input maxLength="45" defaultValue={infoStructure.structure_location} type="text" className="form-control" onChange={handleInputUpdateStructure} name="structure_location"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Frequencia de Inspeção:</label>
                                        <input maxLength="45" defaultValue={infoStructure.inspection_frequency} type="text" className="form-control" onChange={handleInputUpdateStructure} name="inspection_frequency"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Documento Construido:</label>
                                        <input maxLength="45" defaultValue={infoStructure.as_built_document} type="text" className="form-control" onChange={handleInputUpdateStructure} name="as_built_document"/>
                                    </div>
                                    <div className='mb-3 text-center'>
                                        <input className="btnn" type="submit" value='Atualizar' />
                                    </div>
                                </form>
                                <div className='text-center'>
                                    <button className='btnn max-deleteuser' data-bs-toggle="modal" data-bs-target="#DelStructure">Deletar estrutura</button>
                                </div>
                            </div>
                            
                        </div>

                    </div>
                </div>
            </div>

            <AttentionMessage id="DelStructure" title="Atenção" message="Confirmando esta operação, você não conseguirá recuperar as informações deletadas." funcao={deleteStructureSelect} />
            <ErrorMessage title={"Erro ao deletar estrutura"} id={"errorDeleteStructure"} message={"Erro ao deletar estrutura. Verifique as informações e tente novamente."}/>

            <Message message={"Estrutura deletada com sucesso!"} visible={showDeleteSensorSuccess}/>
            <Message message={"Estrutura atualizada com sucesso!"} visible={showUpdateSensorSuccess}/>

        </>
    )
}

export default ListStructure;