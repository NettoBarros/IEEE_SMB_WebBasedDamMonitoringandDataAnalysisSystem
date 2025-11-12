import React from "react";
import './dashBoard.css'
import Widget from "../../components/widget/Widget";
import authenticated from "../../services/requisicoes/nesaApi/authenticated";
import getStructure from "../../services/requisicoes/nesaApi/getStructure";
import getSensor from "../../services/requisicoes/nesaApi/getSensor";
import getLatestMeasurements from "../../services/requisicoes/nesaApi/getLatestMeasurements";
import { useState, useEffect } from "react";
import FeaturedChart from "../../components/featuredChart/FeaturedChart";
import CurveChart from "../../components/charts/curveChart/CurveChart";
import BarPlot from "../../components/charts/barPlot/BarPlot";
import PiePlot from "../../components/charts/piePlot/PiePlot";
import BoxPlot from "../../components/charts/boxPlot/BoxPlot";
import Map from "../../components/map/Map";
import Modal from '../../components/Modal/modal'
import DropdownBarragem from "../../components/forms/DropdownBarragem/dropdownBarragem";
import DropdownSensor from "../../components/forms/DropdownSensor/dropSensor";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function DashBoard() {
    const [user, setUser] = useState({});
    const [structure, setStructure] = useState(false)
    const [sensor, setSensor] = useState({})
    const [sensorId, setSensorId] = useState(false)
    const [structureId, setStructureId] = useState(false)
    const [startDate, setStartDate] = useState(new Date('01/01/2013'))
    const [finalDate, setFinalDate] = useState(new Date('01/01/2022'))
    const [latestMeasurements, setLatestMeasurements] = useState([])

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
        authenticated().then((response) => (setUser(response.data)))
        if (structureId){
        getStructure(structureId).then((response) => {
            if (response.data.sensors.length>0){
                setStructure(response.data)
            }
            else{
                alert("Esta barragem não possui sensores!")
            }
        })
        }
        if (sensorId){
        getSensor(sensorId).then((response) => (setSensor(response.data)))
        getLatestMeasurements(sensorId, `${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`,
        `${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`).then((response) => {
            setLatestMeasurements(response.data)
        })
        }
    }, [sensorId, structureId, startDate, finalDate])

    function selectedStartDate(date){
        setStartDate(date)
    }

    function selectedFinalDate(date){
        setFinalDate(date)
    }

    return (
        <div className="dashboard">
            <div className="top-bar">
                <div className="top-bar-items">
                    <div className="drop-downs">
                        <DropdownBarragem setValue={setStructureId} setSensorId={setSensorId}/>
                        {structure.sensors?.length>0?
                        <DropdownSensor setValue={setSensorId} structure_id={structureId}/>: null}
                        {sensorId !== false?
                            <div className="dates">
                            <span>Selecione o intervalo:</span>
                            <DatePicker selected={startDate} onChange={(date) => selectedStartDate(date)} dateFormat={'dd/MM/yyyy'}/>
                            <DatePicker selected={finalDate} onChange={(date) => selectedFinalDate(date)} dateFormat={'dd/MM/yyyy'}/>
                        </div> : null}
                    </div>
                    <div className="upload-button">
                        <Modal/>
                    </div>
                </div>
            </div>
            {sensorId?
            <div className="dashboard-container">
                <div className="widgets">
                    <Widget type="user" information={user}/>
                    <Widget type="structure" information={structure}/>
                    <Widget type="sensor" information={sensor}/>
                </div>
                <div className="widgets">
                    <div className="latestInfo">
                        <div className="leftt">
                        <span className="upperLeft">Última medição</span>
                            <span className="centralLeft">
                                {new Date(latestMeasurements.latest_measurement_date).toLocaleDateString()} {new Date(latestMeasurements.latest_measurement_date).toLocaleTimeString()}
                            </span>
                        </div>
                    </div>

                    <div className="latestInfo">
                        <div className="left">
                            <span className="upperLeft">Último alerta</span>
                            <span className="centralLeft">
                            {latestMeasurements.latest_project_alert_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span>{new Date(latestMeasurements.latest_project_alert_date).toLocaleDateString()} {new Date(latestMeasurements.latest_project_alert_date).toLocaleTimeString()}</p>}
                            {latestMeasurements.latest_alert_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span>{new Date(latestMeasurements.latest_alert_date).toLocaleDateString()} {new Date(latestMeasurements.latest_alert_date).toLocaleTimeString()}</p>}
                            </span>
                        </div>
                    </div>
                    <div className="latestInfo">
                    <div className="left">
                            <span className="upperLeft">Última atenção</span>
                            <span className="centralLeft">
                            {latestMeasurements.latest_project_attention_date === 0 ? <p><span className="boldAA">Projeto: </span>-</p> :<p><span className="boldAA">Projeto:</span> {new Date(latestMeasurements.latest_project_attention_date).toLocaleDateString()} {new Date(latestMeasurements.latest_project_attention_date).toLocaleTimeString()}</p>}
                            {latestMeasurements.latest_attention_date === 0 ? <p><span className="boldAA">IA: </span>-</p> :<p><span className="boldAA">IA:</span> {new Date(latestMeasurements.latest_attention_date).toLocaleDateString()} {new Date(latestMeasurements.latest_attention_date).toLocaleTimeString()}</p>}
                            </span>
                        </div>
                    </div>

                </div>
                <div className="charts">
                    <CurveChart sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                        final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}/>
                </div>
                <div className='charts'>
                    <div className="charts2">
                        <div>
                        <header className='max-header'>
                            <h1 className="colorNesa">Porcentagem total de anomalias</h1>
                        </header>
                            <div className="charts3">
                            <FeaturedChart
                            sensor_id={sensorId}
                            initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                            final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}/>
                            <FeaturedChart
                            sensor_id={sensorId}
                            initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                            final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}
                            type="PROJECT"/>
                            </div>
                        </div>
                    </div>
                    <div className="charts2">
                        <div>
                        <header className='max-header'>
                            <h1 className="colorNesa">Quantidade anual de medições normais, atenções e alertas</h1>
                        </header>
                            <div className="charts3 charts3Bar">
                            <BarPlot sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                            final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}/>
                            <BarPlot sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                            final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}
                            type="PROJECT"/>    
                            </div>
                        </div>
                    </div>
                </div>
                <div className='charts'>
                    <div className="charts2">
                        <div>
                        <header className='max-header'>
                            <h1 className="colorNesa">Porcentagem total de anomalias</h1>
                        </header>
                            <div className="charts3">
                                <PiePlot sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                                final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}/>
                                <PiePlot sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                                final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}
                                type="PROJECT"/>
                            </div>
                        </div>
                    </div>
                    <BoxPlot sensor_id={sensorId} initial_date={`${startDate.getUTCFullYear()}-${startDate.getMonth()+1}-${startDate.getDay()}`} 
                    final_date={`${finalDate.getUTCFullYear()}-${finalDate.getMonth()+1}-${finalDate.getDay()}`}/>
                </div>
                <div className="map-in-dashboard">
                <Map sensor_id={sensorId} structure_id = {structureId}/>
                </div>
            </div>: null}
        </div>
    )
}
