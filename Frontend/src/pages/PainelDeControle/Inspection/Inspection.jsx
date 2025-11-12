import React, { useEffect, useState} from 'react';
import * as ReactBootStrap from 'react-bootstrap'

import api from '../../../services/api'
import ErrorMessage from '../../../components/errorMessage/ErrorMessage';
import Message from '../../../components/message/Message';
import ListInspection from '../../../components/listInspection/listInspection';

import getUsers from '../../../services/requisicoes/nesaApi/getUsers';
import getStructures from '../../../services/requisicoes/nesaApi/getStructures';
import getAuthenticated from '../../../services/requisicoes/nesaApi/authenticated';

import './Inspection.css'

function Inspection() {
    
    const [showCreateInspectionSuccess, setShowCreateInspectionSuccess] = useState(false);
    const [postInspection, setPostInspection] = useState({})
    const [ortomosaico, setOrtomosaico] = useState('');

    const [submitInspectionComplete, setSubmitInspectionComplete] = useState(false);
    const [structures, setStructures] = useState([]);
    const [structureId, setStructureId] = useState();
    const [users, setUsers] = useState([]);
    const [inspectorInCharge, setInspectorInCharge] = useState("");
    const [inspectionProgress, setInspectionProgress] = useState(true);

    // Recebe os valores do forms e coloca dentro de "postInspection"
    const handleInputInspection = (event) =>{
        setPostInspection({...postInspection, [event.target.name]: event.target.value})
        if (event.target.name === 'inspector_in_charge') {
            setInspectorInCharge(event.target.value);
        }
    }

    useEffect(() => {
        getStructures().then((response) => {
            setStructures(response.data)
        })
        getUsers().then((response) => {
            setUsers(response.data)
        })
        getAuthenticated().then((response) => {
            setInspectorInCharge(response.data.first_name + " " + response.data.last_name)
            setPostInspection({...postInspection, inspector_in_charge: response.data.first_name + " " + response.data.last_name})
        })
    }, [])


    // Pega os valores dentro de "postStruct" e passa para a rota "postInspections"
    const handleSubmitInspection = async event => {
        event.preventDefault()
        const formData = new FormData();
        // const dateTimee = postInspection.date + ' ' + postInspection.time
        const dateParts = postInspection.date.split("-");
        const timeParts = postInspection.time.split(":");
        
        const dateTime = new Date(dateParts[0], dateParts[1] - 1, dateParts[2], timeParts[0], timeParts[1]);
        const isoDateTime = dateTime.toISOString();
        formData.append('orthoimage', ortomosaico);
        formData.append('inspection_date', isoDateTime)
        formData.append('inspector_in_charge', postInspection.inspector_in_charge)
        formData.append('observations', postInspection.observations)
        formData.append('structure', structureId)
        formData.append('user', 1)
        formData.append('inspection_type', '')
        formData.append('uav', '')

        setInspectionProgress(false)


        await api.post('nesa/upload_orthoimage', formData, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        })
            .then((response) => {
                if (response.status === 200) {
                    setSubmitInspectionComplete(!submitInspectionComplete);
                    document.getElementById('NewInspection').click()
                    setInspectionProgress(true)
                // Chamada bem-sucedida, exibir mensagem de sucesso
                    setShowCreateInspectionSuccess(true);
                    setTimeout(() => {
                        setShowCreateInspectionSuccess(false);
                    }, 3500);
                } else {
                    console.log(response)
                    // Chamada mal-sucedida, exibir mensagem de erro
                    document.getElementById('errorCreateInspection').click()
                }
            })
            .catch((err) => {
                console.log('Erro: ' + err)
                document.getElementById('errorCreateInspection').click()
            })
    }


    return (
        <div className='pcUser-container'>
            <div className='pcUser-bloco'>
                <header className='max-header'>
                    <h1>Lista de inspeções</h1>
                    <button id='max-newStrutureButton' data-bs-toggle="modal" data-bs-target="#NewInspection">Nova Inspeção</button>
                </header>
                <ListInspection newInspectionUpdate={submitInspectionComplete} />
            </div>

            {/* Modal de adicionar nova estrutura */}
            <div className="modal fade" tabIndex="-1" id="NewInspection">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content max-modalCadastro">
                        <div className="modal-header">
                            <h5 className="modal-title">Nova Inspeção</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div className="modal-body">
                            <div className=''>

                                <div className="container">

                                <form onSubmit={handleSubmitInspection}>
                                    <div className="mb-3">
                                        <label className="form-label">Estrutura:</label>
                                        <select className="form-control max-inputSelect" onChange={(e) => setStructureId(e.target.value)}>
                                            <option value="">Selecione a estrutura</option>
                                            {structures.map((structure) => {
                                                return (
                                                    <option key={structure.id} value={structure.strucutre_name}>{structure.structure_name}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Data:</label>
                                        <input required maxLength="45" type="date" className="form-control" onChange={handleInputInspection} name="date"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Horário:</label>
                                        <input required maxLength="45" type="time" className="form-control" onChange={handleInputInspection} name="time"/>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Inspetor Responsável:</label>
                                        <select required className="form-control max-inputSelect" value={inspectorInCharge} onChange={handleInputInspection} name="inspector_in_charge">
                                            <option value="">Selecione o inspetor</option>
                                            {users.map((user) => {
                                                return (
                                                    <option key={user.id} value={user.first_name + " " + user.last_name}>{user.first_name} {user.last_name}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Observações:</label>
                                        <textarea className='form-control' cols="51" rows="5" onChange={handleInputInspection} name="observations"></textarea>
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Ortomosaico (Pode ser carregado depois):</label>
                                        <div className='boxUploud'>
                                        <input type="file" className="form-control" onChange={e => setOrtomosaico(e.target.files[0])}/>
                                        </div>
                                    </div>
                                    
                                    {inspectionProgress ?
                                    <div className='mb-3 text-center'>
                                        <input className="btnn" type="submit" value='Adicionar' />
                                    </div>
                                    : <div className="spinner-div">
                                    <ReactBootStrap.Spinner animation="border" />
                                    </div>}

                                </form>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ErrorMessage title={"Erro ao registrar inspeção"} id={"errorCreateInspection"} message={"Erro ao registrar inspeção. Verifique as informações e tente novamente."}/>
            <Message message={"Inspeção registrada com sucesso!"} visible={showCreateInspectionSuccess}/>
        </div>
    )
}

export default Inspection;