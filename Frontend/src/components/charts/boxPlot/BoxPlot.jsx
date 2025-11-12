import React from 'react';
import { useState, useEffect } from 'react';
import getBoxPlotChart from '../../../services/requisicoes/nesaApi/getBoxPlotChart';
import Plot from 'react-plotly.js';
import * as ReactBootStrap from 'react-bootstrap'

const BoxPlot = ({sensor_id, initial_date, final_date}) => {
    const [data, setData] = useState({})

    useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }
         getBoxPlotChart(sensor_id, initial_date, final_date).then((response) => {
          setData(response.data)
          console.log(response.data)
        })
      }, [sensor_id, initial_date, final_date])
		return (
        <div className="featured">
            <header className='max-header'>
                <h1 className="colorNesa">Estatísticas referentes as medições</h1>
            </header>
            {data?
            <Plot
                data={data.data}
                layout={ {
                          paper_bgcolor: "rgba(0,0,0,0)",
                          plot_bgcolor: "rgba(0,0,0,0)",
                          autosize: true,
                          legend: {"orientation": "h", "xanchor": "center", "x": 0.5},
                          xaxis: {"visible": false, "fixedrange": true},
                          yaxis: {"fixedrange": true}
                         }
                       }
                useResizeHandler={true}
                style={{width: "100%", height: "600px"}}
                config={{displayModeBar: false}}
            />
            :
            <div className="loading-div">
            <ReactBootStrap.Spinner animation="border" className="loading-icon"/>
            </div>}
        </div>
		);
}
export default BoxPlot;  