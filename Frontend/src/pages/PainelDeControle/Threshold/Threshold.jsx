import React, { useEffect, useState} from 'react';
import postThreshold from "../../../services/requisicoes/nesaApi/postThreshold";
import ListThreshold from '../../../components/listThreshold/listThreshold';
import Message from '../../../components/message/Message';
import ErrorMessage from '../../../components/errorMessage/ErrorMessage';
import getSensors from '../../../services/requisicoes/nesaApi/getSensors';
import getStructures from '../../../services/requisicoes/nesaApi/getStructures';
import getExitDirections from '../../../services/requisicoes/nesaApi/getExitDirections';

import './Threshold.css'

function Threshold() {
    
    const [postThresholdd, setPostThresholdd] = useState({})
    const [showCreateThresholdSuccess, setShowCreateThresholdSuccess] = useState(false);
    const [submitThresholdComplete, setSubmitThresholdComplete] = useState(false);
    const [structures, setStructures] = useState([]);
    const [structureId, setStructureId] = useState();
    const [sensors, setSensors] = useState([]);
    const [exitDirections, setExitDirections] = useState([]);

    // Recebe os valores do forms e coloca dentro de "postStruct"
    const handleInputThreshold = (event) =>{
        setPostThresholdd({...postThresholdd, [event.target.name]: event.target.value})
        if (event.target.name === "sensor") {
            if (event.target.value === "") {
                setExitDirections([])
                return
            }
            getExitDirections(parseInt(event.target.value)).then((response) => {
                setExitDirections(response.data.resultado)
            })
        }
    }

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        getStructures().then((response) => {
            setStructures(response.data)
        })
        getSensors().then((response) => {
            setSensors(response.data)
        })
    }, [])


    // Pega os valores dentro de "postStruct" e passa para a rota "postThresholds"
    function handleSubmitThreshold(event){
        event.preventDefault()
        postThreshold(postThresholdd)
        .then((response) => {
            if (response.status === 200) {
                setSubmitThresholdComplete(!submitThresholdComplete);
                document.getElementById('NewThreshold').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowCreateThresholdSuccess(true);
                setTimeout(() => {
                    setShowCreateThresholdSuccess(false);
                }, 3500);
            } else {
                console.log(response)
                // Chamada mal-sucedida, exibir mensagem de erro
                document.getElementById('errorCreateThreshold').click()
            }
        })
    }


    return (
        <div className='pcUser-container'>
            <div className='pcUser-bloco'>
                <header className='max-header'>
                    <h1>Lista de limiares</h1>
                    <button id='max-newStrutureButton' data-bs-toggle="modal" data-bs-target="#NewThreshold">Novo Limiar</button>
                </header>
                <ListThreshold newThresholdUpdate={submitThresholdComplete} />
            </div>

            {/* Modal de adicionar nova estrutura */}
            <div className="modal fade" tabIndex="-1" id="NewThreshold">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title">Novo Limiar</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className=''>

                                <div className="container">

                                <form onSubmit={handleSubmitThreshold}>
                                    <div className="mb-3">
                                        <label className="form-label">Estrutura:</label>
                                        <select className="form-control max-inputSelect" onChange={(e) => setStructureId(e.target.value)}>
                                            <option value="">Selecione a estrutura</option>
                                            {structures.map((structure) => {
                                                return (
                                                    <option key={structure.id} value={structure.id}>{structure.structure_name}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Nome do instrumento:</label>
                                        <select className="form-control max-inputSelect" onChange={handleInputThreshold} name="sensor">
                                            <option value="">Selecione o instrumento</option>
                                            {sensors.map((sensor) => (
                                                sensor.structure === parseInt(structureId) ? (
                                                    <option key={sensor.id} value={sensor.id}>{sensor.sensor_name}</option>
                                                ) : null
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Direção/saída:</label>
                                        <select className="form-control max-inputSelect" onChange={handleInputThreshold} name="exit_direction">
                                            <option value="">Selecione a direção/saída</option>
                                            {exitDirections.map((exitDirection, index) => (
                                                <option key={index} value={exitDirection}>{exitDirection}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Limiar de atenção:</label>
                                        <input required maxLength="45" type="number" step="0.01" className="form-control" onChange={handleInputThreshold} name="attention_threshold"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Limiar de alerta:</label>
                                        <input required maxLength="45" type="number" step="0.01" className="form-control" onChange={handleInputThreshold} name="alert_threshold"/>
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

            <ErrorMessage title={"Erro ao criar limiar"} id={"errorCreateThreshold"} message={"Erro ao criar limiar. Verifique as informações e tente novamente."}/>
            <Message message={"Limiar criada com sucesso!"} visible={showCreateThresholdSuccess}/>
        </div>
    )
}

export default Threshold;