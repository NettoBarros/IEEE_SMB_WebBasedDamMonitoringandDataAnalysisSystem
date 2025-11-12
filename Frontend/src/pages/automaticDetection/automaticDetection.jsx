import React, { useState, useEffect } from "react";
import * as ReactBootStrap from 'react-bootstrap';
import Select from 'react-select';
import getStructureSensor from "../../services/requisicoes/nesaApi/getStructureSensor";
import iconNotice from '../../assets/icons/notice.png'
import CurveChart from "../../components/charts/curveChart/CurveChart";
import ErroMenssage from '../../components/message/Message';
import iIcon from './icon/iIcon.png'
import Tooltip from "../../components/tooltip/tooltip";

import getClusterInfo from "../../services/requisicoes/nesaApi/getClusterInfo";
import getMeasurements from "../../services/requisicoes/nesaApi/getMeasurements";
import getAutomatization from "../../services/requisicoes/nesaApi/getAutomatization";
import postTesteSensor from "../../services/requisicoes/nesaApi/postTesteSensor";
import postTrainSensor from "../../services/requisicoes/nesaApi/postTrainSensor";
import getLatestMeasurements from "../../services/requisicoes/nesaApi/getLatestMeasurements";

import "./automaticDetection.css";

export default function NesaTeste() {

  const [structures, setStructures] = useState([])
  const [selectedDropdownSensor, setSelectedDropdownSensor] = useState(null);
  const [selectedDropdownSensorInfo, setSelectedDropdownSensorInfo] = useState(null)
  const [selectedDropdownSensorClusterID, setSelectedDropdownSensorClusterID] = useState(null)
  const [sensor, setSensor] = useState([])
  const [neighboringSensors, setNeighboringSensors] = useState([])
  const [targetSensor, setTargetSensor] = useState([])
  const [chosenSensor, setChosenSensor] = useState(null)
  const [activeStruct, setActiveStruct] = useState(false);
  const [strucChosen, setStrucChosen] = useState()
  const [activeSense, setActiveSense] = useState(false);
  const [senseChosen, setSenseChosen] = useState(null)
  const [infoTest, setInfoTest] = useState({ id: 0})
  const [sendingTest, setSendingTest] = useState(false)
  const [showChart, setShowChart] = useState(false)
  const [responseTestError, setResponseTestError] = useState(false);
  const [responseTestSucess, setResponseTestSucess] = useState(false);

  const [neighborCount, setNeighborCount] = useState(5);
  const [clusterInfo, setClusterInfo] = useState()
  const [latestMeasurements, setLatestMeasurements] = useState(null)
  const [latestMeasurements2, setLatestMeasurements2] = useState(null)

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
    setInfoTest({ id: chosenSensor })
    setSelectedDropdownSensor(null)
  }, [chosenSensor])

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

  // Mudança de CSS: Quando uma estrutura é selecionada
  const buttonClass = (item) => {
    if (item === strucChosen)
      return (`optionStruct active`)
    else {
      return ('optionStruct')
    }
  }

  const selectDropdownSensor = (sensor) => {
    setSelectedDropdownSensor(sensor.neighbour_id);
    setSelectedDropdownSensorInfo(sensor);

    getMeasurements(sensor.neighbour_id).then((response) => {
      getLatestMeasurements(sensor.neighbour_id,response.data.first_measurement, response.data.last_measurement).then((response) => {
        setLatestMeasurements(response.data)
      })
    })
  };

  // Mudança de CSS: Quando um sensor é selecionado
  const buttonClassSense = (item) => {
    if (item === senseChosen)
      return (`optionStruct active`)
    else {
      return ('optionStruct')
    }
  }

  function neighboringSensor(data) {
    getClusterInfo(data.id).then((response) => {
      setClusterInfo(response.data)
    })
  }

  async function rotaTeste(data) {
    try {
      setSendingTest(true)
      const response = await getAutomatization(data.id, neighborCount)
      setSelectedDropdownSensorClusterID(response.data.target_sensor.cluster)
      setNeighboringSensors(response.data.correlations)
      setTargetSensor(response.data.target_sensor)
  
      const createSensorData = async (id) => {
        const measurements = await getMeasurements(id)
        return {
          id: id,
          initial_date: new Date('2016-01-01T10:40:00').toISOString().slice(0, -1),
          final_date: measurements.data.last_measurement,
          outlier: 0.1
        }
      }
  
      const promises = response.data.correlations.map(async (sensor) => {
        const trainSensorData = await createSensorData(sensor.neighbour_id)
        const testSensorData = await createSensorData(sensor.neighbour_id)
        await postTrainSensor(trainSensorData, { onResultado: statusTest, responseServer: statusMessage })
        await postTesteSensor(testSensorData, { onResultado: statusTest, responseServer: statusMessage })
      })
  
      await Promise.all(promises)
  
      // Train and test the sensor "data.id"
      const trainSensorData = await createSensorData(data.id)
      const testSensorData = await createSensorData(data.id)
      await postTrainSensor(trainSensorData, { onResultado: statusTest, responseServer: statusMessage })
      await postTesteSensor(testSensorData, { onResultado: statusTest, responseServer: statusMessage })
  
      await getMeasurements(data.id).then((response) => {
        getLatestMeasurements(data.id,new Date('2016-01-01T10:40:00').toISOString().slice(0, -1), response.data.last_measurement).then((response) => {
          setLatestMeasurements2(response.data)
        })
      })


      statusTest(false)
      statusMessage(response)
    } catch (error) {
      console.error(error)
    }
  }

  // Função que recebe quando o teste foi iniciado e finalizado
  function statusTest(resultado) {
    setSendingTest(resultado)
  }

  function statusMessage(data) {
    document.getElementById("confirmationTest").click()
    if (data.status === 200) {

      setResponseTestSucess(true)
      if (chosenSensor !== null) setShowChart(true)
      setTimeout(() => {
        setResponseTestSucess(false);
      }, 3000);
    } else if (data.response.status === 500) {
      setResponseTestError(true)
      setTimeout(() => {
        setResponseTestError(false);
      }, 3500);
    }
  }

  return (
    <div className="pcUser-container">
    <div className="pcUser-bloco ">
      <header className="max-header">
        <h1>Detecção automática de anomalias</h1>
      </header>
    <div className="container-Treino">
      <div className="" style={{width: "100%"}}>
        <div className="togetherBox">

          <div className="AllContainer">
            <div className="headerBox">ESTRUTURAS</div>
            <div className="InfoBox">
              <div className="scrolll">
                {structures.map((item, index) => (
                  <div key={index} className={buttonClass(item.structure_name)} onClick={() => { setSensor(item.sensors); setActiveStruct(!activeStruct); setStrucChosen(item.structure_name); }}>
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
                  {sensor.map((item, index) => (
                    <div key={index} className={buttonClassSense(item.sensor_name)} onClick={() => {
                      setChosenSensor(item.id)
                      setActiveSense(!activeSense)
                      setSenseChosen(item.sensor_name)
                      setShowChart(false)
                    }}>
                      {item.sensor_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/*onClick={() => neighboringSensor(infoTest)}*/}
        <div className="paddingB">
          <button className={`button ${!chosenSensor? "buttonDesabli":""}`} onClick={() => neighboringSensor(infoTest)} data-bs-toggle="modal" data-bs-target="#confirmationTest"> EXECUTAR </button>
        </div>

        <div className="graphsMax">
          {showChart ?
            <>
            {!latestMeasurements2 ? null :
            <>
            <div className="widgets newModewilMax" style={{ width: '100%' }}>
              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Última medição</span>
                  <span className="centralLeft">
                    {new Date(latestMeasurements2.latest_measurement_date).toLocaleDateString()} {new Date(latestMeasurements2.latest_measurement_date).toLocaleTimeString()}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresenta-se a data e hora da última medição cadastrada no sistema.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={`latestInfo newModelMax ${latestMeasurements2.latest_project_attention_date !== 0 || latestMeasurements2.latest_attention_date !== 0 ? 'attention-color' : ''}`}>
                <div className="left">
                  <span className="upperLeft">Última atenção</span>
                  <span className="centralLeft">
                  {latestMeasurements2.latest_project_attention_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span> {new Date(latestMeasurements2.latest_project_attention_date).toLocaleDateString()} {new Date(latestMeasurements2.latest_project_attention_date).toLocaleTimeString()}</p>}
                  {latestMeasurements2.latest_attention_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span> {new Date(latestMeasurements2.latest_attention_date).toLocaleDateString()} {new Date(latestMeasurements2.latest_attention_date).toLocaleTimeString()}</p>}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresentam-se as datas e horas das últimas medições em estado de atenção, considerando o limiar de 'Projeto' (advindos do SYSDAM) e o limiar de 'IA', oriundos do modelo computacional inteligente.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={`latestInfo newModelMax ${latestMeasurements2.latest_project_alert_date !== 0 || latestMeasurements2.latest_alert_date !== 0 ? 'alert-color' : ''}`}>
                <div className="left">
                  <span className="upperLeft">Último alerta</span>
                  <span className="centralLeft">
                  {latestMeasurements2.latest_project_alert_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span>{new Date(latestMeasurements2.latest_project_alert_date).toLocaleDateString()} {new Date(latestMeasurements2.latest_project_alert_date).toLocaleTimeString()}</p>}
                  {latestMeasurements2.latest_alert_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span>{new Date(latestMeasurements2.latest_alert_date).toLocaleDateString()} {new Date(latestMeasurements2.latest_alert_date).toLocaleTimeString()}</p>}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresentam-se as datas e horas das últimas medições em estado de alerta, considerando o limiar de 'Projeto' (advindos do SYSDAM) e o limiar de 'IA', oriundos do modelo computacional inteligente.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

            </div>

            <div className="widgets newModewilMax" style={{ width: '100%' }}>
              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Coeficiente de correlação - Reservatório</span>
                  <span className="centralLeft">
                  {Number(targetSensor.water_correlation).toFixed(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Consiste em uma correlação linear calculada a partir do Coeficiente de Correlação de Pearson que varia entre -1 e +1. Correlações de -1 ou +1 implicam uma relação linear exata. Correlações positivas implicam que à medida que os valores do instrumento em análise aumentam, o nível do reservatório também aumenta. Correlações negativas implicam que à medida que os valores do instrumento em análise aumentam, o nível do reservatório diminui.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={`latestInfo newModelMax`}>
                <div className="left">
                  <span className="upperLeft">Valor-P - Reservatório</span>
                  <span className="centralLeft">
                    {Number(targetSensor.water_p_value).toExponential(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text='É um valor de probabilidade usado para avaliar um teste estatístico. Considerando uma hipótese nula como "as amostras não são correlacionadas", a interpretação do valor-p é dado da seguinte forma: um valor-p baixo sugere que é improvável observar uma correlação tão forte se não houver uma relação verdadeira entre as variáveis. Isto leva à rejeição da hipótese nula em favor da hipótese alternativa de que existe uma correlação. Já um valor-p alto sugere que não há evidências fortes para rejeitar a hipótese nula.'>
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

            </div>

            </>

            }

            <div style={{ width: '100%' }}>
              <CurveChart sensor_id={chosenSensor} format="pcUser-bloco cheioMax"/>
            </div>
            {selectedDropdownSensor?
            <>
            {!latestMeasurements ? null :
            <div className="widgets newModewilMax" style={{ width: '100%' }}>
              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Última medição</span>
                  <span className="centralLeft">
                  {new Date(latestMeasurements.latest_measurement_date).toLocaleDateString()} {new Date(latestMeasurements.latest_measurement_date).toLocaleTimeString()}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresenta-se a data e hora da última medição cadastrada no sistema.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={`latestInfo newModelMax ${latestMeasurements.latest_project_attention_date !== 0 || latestMeasurements.latest_attention_date !== 0 ? 'attention-color' : ''}`}>
                <div className="left">
                  <span className="upperLeft">Última atenção</span>
                  <span className="centralLeft">
                  {latestMeasurements.latest_project_attention_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span> {new Date(latestMeasurements.latest_project_attention_date).toLocaleDateString()} {new Date(latestMeasurements.latest_project_attention_date).toLocaleTimeString()}</p>}
                  {latestMeasurements.latest_attention_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span> {new Date(latestMeasurements.latest_attention_date).toLocaleDateString()} {new Date(latestMeasurements.latest_attention_date).toLocaleTimeString()}</p>}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresentam-se as datas e horas das últimas medições em estado de atenção, considerando o limiar de 'Projeto' (advindos do SYSDAM) e o limiar de 'IA', oriundos do modelo computacional inteligente.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className={`latestInfo newModelMax ${latestMeasurements.latest_project_alert_date !== 0 || latestMeasurements.latest_alert_date !== 0 ? 'alert-color' : ''}`}>
                <div className="left">
                  <span className="upperLeft">Último alerta</span>
                  <span className="centralLeft">
                  {latestMeasurements.latest_project_alert_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span>{new Date(latestMeasurements.latest_project_alert_date).toLocaleDateString()} {new Date(latestMeasurements.latest_project_alert_date).toLocaleTimeString()}</p>}
                  {latestMeasurements.latest_alert_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span>{new Date(latestMeasurements.latest_alert_date).toLocaleDateString()} {new Date(latestMeasurements.latest_alert_date).toLocaleTimeString()}</p>}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Apresentam-se as datas e horas das últimas medições em estado de alerta, considerando o limiar de 'Projeto' (advindos do SYSDAM) e o limiar de 'IA', oriundos do modelo computacional inteligente.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>
            </div>
            }

            <div className="widgets newModewilMax" style={{ width: '100%' }}>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Distância</span>
                  <span className="centralLeft">
                  {Number(selectedDropdownSensorInfo.neighbour_distance).toFixed(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Contém a distância entre o instrumento selecionado para a análise e o instrumento adjacente. Essa distância é calculada a partir da posição geográfica dos instrumentos, considerando longitude, latitude e altura.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Coeficiente de correlação</span>
                  <span className="centralLeft">
                  {Number(selectedDropdownSensorInfo.correlation_w_target[0].correlation).toFixed(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Consiste em uma correlação linear calculada a partir do Coeficiente de Correlação de Pearson que varia entre -1 e +1. Correlações de -1 ou +1 implicam uma relação linear exata. Correlações positivas implicam que à medida que os valores do instrumento em análise aumentam, os valores do instrumento adjacente também aumentam. Correlações negativas implicam que à medida que os valores do instrumento em análise aumentam, os valores do instrumento adjacente diminuem.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Valor-P</span>
                  <span className="centralLeft">
                  {Number(selectedDropdownSensorInfo.correlation_w_target[0].p_value).toExponential(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text='É um valor de probabilidade usado para avaliar um teste estatístico. Considerando uma hipótese nula como "as amostras não são correlacionadas", a interpretação do valor-p é dado da seguinte forma: um valor-p baixo sugere que é improvável observar uma correlação tão forte se não houver uma relação verdadeira entre as variáveis. Isto leva à rejeição da hipótese nula em favor da hipótese alternativa de que existe uma correlação. Já um valor-p alto sugere que não há evidências fortes para rejeitar a hipótese nula.'>
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">ID do Cluster</span>
                  <span className="centralLeft">
                  {selectedDropdownSensorClusterID}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Indica um identificador inteiro do cluster que varia entre zero e o número total de cluster presentes na estrutura em análise. Todas as adjacências de um instrumento são necessariamente oriundas de um mesmo cluster.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

            </div>

            <div className="widgets newModewilMax" style={{ width: '100%' }}>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Coeficiente de correlação - Reservatório</span>
                  <span className="centralLeft">
                  {Number(selectedDropdownSensorInfo.water_correlation[0].water_correlation).toFixed(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text="Consiste em uma correlação linear calculada a partir do Coeficiente de Correlação de Pearson que varia entre -1 e +1. Correlações de -1 ou +1 implicam uma relação linear exata. Correlações positivas implicam que à medida que os valores do instrumento em análise aumentam, o nível do reservatório também aumenta. Correlações negativas implicam que à medida que os valores do instrumento em análise aumentam, o nível do reservatório diminui.">
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

              <div className="latestInfo newModelMax">
                <div className="left">
                  <span className="upperLeft">Valor-P - Reservatório</span>
                  <span className="centralLeft">
                  {Number(selectedDropdownSensorInfo.water_correlation[0].water_p_value).toExponential(2)}
                  </span>
                </div>
                <div className="rightMax">
                  <Tooltip text='É um valor de probabilidade usado para avaliar um teste estatístico. Considerando uma hipótese nula como "as amostras não são correlacionadas", a interpretação do valor-p é dado da seguinte forma: um valor-p baixo sugere que é improvável observar uma correlação tão forte se não houver uma relação verdadeira entre as variáveis. Isto leva à rejeição da hipótese nula em favor da hipótese alternativa de que existe uma correlação. Já um valor-p alto sugere que não há evidências fortes para rejeitar a hipótese nula.'>
                    <img
                      className="iIconStyle"
                      src={iIcon}
                      alt=""
                    />
                  </Tooltip>
                </div>
              </div>

            </div>


            </>
            : null}

            <div style={{ width: '100%' }}>
              <div className="pcUser-bloco">
                <header className='max-header'>
                  <h1 className="colorNesa">Adjacências</h1>
                  <Select
                    options={neighboringSensors.map(sensor => ({ value: sensor, label: sensor.neighbour_name }))}
                    onChange={selectedOption => selectDropdownSensor(selectedOption.value)}
                  />
                </header>
                {selectedDropdownSensor?
                  <CurveChart sensor_id={selectedDropdownSensor} special="true" format="pcUser-bloco cheioMax"/>
                : null}
                </div> 
            </div>
            </> : null
          }
          
        </div>
      </div>


      <div className="modal" tabIndex="-1" id="confirmationTest">
        <div className="modal-dialog">
        {!clusterInfo? null :<div className="modal-content">
            <div className="modal-header header-modal">
              <h5 className="modal-title text-color">Atenção</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body centerModal">
              <div>
                <img className="img-notice" src={iconNotice} alt="Notice" />
              </div>
              <div className=''>
                Confirmando esta operação, estará realizando a detecção automática com as seguintes informações.
              </div>

              <div className="boxInputModal">
                <div className="valueModal">
                  <div className="centerInfo">
                    <div>Estrutura: </div>
                    <div>{strucChosen}</div>
                  </div>
                  <div className="centerInfo">
                    <div>Instrumento: </div>
                    <div>{senseChosen}</div>
                  </div>
                  {clusterInfo && clusterInfo.sensors && (
                    <div className="centerInfo">
                      <div>Vizinhança: </div>
                      <div className="sensor-container">
                        {clusterInfo.sensors.map((sensor, index) => (
                          <div key={index}>{sensor.name};</div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="centerInfo">
                    <div>Nº vizinhos: </div>
                    <div>{clusterInfo.neighbours}</div>
                  </div>
                  <div className="centerInfo">
                    <div>Proximidade: </div>
                    <input className="inputFormatMax" type="number" min="1" value={neighborCount} onChange={(e) => setNeighborCount(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            {!sendingTest ?
              <div className="footer">
                <button type="button" className="btnn" data-bs-target="#conclusionTrain" onClick={() => rotaTeste(infoTest)}>EXECUTAR</button>
              </div>
              : <div className="spinner-div">
                <ReactBootStrap.Spinner animation="border" />
              </div>}
          </div>}
        </div >
      </div >

      <ErroMenssage message="Lamentamos, mas ocorreu um erro interno no servidor." visible={responseTestError} typeMessage="danger" />
      <ErroMenssage message="Detecção automática realizada com sucesso" visible={responseTestSucess} />
    </div>
    </div>
    </div>
  );
}
