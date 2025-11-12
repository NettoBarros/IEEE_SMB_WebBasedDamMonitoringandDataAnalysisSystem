import React, { useState, useEffect } from 'react';
import editIcon from '../listUser/icon/edit-text.png'

import getThresholds from "../../services/requisicoes/nesaApi/getThresholds";
import getSensors from '../../services/requisicoes/nesaApi/getSensors';
import getStructures from '../../services/requisicoes/nesaApi/getStructures';
import patchThreshold from '../../services/requisicoes/nesaApi/patchThreshold';
import deleteThreshold from '../../services/requisicoes/nesaApi/deleteThreshold';

import AttentionMessage from '../attentionMessage/AttentionMessage';
import Message from '../message/Message';
import ErrorMessage from '../errorMessage/ErrorMessage';
// import iconNotice from '../../assets/icons/notice.png'
// import Modal from '../../components/Modal/modal'

function ListThreshold({newThresholdUpdate}) {

    const [thresholds = [], setThresholds] = useState()
    const [infoThreshold = [], setInfoThreshold] = useState()
    const [patchThresholdd, setPatchThresholdd] = useState()
    const [showDeleteThresholdSuccess, setShowDeleteThresholdSuccess] = useState(false)
    const [showUpdateThresholdSuccess, setShowUpdateThresholdSuccess] = useState(false)
    const [updateThresholdList, setUpdateThresholdList] = useState(false)
    const [sensors, setSensors] = useState([{id: 0, sensor_name: '', sensor_model: '', latitude: 0, longitude: 0}])
    const [structures, setStructures] = useState([])
    
    
    useEffect(() => {
        const token = localStorage.getItem('JWT');

        if (!token) {
            return;
        }
        getSensors().then((response) => {
            setSensors(response.data)
        })
        getStructures().then((response) => {
            setStructures(response.data)
        })
        getThresholds().then((response) => {
            setThresholds(response.data.sort((a, b) => a.id - b.id))
        })
    }, [newThresholdUpdate ,updateThresholdList])

    const handleInputUpdateThreshold = (event) =>{
        setPatchThresholdd({...patchThreshold, [event.target.name]: event.target.value})
    }

    function handleSubmitUpdateThreshold(e){
        e.preventDefault()
        patchThreshold(patchThresholdd, infoThreshold.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateThresholdList(!updateThresholdList);
                document.getElementById('InfoThreshold').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowUpdateThresholdSuccess(true);
                setTimeout(() => {
                    setShowUpdateThresholdSuccess(false);
                }, 3500); // 5000 milissegundos = 5 segundos
            } else {
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorUpdateThreshold').click()
            }
        })
    }

    function deleteThresholdSelect(e) {
        e.preventDefault()
        deleteThreshold(infoThreshold.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateThresholdList(!updateThresholdList);
                document.getElementById('InfoThreshold').click()
                document.getElementById('DelThreshold').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowDeleteThresholdSuccess(true);
                setTimeout(() => {
                    setShowDeleteThresholdSuccess(false);
                }, 3500); // 5000 milissegundos = 5 segundos
            } else {
                console.log("Erro ao tentar deletar estrutura.")
            }
        })
    }

    return (
        <>
            <table className="table max-table">
                <thead>
                    <tr>
                        <th scope="col">Nº</th>
                        <th scope="col">ESTRUTURA</th>
                        <th scope="col">NOME DO INSTRUMENTO</th>
                        <th scope="col">DIREÇÃO/SAÍDA</th>
                        <th className='text-center' scope="col">LIMIAR DE ATENÇÃO</th>
                        <th className='text-center' scope="col">LIMIAR DE ALERTA</th>

                        <th scope="col"></th>
                    </tr>
                </thead>
                
                <tbody>
                    {thresholds.map((threshold, index) => {
                        return (
                            <tr key={index}>
                                <td>{threshold.id}</td>
                                <td>{structures.find((structure) => structure.id === sensors.find((sensor) => sensor.id === threshold.sensor)?.structure)?.structure_name}</td>
                                <td>{sensors.find((sensor) => sensor.id === threshold.sensor)?.sensor_name}</td>
                                <td>{threshold.exit_direction}</td>
                                <td className='text-center'>{threshold.attention_threshold}</td>
                                <td className='text-center'>{threshold.alert_threshold}</td>

                                <td className='configespecial'>
                                    <button className='' data-bs-toggle="modal" data-bs-target="#InfoThreshold" onClick={() => setInfoThreshold(threshold)}>
                                        <img className="max-iconEdit" src={editIcon} alt="icon edit" />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>

            </table>

            <div className="modal fade" tabIndex="-1" id="InfoThreshold" role='dialog'>
                <div key={infoThreshold.id} className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title modalTitle">Modificar Limiar</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>

                        <div className="modal-body">

                            <div className="container">

                                <form onSubmit={handleSubmitUpdateThreshold}>
                                    <div className="mb-3">
                                        <label className="form-label">Nome do instrumento:</label>
                                        <input maxLength="45" defaultValue={sensors.find((sensor) => sensor.id === infoThreshold.sensor)?.sensor_name} type="value" className="form-control pe-none" />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Direção/saída:</label>
                                        <input maxLength="45" defaultValue={infoThreshold.exit_direction} type="text" className="form-control pe-none"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Limiar de atenção:</label>
                                        <input maxLength="45" defaultValue={infoThreshold.attention_threshold} type="number" step="0.01" className="form-control" onChange={handleInputUpdateThreshold} name="attention_threshold"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Limiar de alerta:</label>
                                        <input maxLength="45" defaultValue={infoThreshold.alert_threshold} type="number" step="0.01" className="form-control" onChange={handleInputUpdateThreshold} name="alert_threshold"/>
                                    </div>
                                    <div className='mb-3 text-center'>
                                        <input className="btnn" type="submit" value='Atualizar' />
                                    </div>
                                </form>
                                <div className='text-center'>
                                    <button className='btnn max-deleteuser' data-bs-toggle="modal" data-bs-target="#DelThreshold">Deletar limiar</button>
                                </div>
                            </div>
                            
                        </div>

                    </div>
                </div>
            </div>

            <AttentionMessage id="DelThreshold" title="Atenção" message="Confirmando esta operação, você não conseguirá recuperar as informações deletadas." funcao={deleteThresholdSelect} />
            <ErrorMessage title={"Erro ao atualizar limiar"} id={"errorUpdateThreshold"} message={"Erro ao tentar atualizar limiar. Verifique as informações e tente novamente."}/>

            <Message message={"Limiar deletado com sucesso!"} visible={showDeleteThresholdSuccess}/>
            <Message message={"Limiar atualizado com sucesso!"} visible={showUpdateThresholdSuccess}/>

        </>
    )
}

export default ListThreshold;