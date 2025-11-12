import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as ReactBootStrap from 'react-bootstrap'
import Select from 'react-select';

import api from '../../services/api';

import uploadIcon from './imgs/uploadIcon.png'
import loupeIcon from './imgs/lupa1.png'
import deleteIcon from '../listUser/icon/deleteIcon.png'
import sortIcon from './imgs/ordenar.png'
import filterIcon from './imgs/filtro.png'


import getStructures from '../../services/requisicoes/nesaApi/getStructures';
import getVisualInspection from "../../services/requisicoes/nesaApi/getVisualInspections";
import deleteInspection from '../../services/requisicoes/nesaApi/deleteInspection';

import AttentionMessage from '../attentionMessage/AttentionMessage';
import Message from '../message/Message';
import ErrorMessage from '../errorMessage/ErrorMessage';

function ListInspection({newInspectionUpdate}) {
    
    const navigate = useNavigate();

    const [inspections = [], setInspections] = useState()
    const [structures, setStructures] = useState([])
    const [uploadImage, setUploadImage] = useState([])
    const [ortomosaico, setOrtomosaico] = useState('');
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');

    const [infoInspection = [], setInfoInspection] = useState()
    const [showDeleteInspectionSuccess, setShowDeleteInspectionSuccess] = useState(false)
    const [showUploadInspectionSuccess, setShowUploadInspectionSuccess] = useState(false)
    const [updateInspectionList, setUpdateInspectionList] = useState(false)
    const [uploadInProgress, setUploadInProgress] = useState(true)

    // Adicione um novo estado para armazenar a estrutura selecionada
    const [selectedStructure, setSelectedStructure] = useState({ value: null, label: "Todas" });

    // Adicione uma função para lidar com a mudança na seleção da estrutura
    const handleStructureChange = (selectedOption) => {
        setSelectedStructure(selectedOption || { value: null, label: "Todas" });
        console.log(selectedOption.label)
    };
    
    
    useEffect(() => {
        const token = localStorage.getItem('JWT');

        if (!token) {
            return;
        }
        getVisualInspection().then((response) => {
            setInspections(response.data.sort((a, b) => a.id - b.id))
        })
    }, [newInspectionUpdate ,updateInspectionList])
    
    useEffect(() => {
        const token = localStorage.getItem('JWT');

        if (!token) {
            return;
        }
        getStructures().then((response) => {
            setStructures(response.data)
        })
    }, [])

    const uploadImageInspection = async event => {
        event.preventDefault()
        const formData = new FormData();
        formData.append('orthoimage', ortomosaico);
        formData.append('id_update', uploadImage)
        setUploadInProgress(false)
        await api.post('nesa/upload_orthoimage', formData, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        })
            .then((response) => {
                if (response.status === 200) {
                    setUploadInProgress(true)
                    setUpdateInspectionList(!updateInspectionList);
                    document.getElementById('uploadModal').click()
                    // Chamada bem-sucedida, exibir mensagem de sucesso
                    setShowUploadInspectionSuccess(true);
                    setTimeout(() => {
                        setShowUploadInspectionSuccess(false);
                    }, 3500);
                    setUploadImage('')
                    setOrtomosaico(null);
                    document.querySelector('.form-control').value = null;
                } else {
                    console.log(response)
                }
            })
            .catch((err) => {
                console.log('Erro: ' + err)
                document.getElementById('errorUpdateOrtomosaico').click()
            })
    }

    function deleteInspectionSelect(e) {
        e.preventDefault()
        deleteInspection(infoInspection.id)
        .then((response) => {
            if (response.status === 200) {
                setUpdateInspectionList(!updateInspectionList);
                document.getElementById('DelInspection').click()
              // Chamada bem-sucedida, exibir mensagem de sucesso
                setShowDeleteInspectionSuccess(true);
                setTimeout(() => {
                    setShowDeleteInspectionSuccess(false);
                }, 3500); // 5000 milissegundos = 5 segundos
            } else {
                console.log("Erro ao tentar deletar estrutura.")
            }
        })
    }

    const sortInspections = (field) => {
        let sortedInspections;
        if (field === 'structure') {
            sortedInspections = [...inspections].sort((a, b) => {
                const structureA = structures.find((structure) => structure.id === a.structure)?.structure_name || '';
                const structureB = structures.find((structure) => structure.id === b.structure)?.structure_name || '';
                if (structureA < structureB) return sortDirection === 'asc' ? -1 : 1;
                if (structureA > structureB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        } else if (field === 'inspection_date') {
            sortedInspections = [...inspections].sort((a, b) => {
                const dateA = new Date(a.inspection_date);
                const dateB = new Date(b.inspection_date);
                return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
            });
        } else if (field === 'time') {
            sortedInspections = [...inspections].sort((a, b) => {
                const timeA = new Date(a.inspection_date).getTime();
                const timeB = new Date(b.inspection_date).getTime();
                return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
            });
        }else {
            sortedInspections = [...inspections].sort((a, b) => {
                if (a[field] < b[field]) return sortDirection === 'asc' ? -1 : 1;
                if (a[field] > b[field]) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
    
        setInspections(sortedInspections);
        setSortField(field);
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    };

    return (
        <>
            <table className="table max-table">
                <thead>
                    <tr>
                        <th scope="col">ID <img onClick={() => sortInspections('id')} className="max-iconEdit" src={sortIcon} alt="icone para ordenar" style={{ cursor: 'pointer' }} /></th>
                        <th scope="col">INSPETOR <img onClick={() => sortInspections('inspector_in_charge')} className="max-iconEdit" src={sortIcon} alt="icone para ordenar" style={{ cursor: 'pointer' }} /></th>
                        <th scope="col">ESTRUTURA <img onClick={() => sortInspections('structure')} className="max-iconEdit" src={sortIcon} alt="icone para ordenar" style={{ cursor: 'pointer' }} /></th>
                        <th scope="col">DATA <img onClick={() => sortInspections('inspection_date')} className="max-iconEdit" src={sortIcon} alt="icone para ordenar" style={{ cursor: 'pointer' }} /></th>
                        <th scope="col">HORÁRIO <img onClick={() => sortInspections('time')} className="max-iconEdit" src={sortIcon} alt="icone para ordenar" style={{ cursor: 'pointer' }} /></th>
                        <th scope="col" colSpan="4"> {/* Adicione a propriedade colSpan aqui */}
                            <div className='d-flex'>
                            <img className="max-iconEdit align-self-center" src={filterIcon} alt="icone para filtrar" />
                            <Select 
                                value={selectedStructure}
                                onChange={handleStructureChange}
                                styles={{ 
                                    container: (provided) => ({ 
                                        ...provided, 
                                        width: '100%' 
                                    }),
                                    control: (styles) => ({ 
                                        ...styles, 
                                        backgroundColor: 'transparent', // Remove o fundo
                                        color: '#055E67', // Altera a cor da letra para azul
                                        borderRadius: 'none', // Remove a borda
                                        marginRight: '-6px' // Adiciona um espaçamento à direita
                                    }),
                                    singleValue: (styles) => ({
                                        ...styles,
                                        color: '#055E67', // Altera a cor da letra para azul
                                        fontSize: '1.0rem' // Altera o tamanho da letra
                                    }),
                                }}
                                options={[
                                    { value: null, label: 'Todas' },
                                    ...structures
                                        .filter((structure) => inspections.find((inspection) => inspection.structure === structure.id) !== undefined)
                                        .map((structure) => ({
                                            value: structure.id,
                                            label: structure.structure_name
                                        }))
                                ]}
                            />
                            </div>
                        </th>
                    </tr>
                </thead>
                
                <tbody>
                    {inspections
                        .filter((inspection) => selectedStructure.value === null || Number(inspection.structure) === Number(selectedStructure.value))
                        .map((inspection, index) => {
                        const date = new Date(inspection.inspection_date);
                        const dateString = date.toLocaleDateString();
                        const timeString = date.toLocaleTimeString();
                        return (
                            <tr key={index}>
                                <td>{inspection.id}</td>
                                <td>{inspection.inspector_in_charge}</td>
                                <td>{structures.find((structure) => structure.id === inspection.structure)?.structure_name   }</td>
                                <td>{dateString}</td>
                                <td>{timeString}</td>
                                <td></td>

                                <td className='configespecial'>
                                    {inspection.images === "" ? (
                                        <button className='' data-bs-toggle="modal" data-bs-target="#uploadModal" onClick={() => setUploadImage(inspection.id)}>
                                            <img className="max-iconEdit" src={uploadIcon} alt="icon edit" />
                                        </button>
                                    ) : null}
                                </td>

                                <td className='configespecial'>
                                    <button className='' onClick={() => navigate(`/Inspection/View/${inspection.id}`)}>
                                        <img className="max-iconEdit" src={loupeIcon} alt="View inpection" />
                                    </button>
                                </td>

                                <td className='configespecial'>
                                    <button className='' data-bs-toggle="modal" data-bs-target="#DelInspection" onClick={() => setInfoInspection(inspection)}>
                                        <img className="max-iconEdit" src={deleteIcon} alt="icon edit" />
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>

            </table>

            <div className="modal fade" id="uploadModal" tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-dialog-centered" role="document">
                <div className="modal-content">
                    <div className="modal-body">
                        <div className="modal-header">
                            <h4 className="modal-title">Upload de Ortomosaico</h4>
                        </div>
                        <h5 className="mt-3">ID da inspeção: {uploadImage}</h5>
                        <div className='boxUploud'>
                            <input type="file" className="form-control" onChange={e => setOrtomosaico(e.target.files[0])}/>
                        </div>
                    </div>
                    {uploadInProgress?
                    <div className="text-center mb-3">
                        <button type="button" className="btnn" onClick={uploadImageInspection}>Enviar</button>
                    </div>
                    : <div className="spinner-div">
                    <ReactBootStrap.Spinner animation="border" />
                    </div>}
                </div>
            </div>
            </div>

            <AttentionMessage id="DelInspection" title="Atenção" message="Confirmando esta operação, você não conseguirá recuperar as informações deletadas." funcao={deleteInspectionSelect} />
            <ErrorMessage title={"Erro ao enviar ortomosaico!"} id={"errorUploadOrtomosaico"} message={"Erro ao tentar atualizar limiar. Verifique as informações e tente novamente."}/>

            <Message message={"Inspeção deletada com sucesso!"} visible={showDeleteInspectionSuccess}/>
            <Message message={"Ortomosaico enviado com sucesso!"} visible={showUploadInspectionSuccess}/>

        </>
    )
}

export default ListInspection;