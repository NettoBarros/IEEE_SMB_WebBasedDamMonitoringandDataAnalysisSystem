import React, { useState } from "react";
import api from '../../services/api'
//import { useNavigate } from "react-router-dom";
import './Modal.css'
import * as ReactBootStrap from 'react-bootstrap'
import DropdownBarragem from "../forms/DropdownBarragem/dropdownBarragem";
import Message from "../message/Message";

function ModalNov() {
    const [file, setImage] = useState('');
    const [sendingPDF, setSendingPDF] = useState(false)
    const [structureId, setStructureId] = useState(false)

    const [messageSucess, setMessageSucess] = useState(false)
    const [messageError, setMessageError] = useState(false)
    //const navigate = useNavigate()

    const uploadImage = async e => {
        e.preventDefault();
        if (!structureId) {
            alert("Você deve selecionar uma barragem!")
            return false
        }
        const formData = new FormData();
        formData.append('pdf', file);
        formData.append('structure_id', structureId)
        setSendingPDF(true)
        await api.post('nesa/upload_pdf', formData, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        })
            .then((response) => {
                setSendingPDF(false)
                document.getElementById('ModalImportPDFs').click()
                setMessageSucess(true)
                setTimeout(() => {
                    setMessageSucess(false)
                }, 3000)
            })
            .catch((err) => {
                console.log('Erro: ' + err)
                setSendingPDF(false)
                setMessageError(true)
                setTimeout(() => {
                    setMessageError(false)
                }, 3000)
            })
    }


    return (
        <div>
            <div>
                <button type="button" className="btn btn-save" data-bs-toggle="modal" data-bs-target="#ModalImportPDFs">
                    Importar PDF's
                </button>

                <div className="modal" id="ModalImportPDFs" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content max-modalCadastro">
                            <div className="modal-header">
                                <h1 className="modal-title fs-5" id="exampleModalLabel">Importar PDFs</h1>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div className="modal-body body">
                                <div className="btn-container" >
                                    <div className="body">
                                        <DropdownBarragem setValue={setStructureId} />
                                    </div>
                                    <div className="body boxUploud">
                                        <form className="edit" onSubmit={uploadImage}>
                                            <label className="texto">Escolha o PDF: </label>
                                            <input className="dentro" type="file" name="image" onChange={e => setImage(e.target.files[0])} />

                                        </form>
                                    </div>
                                </div>
                            </div>
                            {!sendingPDF ?
                                <div className="footer">
                                    {/* <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Sair</button> */}
                                    <button type="button" className="btnn" onClick={uploadImage}>Enviar</button>
                                </div>
                                : <div className="spinner-div">
                                    <ReactBootStrap.Spinner animation="border" />
                                </div>}
                        </div>
                    </div>
                </div>
            </div>

            <Message message="PDF enviado com sucesso!" visible={messageSucess} />
            <Message message="Selecione um arquivo válido!" typeMessage="danger" visible={messageError} />

        </div >
    )
}

export default ModalNov;