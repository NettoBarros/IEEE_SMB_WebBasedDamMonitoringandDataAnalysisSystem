import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Legend,
  Dot,
  ReferenceLine,
} from 'recharts';

function LinePlot({ data }) {
  const [exitDirections, setExitDirections] = useState([]);
  const [exitDirectionsMask, setExitDirectionsMask] = useState([]);

  useEffect(() => {
    if (!Array.isArray(data)) {
      return;
    }

    const exitDirections = ['count1', 'count2', 'count3', 'count4'];
    setExitDirections(exitDirections);
    setExitDirectionsMask(exitDirections.map(() => 1));
  }, [data]);

  const colors = ['#004d00', '#008000', '#ffab07', '#FF0000'];

  const createLines = () => {
    const legendNames = ['>0.6', '>0.3', '>0.0', '>-1.0']; // Substitua por seus nomes de legenda
  
    return exitDirections.map((exitDirection, index) => {
      if (exitDirectionsMask[index] !== 0) {
        return (
          <Line
            key={exitDirection}
            type="monotone"
            dataKey={exitDirection}
            name={legendNames[index]} // Adicione a propriedade name aqui
            strokeWidth={3}
            stroke={colors[index]}
            dot={<Dot r={2} />} // Todos os pontos terão um Dot
          />
        );
      }
      return null;
    });
  };

  const selectedInspection = data.find(item => item.inspection === item.selected_inspection);

  if (!Array.isArray(data)) {
    return null;
  }

  return (
    <ResponsiveContainer width="95%" height={350}>
      <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <XAxis 
          dataKey="date" 
          stroke="gray" 
          tickFormatter={(str) => {
            const date = new Date(str);
            const year = date.getFullYear();
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const day = date.getDate().toString().padStart(2, '0');
            return `${year}/${month}/${day}`;
          }}
        />
        <YAxis stroke="gray" domain={[0, 1]} />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip
  labelFormatter={(value) => format(new Date(value), 'dd/MM/yyyy HH:mm')}
/>
        <Legend />
        {createLines()}
        {selectedInspection && <ReferenceLine x={selectedInspection.date} stroke="red" strokeDasharray="3 3" />}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default LinePlot;