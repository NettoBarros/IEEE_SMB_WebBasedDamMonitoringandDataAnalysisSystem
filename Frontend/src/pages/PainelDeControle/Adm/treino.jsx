import React, { useState, useEffect } from "react";
import getStructureSensor from "../../../services/requisicoes/nesaApi/getStructureSensor";
import DatePicker from "react-datepicker";
import postTrainAll from "../../../services/requisicoes/nesaApi/postTrainAll";
import postTrainSensor from "../../../services/requisicoes/nesaApi/postTrainSensor";
import iconNotice from '../../../assets/icons/notice.png'
import ErroMenssage from '../../../components/message/Message';
import * as ReactBootStrap from 'react-bootstrap'
import InputMask from 'react-input-mask';
import "./nesa.css";


export default function NesaTreino() {

  const [structures, setStructures] = useState([])
  const [sensor, setSensor] = useState([])
  const [startDate, setStartDate] = useState(new Date('01/01/2013'))
  const [finalDate, setFinalDate] = useState(new Date('01/01/2022'))
  const [startDate1, setStartDate1] = useState(new Date('01/01/2013'))
  const [finalDate1, setFinalDate1] = useState(new Date('01/01/2013'))
  const [chosenSensor, setChosenSensor] = useState()
  const [route, setRoute] = useState(null);
  const [activeStruct, setActiveStruct] = useState(false);
  const [strucChosen, setStrucChosen] = useState()
  const [activeSense, setActiveSense] = useState(false);
  const [senseChosen, setSenseChosen] = useState("")
  const [activeAll, setActiveAll] = useState(false);
  const [infoTrain, setInfoTrain] = useState({ id: null, initial_date: "", final_date: "" })
  const [sendingTrain, setSendingTrain] = useState(false)
  const [erroData, setErroData] = useState(false);
  const [dateMensagemCss, setDateMensagemCss] = useState(false);
  const [responseTrainError, setResponseTrainError] = useState(false);
  const [responseTrainSucess, setResponseTrainSucess] = useState(false);

  // Requisição GET: Pegando as estruturas do Banco de dados
  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    getStructureSensor().then((response) => {
      setStructures(response.data)
    })

  }, [])

  // Variavel que recebe as informações para treinar
  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }

    setInfoTrain({ id: chosenSensor, initial_date: startDate, final_date: finalDate })

  }, [chosenSensor, startDate, finalDate])

  function date(sd, fd) {
    setStartDate1(sd)
    setFinalDate1(fd)
  }

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    if (strucChosen !== undefined) {
      setActiveStruct(true)
    }
    setSenseChosen(null)
  }, [strucChosen])

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    if (erroData || route === null || senseChosen === null) {
      setDateMensagemCss(true)
    } else {
      setDateMensagemCss(false)
    }
  }, [erroData, route, senseChosen])

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
    if (startDate === null || finalDate === null) {
      setErroData(true);
    } else {
      if (startDate > finalDate) {
        setErroData(true);
      } else {
        setErroData(false);
      }

    }
  }, [startDate, finalDate])

  // Mudança de CSS: Quando uma estrutura é selecionada
  const buttonClass = (item) => {
    if (item === strucChosen)
      return (`optionStruct active`)
    else {
      return ('optionStruct')
    }
  }

  // Mudança de CSS: Quando um sensor é selecionado
  const buttonClassSense = (item) => {
    if (item === senseChosen)
      return (`optionStruct active`)
    else {
      return ('optionStruct')
    }
  }

  // Mudança de CSS: Quando é selecionado a opção de todos os sensores
  const buttonClassAll = () => {
    if (activeAll === true) {
      return (`optionStruct active`)
    }
    else {
      return ('optionStruct')
    }
  }

  // Função que apartir do valor de route ("1" ou "0") determina a rota de teste;
  // Obs: 1 = Teste do sensor selecionado da estrutura selecionada;
  //      2 = Teste de todos os sensores da estrutura selecionada;
  function rotaTreino(data) {
    if (route === 1) {
      postTrainSensor(data, { onResultado: statusTest, responseServer: messageStatus })
      setSendingTrain(true)
    }
    else {
      postTrainAll(data, { onResultado: statusTest, responseServer: messageStatus })
      setSendingTrain(true)
    }
  }

  function messageStatus(data) {
    document.getElementById("confirmationTrain").click()
    if (data.status === 200) {

      setResponseTrainSucess(true)

      setTimeout(() => {
        setResponseTrainSucess(false);
      }, 10000);
    } else if(data.response.status === 500) {
      setResponseTrainError(true)
      setTimeout(() => {
        setResponseTrainError(false);
      }, 20000);
    }
  }
  // Função que recebe quando o teste foi iniciado e finalizado
  function statusTest(resultado) {
    setSendingTrain(resultado)
  }


  const handleDateChange = (date, isStartDate) => {
    if (isStartDate) {
      setStartDate(date);
    } else {
      setFinalDate(date);
    }
  };

  return (
    <>
      <div className="selectionOptions">

        <div className="togetherBox">
          <div className="AllContainer">
            <div className="headerBox">ESTRUTURAS</div>
            <div className="InfoBox">
              <div className="scrolll">
                {structures.map((item, index) => (
                  <div key={index} className={buttonClass(item.structure_name)} onClick={() => { setSensor(item.sensors); setStrucChosen(item.structure_name); }}>
                    {item.structure_name}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="AllContainer">
            <div className="headerBox">INSTRUMENTOS</div>
            <div className="InfoBox">

              {!activeStruct ? (
                <h6 className="informationSense">
                  Selecione uma estrutura
                </h6>
              ) : (


                <div className="scrolll">
                  <div className={buttonClassAll()} onClick={() => {
                    setRoute(0)
                    setActiveAll(true)
                    setSenseChosen("Todos selecionados")
                  }}>
                    Selecionar todos
                  </div>
                  {sensor.map((item, index) => (
                    <div key={index} className={buttonClassSense(item.sensor_name)} onClick={() => {
                      setChosenSensor(item.id)
                      setRoute(1)
                      setActiveSense(!activeSense)
                      setActiveAll(false)
                      setSenseChosen(item.sensor_name)

                    }}>
                      {item.sensor_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="AllContainer">
            <div className="headerBox">DATA</div>
            <div className="InfoBox">
              <div className="boxDate">
                <p>Inicial</p>
                <DatePicker className="value" selected={startDate} onChange={(date) => handleDateChange(date, true)} customInput={<InputMask mask="99/99/9999" />} dateFormat={'dd/MM/yyyy'} />
              </div>

              <div className="boxDate">
                <p>Final</p>
                <DatePicker className="value" selected={finalDate} onChange={(date) => handleDateChange(date, false)} customInput={<InputMask mask="99/99/9999" />} dateFormat={'dd/MM/yyyy'} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="paddingB">
        <button className={dateMensagemCss ? "button error": "button"} data-bs-toggle="modal" data-bs-target="#confirmationTrain" onClick={() => { date(startDate, finalDate) }}> Treino </button>
      </div>

      <div className="modal" tabIndex="-1" id="confirmationTrain">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header header-modal">
              <h5 className="modal-title text-color">Atenção</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body centerModal">
              <div>
                <img className="img-notice" src={iconNotice} alt="Notice" />
              </div>
              <div className=''>
                Confirmando esta operação, estará realizando o treinamento das seguintes informações.
              </div>

              <div className="boxInputModal">
                <div className="valueModal">
                  <div className="centerInfo">
                    <div>Estrutura: </div>
                    <div>{strucChosen}</div>
                  </div>
                  <div className="centerInfo">
                    <div>Instrumentos:</div>
                    <div>{senseChosen}</div>
                  </div>

                  <div className="centerInfo">
                    <div>Data Inicial: </div>
                    <div>{String(startDate1.getDate()).padStart(2, '0')}/{String(startDate1.getMonth() + 1).padStart(2, '0')}/{String(startDate1.getFullYear())}</div>
                  </div>
                  <div className="centerInfo">
                    <div>Data Final: </div>
                    <div>{String(finalDate1.getDate()).padStart(2, '0')}/{String(finalDate1.getMonth() + 1).padStart(2, '0')}/{String(finalDate1.getFullYear())}</div>
                  </div>
                </div>
              </div>
            </div>
            {!sendingTrain ?
              <div className="footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Sair</button>
                <button type="button" className="btnn" data-bs-target="#conclusionTrain" onClick={() => { rotaTreino(infoTrain); }}>Treinar</button>
              </div>
              : <div className="spinner-div">
                <ReactBootStrap.Spinner animation="border" />
              </div>}
          </div>
        </div >
      </div >

      <ErroMenssage message="Data inicial não pode ser maior que a final" visible={erroData} typeMessage="danger" />
      <ErroMenssage message="Lamentamos, mas ocorreu um erro interno no servidor." visible={responseTrainError} typeMessage="danger" />
      <ErroMenssage message="Treino realizado com sucesso" visible={responseTrainSucess} />
    </>
  );
}
