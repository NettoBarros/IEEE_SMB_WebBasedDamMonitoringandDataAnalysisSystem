import React from 'react';
import Plot from 'react-plotly.js';

const PiePlot = ({ data }) => {
  const pieData = [
    {
      values: [data.count1, data.count2, data.count3, data.count4],
      labels: ['>0.6', '>0.3', '>0.0', '>-1.0'],
      type: 'pie',
      marker: {
        colors: ['#004d00', '#008000', '#ffab07', '#FF0000'],
      },
    },
  ];

  const layout = {
    autosize: true,
    height: 400,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    legend: {
      orientation: 'h',
      xanchor: 'center',
      yanchor: 'bottom',
      x: 0.5,
      y: -0.3
    },
    margin: {
      t: 10,  // Margem superior
      r: 0,   // Margem direita
      b: 15,  // Margem inferior
      l: 30    // Margem esquerda
    }
  };

  return <div style={{ width: '100%', height: '100%', resize: 'both', overflow: 'auto' }}>
  <Plot 
  data={pieData} 
  layout={layout}
  style={{ width: '100%', height: '100%'}}
  config={{ displayModeBar: false }} 
  useResizeHandler={true}
  />
  </div>
};

export default PiePlot;