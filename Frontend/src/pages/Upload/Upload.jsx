import React, { useState } from "react";
import './upload.css'
import api from '../../services/api'
import * as ReactBootStrap from 'react-bootstrap'
//import { useNavigate } from "react-router-dom";
import '../../components/Botao/button.css'

function Upload() {
    const [file, setImage] = useState('');
    const [sendingPDF, setSendingPDF] = useState(false)
    /**const navigate = useNavigate()**/

    const uploadImage = async e => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('pdf', file);
        setSendingPDF(true)
        await api.post('nesa/upload_pdf', formData, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        })
            .then((response) => {
                setSendingPDF(false)
                alert("PDF enviado com sucesso!")
            })
            .catch(() => {
                setSendingPDF(false)
                alert("Selecione um arquivo válido!")
            })
    }

    return (
        <div>
            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#exampleModal">
                Importar PDFs
            </button>

            <div class="modal fade " id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h1 class="modal-title fs-5" id="exampleModalLabel">Filtro</h1>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div className="fundo">
                                <h1 className="edit-text">Upload</h1>

                                <div className="btn-container">

                                    <form className="edit" onSubmit={uploadImage}>
                                        <label className="dentro">Escolha o PDF: </label>
                                        <input className="dentro" type="file" name="image" onChange={e => setImage(e.target.files[0])} /> <br /><br />

                                        {!sendingPDF ? <button className="salv" type="submit">Salvar</button> : <ReactBootStrap.Spinner className="spinner" animation="border" />}
                                    </form>

                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Sair</button>
                            <button type="button" class="btn btn-primary">Salvar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>


    )
}

export default Upload;