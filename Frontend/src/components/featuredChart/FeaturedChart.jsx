import "./featuredChart.css"
import {CircularProgressbar, buildStyles} from "react-circular-progressbar"
import "react-circular-progressbar/dist/styles.css";
import getAnomalies from "../../services/requisicoes/nesaApi/getAnomalies";
import getProjectAnomalies from "../../services/requisicoes/nesaApi/getProjectAnomalies";
import { useState, useEffect } from "react";
import ErrorIcon from '@mui/icons-material/Error';

const FeaturedChart = ({sensor_id, initial_date, final_date, type = "IA"}) => {
  const [data, setData] = useState({"data":
    [
      {"name": "Normal",
        "value": 0,
    },
      {
        "name": "Alerta",
        "value": 0
    },
    {
        "name": "Atencao",
        "value": 0
    }
  ]
  })

  const [totalMeasurements, setTotalMeasurements] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }

    if (type === "IA"){
      getAnomalies(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
        setTotalMeasurements(response.data.data[0].value+response.data.data[1].value+response.data.data[2].value)
      })
    } else if (type === "PROJECT"){
      getProjectAnomalies(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
        setTotalMeasurements(response.data.data[0].value+response.data.data[1].value+response.data.data[2].value)
      })
    }
  }, [sensor_id, initial_date, final_date, type])

    return (
        <div className="">
          {/* <div className="top">
            <h1 className="title">Porcentagem total de anomalias</h1>
          </div> */}
            <div className="bottom">
              <div className="featuredChart" style={{ width: '200px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {totalMeasurements?
                  <CircularProgressbar 
                    styles={buildStyles({pathColor: "red"})} 
                    value={((data.data[1].value + data.data[2].value)/totalMeasurements)*100} 
                    text={(((data.data[1].value + data.data[2].value)/totalMeasurements)*100).toLocaleString(
                    'en-US', {minimumFractionDigits: 2, useGrouping: false}) + '%'} 
                    strokeWidth={5}
                    radius={100} // Adicione esta linha
                  />:
                    
                  <CircularProgressbar styles={
                  buildStyles({pathColor: "red"})} 
                  value={0}
                  text={'0%'}
                  strokeWidth={5} 
                  radius={100} // Adicione esta linha
                  />
                }
              </div>
                <p className="title">{type==="PROJECT"?"PROJETO":"IA"}</p>
                <p className="amount">{data.data[1].value + data.data[2].value}</p>
                {data.data[1].value + data.data[2].value>0?
                <div className="alert-icon-div">
                <ErrorIcon className="alert-icon"></ErrorIcon>
                </div>: null}
            </div>
        </div>
      );
}

export default FeaturedChart