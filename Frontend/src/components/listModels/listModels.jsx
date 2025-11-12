import React, { useState, useEffect } from 'react';
import deleteIcon from '../listUser/icon/deleteIcon.png'

import getModels from "../../services/requisicoes/nesaApi/getModels";
import deleteModel from "../../services/requisicoes/nesaApi/deleteModel";

import AttentionMessage from '../attentionMessage/AttentionMessage';
import Message from '../message/Message';
import ErrorMessage from '../errorMessage/ErrorMessage';


function ListModels() {

    const [models = [], setModels] = useState()
    const [infoModel = [], setInfoModel] = useState()
    const [showDeleteModelSuccess, setShowDeleteModelSuccess] = useState(false)
    const [updateModelList, setUpdateModelList] = useState(false)
    
    
    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getModels().then((response) => {
            setModels(response.data)
        })
    }, [updateModelList])

    function deleteModelSelect(e) {
        e.preventDefault()
        deleteModel(infoModel.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateModelList(!updateModelList);
                document.getElementById('DelModel').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowDeleteModelSuccess(true);
                setTimeout(() => {
                    setShowDeleteModelSuccess(false);
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
                        <th scope="col">ESTRUTURA</th>
                        <th scope="col">SENSOR</th>
                        <th scope="col">DATA INICIAL</th>
                        <th scope="col">DATA FINAL</th>
                        <th scope="col">USUÁRIO CRIADOR</th>
                        <th scope="col">TIMESTAMP</th>
                        {/* <th className='text-center' scope="col">INSTRUMENTOS</th> */}
                        <th scope="col"></th>
                    </tr>
                </thead>
                
                <tbody>
                    {models.map((model, index) => {
                        const date = new Date(model.timestamp)
                        // O horário está vindo com 3 horas a mais, por isso a subtração
                        date.setHours(date.getHours() - 3);
                        return (
                            <tr key={index}>
                                <td>{model.structure.structure_name}</td>
                                <td>{model.sensor.sensor_name}</td>
                                <td>{model.initial_date}</td>
                                <td>{model.final_date}</td>
                                <td>{model.user.first_name} {model.user.last_name}</td>
                                <td>{date.toLocaleString()}</td>
                                <td className='configespecial'>
                                    <button className='' data-bs-toggle="modal" data-bs-target="#DelModel" onClick={() => setInfoModel(model)}>
                                        <img className="max-iconEdit" src={deleteIcon} alt="icon edit" />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>

            </table>


            <AttentionMessage id="DelModel" title="Atenção" message="Confirmando esta operação, você não conseguirá recuperar as informações deletadas." funcao={deleteModelSelect} />
            <ErrorMessage title={"Erro ao deletar modelo"} id={"errorDeleteModel"} message={"Erro ao deletar modelo. Verifique as informações e tente novamente."}/>

            <Message message={"Modelo deletado com sucesso!"} visible={showDeleteModelSuccess}/>

        </>
    )
}

export default ListModels;