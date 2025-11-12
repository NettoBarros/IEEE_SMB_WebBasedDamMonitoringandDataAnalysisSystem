import React from 'react';
import iconNotice from '../../assets/icons/notice.png'
import './AttentionMessage.css';

const AttentionMessage = ({id, title, message, funcao}) => {
  
  return (
    <div className="modal fade" tabIndex="-1" id={id}>
      <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
              <div className="modal-header max-attentionModalHeader">
                  <img src={iconNotice} alt="Notice" />
                  <h5 className="modal-title">{title}</h5>
                  <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                  <div className=''>{message}</div>
              </div>
              <div className="modal-footer">
                  <button type="button" className="btn btn-cancelar" data-bs-dismiss="modal">Cancelar</button>
                  <button type="button" className="btn btn-confirmar" onClick={funcao} >Confirmar</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AttentionMessage;
