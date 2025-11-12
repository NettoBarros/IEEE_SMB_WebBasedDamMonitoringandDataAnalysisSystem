import React, { useState } from 'react';
import { useEffect } from 'react';
import getMapBox from '../../services/requisicoes/nesaApi/getMapBox';
import Plot from 'react-plotly.js';
import "./map.css";
import * as ReactBootStrap from 'react-bootstrap'

const Map = ({ sensor_id, structure_id }) => {
    const [data, setData] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('JWT');
    
        if (!token) {
            return;
        }
            setData(false)
            getMapBox(structure_id).then((response) => {
                setData(response.data)
                console.log(response.data)
            })
          }, [sensor_id, structure_id])

    return (
        <div className="map">
            <header className='max-header'>
                <h1 className="colorNesa">Localização dos instrumentos</h1>
            </header>

            {data?
            <Plot
                data={data.data}
                layout={{
                    autosize: true,
                    dragmode: "zoom",
                    mapbox: { style: "open-street-map", center: { lat: data.latitude_mean, lon: data.longitude_mean }, zoom: 14 },
                    showlegend: false,
                    margin: {l: 0, r: 0, t: 0, b: 0}

                }}
                config={{displayModeBar: false}}
                useResizeHandler={true}
                style={{width: "100%", height: "600px"}}/>:
                <div className="loading-div">
                <ReactBootStrap.Spinner animation="border" className="loading-icon"/>
                </div>}
      </div>
    );
  }

export default Map;