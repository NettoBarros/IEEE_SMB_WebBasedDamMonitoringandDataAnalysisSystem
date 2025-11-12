import "./curveChart.css";
import {
  Line,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  LineChart,
  Legend,
  Dot,
} from "recharts";
import Toggle from "../../../components/Toggle/Toggle";
import getLineChart from "../../../services/requisicoes/nesaApi/getLineChart";
import getMeasurements from "../../../services/requisicoes/nesaApi/getMeasurements";
import { useState, useEffect } from "react";
import * as ReactBootStrap from "react-bootstrap";
import { Fragment } from "react";

const CurveChart = ({
  sensor_id,
  initial_date = 0,
  final_date = 0,
  format = "normal",
  special = false,
}) => {
  const [data, setData] = useState(false);
  const [exitDirections, setExitDirections] = useState([]);
  const [exitDirectionsMask, setExitDirectionsMask] = useState([]);

  function getButtonsUsingMap() {
    var activated = 1;
    return data["exit_directions"].map((exitDirection) => {
      if (exitDirection.slice(0, 6) === "Limiar") activated = 0;
      else activated = 1;
      return (
        <Toggle
          key={exitDirection}
          insertExitDirection={insertExitDirection}
          label={exitDirection}
          activated={activated}
        />
      );
    });
  }

  async function insertExitDirection(event) {
    const exitDirection = event.target.innerHTML;
    const index = exitDirections.indexOf(exitDirection);
    const copyOfExitDirectionsMask = [...exitDirectionsMask];
    if (exitDirectionsMask[index] !== 1) copyOfExitDirectionsMask[index] = 1;
    else copyOfExitDirectionsMask[index] = 0;
    setExitDirectionsMask(copyOfExitDirectionsMask);
  }

  /***function createLines(amount_of_lines){
    var array = [];
    const colors = ['#00FFFF', '#0000FF', '#00FF00', '#A020F0', '#FF1493']
    for (var i = 0; i < amount_of_lines; i++) {
      if(exitDirectionsMask[i] !== 0){
        if (exitDirections[i].slice(0, 6) === "Limiar"){
          array.push(<Line key={i} type="monotone" dataKey={exitDirections[i]} strokeWidth={2} stroke={"black"} dot={false} strokeDasharray="4 4" />)
        }
        else{
          array.push(<Line key={i} type="monotone" dataKey={exitDirections[i]} strokeWidth={2} stroke={colors[i]} dot={false}/>)
        }
        array.push(<Line legendType="none" key={i+1000} type="monotone" dataKey={"Anomalia - "+exitDirections[i]} strokeWidth={2} dot={{ fill: 'red', r: 1 }}  stroke={'red'}/>)
      }
    }
    return array
  }***/

  function createLinesV2() {
    const directions = exitDirections.filter(
      (_, index) => exitDirectionsMask[index] === 1
    );

    const colors = {
      "Carga Piezométrica (m.c.a)": "#00FFFF",
      "Cota Piezométrica (m)": "#0000FF",
      "Limiar de Projeto (atencao) - Cota Piezométrica": "#000",
      "Limiar de Projeto (alerta) - Cota Piezométrica": "#000",
      "Limiar de IA (atencao) - Cota Piezométrica": "#568075",
      "Limiar de IA (alerta) - Cota Piezométrica": "#568075",
    };

    const strokeWidth = {
      "Limiar de Projeto (atencao) - Cota Piezométrica": 2,
      "Limiar de IA (atencao) - Cota Piezométrica": 2,
    };

    const strokeDasharray = {
      "Limiar de Projeto (atencao) - Cota Piezométrica": "8 5 10",
      "Limiar de IA (atencao) - Cota Piezométrica": "8 5 10",
    };

    const dot = {
      "Carga Piezométrica (m.c.a)": false,
      "Cota Piezométrica (m)": false,
      "Limiar de Projeto (atencao) - Cota Piezométrica": false,
      "Limiar de IA (atencao) - Cota Piezométrica": false,
      "Limiar de Projeto (alerta) - Cota Piezométrica": (props) => {
        const { cx, cy, index } = props; // A lógica aqui vai decidir quando e onde mostrar os pontos

        if (index % 4 === 0) {
          // A cada 4 unidades, vai desenhar um ponto
          return (
            <Dot
              cx={cx}
              cy={cy}
              r={3}
              fill={colors["Limiar de Projeto (alerta) - Cota Piezométrica"]}
            />
          );
        }

        return null;
      },
      "Limiar de IA (alerta) - Cota Piezométrica": (props) => {
        const { cx, cy, index } = props; // A lógica aqui vai decidir quando e onde mostrar os pontos

        if (index % 4 === 0) {
          // A cada 4 unidades, vai desenhar um ponto
          return (
            <Dot
              cx={cx}
              cy={cy}
              r={3}
              fill={colors["Limiar de IA (alerta) - Cota Piezométrica"]}
            />
          );
        }

        return null;
      },
    };

    const lineGraphs = directions.map((direction, index) => {

      console.log(direction);

      return (
        <Fragment>
          <Line
            key={index}
            type="monotone"
            dataKey={direction}
            stroke={colors[direction]}
            strokeWidth={strokeWidth[direction]}
            dot={dot[direction]}
            strokeDasharray={strokeDasharray[direction]}
          />

          <Line
            legendType="none"
            key={index + 1000}
            type="monotone"
            dataKey={"Anomalia - " + direction}
            strokeWidth={2}
            dot={{ fill: "red", r: 1 }}
            stroke={"red"}
          />
        </Fragment>
      );
    });
    console.log("Dados do gráfico:", data);
    return lineGraphs.length ? lineGraphs : null;
  }

  function calculateDomain() {
    let minValue = Infinity;
    let maxValue = -Infinity;

    exitDirections.forEach((exitDirection, index) => {
      if (exitDirectionsMask[index] !== 0) {
        data["measurements"].forEach((measurement) => {
          if (measurement[exitDirection] < minValue) {
            minValue = measurement[exitDirection];
          }
          if (measurement[exitDirection] > maxValue) {
            maxValue = measurement[exitDirection];
          }
        });
      }
    });

    return [minValue, maxValue];
  }

  useEffect(() => {
    const token = localStorage.getItem("JWT");

    if (!token) {
      return;
    }

    if (initial_date === 0) {
      getMeasurements(sensor_id).then((response) => {
        getLineChart(
          sensor_id,
          new Date("2016-01-01T10:40:00").toISOString().slice(0, -1),
          response.data.last_measurement
        ).then((response) => {
          setExitDirections(response.data["exit_directions"]);
          var exitDirectionMask = [];
          response.data["exit_directions"].forEach((exit_direction) => {
            if (exit_direction.slice(0, 6) === "Limiar")
              exitDirectionMask.push(0);
            else exitDirectionMask.push(1);
          });
          setExitDirectionsMask(exitDirectionMask);
          setData(response.data);
        });
      });
      return;
    }

    getLineChart(sensor_id, initial_date, final_date).then((response) => {
      setExitDirections(response.data["exit_directions"]);
      var exitDirectionMask = [];
      response.data["exit_directions"].forEach((exit_direction) => {
        if (exit_direction.slice(0, 6) === "Limiar") exitDirectionMask.push(0);
        else exitDirectionMask.push(1);
      });
      setExitDirectionsMask(exitDirectionMask);
      setData(response.data);
    });
  }, [sensor_id, initial_date, final_date]);

  return (
    <div className={special === false ? format : ""}>
      {special === false ? (
        <header className="max-header">
          <h1 className="colorNesa">Medições</h1>
        </header>
      ) : null}
      {data ? <div className="buttons">{getButtonsUsingMap()}</div> : null}
      <ResponsiveContainer width="95%" height={350}>
        {data ? (
          <LineChart
            stackOffset="sign"
            data={data["measurements"]}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <XAxis angle={10} dataKey="date" stroke="gray" />
            <YAxis
              dataKey={calculateDomain()}
              stroke="gray"
              domain={calculateDomain()}
            />
            <CartesianGrid strokeDasharray="3 3" className="chartGrid" />
            <Tooltip />
            <Legend />

            {createLinesV2()}
          </LineChart>
        ) : (
          <div className="loading-div">
            <ReactBootStrap.Spinner
              animation="border"
              className="loading-icon"
            />
          </div>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default CurveChart;
