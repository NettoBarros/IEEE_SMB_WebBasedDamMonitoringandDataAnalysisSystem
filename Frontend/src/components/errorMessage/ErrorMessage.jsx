import React from 'react';
import iconNotice from '../../assets/icons/notice.png'
import './ErrorMessage.css';

const ErrorMessage = ({id, title, message}) => {
  
  return (
    <>
      <button id={id} type="button" className="d-none" data-bs-toggle="modal" data-bs-target={`#${id}Modal`}>
          Abrir Modal de Erro
      </button>

    <div className="modal fade" data-backdrop="false" tabIndex="-1" id={`${id}Modal`}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
              <div className="modal-header max-errorModalHeader">
                  <img src={iconNotice} alt="Notice" />
                  <h5 className="modal-title">{title}</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                  <div className=''>{message}</div>
              </div>
              <div className="modal-footer">
                  <button id='max-modalErroButton' type="button" className="btn btn-cancelar" data-bs-dismiss="modal">Fechar</button>
              </div>
          </div>
      </div>
    </div>
    </>
  );
};

export default ErrorMessage;
