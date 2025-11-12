import "./barPlot.css";
import {
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  BarChart,
  Legend,
} from "recharts";
import getBarChart from "../../../services/requisicoes/nesaApi/getBarChart";
import getProjectBarChart from "../../../services/requisicoes/nesaApi/getProjectBarChart";
import { useState, useEffect } from "react";
import * as ReactBootStrap from 'react-bootstrap'


const BarPlot = ({sensor_id, initial_date, final_date, type = "IA"}) => {
  const [data, setData] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }

    if (type === "IA"){
      getBarChart(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
      })
    }
    else if (type === "PROJECT"){
      getProjectBarChart(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
      })
    }
  }, [sensor_id, initial_date, final_date, type])

  return (
    <div className="normal normalnormal">
      <div className="title">{type==="PROJECT"?"PROJETO":"IA"}</div>
      <ResponsiveContainer width="95%" height={150}>
        {data?
        <BarChart
          data={data.data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="normal" fill="#078E9C" />
          <Bar dataKey="atencao" fill="#FFA500" />
          <Bar dataKey="alerta" fill="#DC143C" />
        </BarChart>:  
        <div className="loading-div">
          <ReactBootStrap.Spinner animation="border" className="loading-icon"/>
        </div>}
      </ResponsiveContainer>
    </div>
  );
};

export default BarPlot;