import "./piePlot.css"
import "react-circular-progressbar/dist/styles.css";
import getAnomalies from "../../../services/requisicoes/nesaApi/getAnomalies";
import getProjectAnomalies from "../../../services/requisicoes/nesaApi/getProjectAnomalies";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import * as ReactBootStrap from 'react-bootstrap'

const COLORS = ["#4682B4", "#FFA500", "#DC143C"];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
const x = cx + radius * Math.cos(-midAngle * RADIAN);
const y = cy + radius * Math.sin(-midAngle * RADIAN);
let value = `${(percent * 100).toFixed(0)}%`
if (value === "0%"){
    value = ""
}

return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
    {value}
    </text>
);
};

const PiePlot = ({sensor_id, initial_date, final_date, type = "IA"}) => {
  const [data, setData] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('JWT');

    if (!token) {
        return;
    }

    if (type === "PROJECT"){
      getProjectAnomalies(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
      })
    }
    else{
      getAnomalies(sensor_id, initial_date, final_date).then((response) => {
        setData(response.data)
      })
    }

  }, [sensor_id, initial_date, final_date, type])

    return (
        <div className="featured normalnormal">
          <ResponsiveContainer width="100%" height={500}>
        {data?
        <PieChart width={"50%"} height={400}>
        <Legend/>
          <Pie
            data={data.data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomizedLabel}
            outerRadius={130}
            fill="#8884d8"
            dataKey="value"
          >
            {data.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        <Tooltip />
        </PieChart>: 
        <div className="loading-div">
            <ReactBootStrap.Spinner animation="border" className="loading-icon"/>
        </div>}
      </ResponsiveContainer>
      <div className="top">
        <h1 className="title">{type==="PROJECT"?"PROJETO":"IA"}</h1>
      </div>
    </div>
      );
}

export default PiePlot