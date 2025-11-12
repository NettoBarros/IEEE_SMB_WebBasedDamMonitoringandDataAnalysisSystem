import React from 'react';
import Plot from 'react-plotly.js';

const Histogram = ({ data }) => {
  const histogramData = [
    {
      x: ['-1.0', '-0.9', '-0.8', '-0.7', '-0.6', '-0.5', '-0.4', '-0.3', '-0.2', '-0.1'],
      y: [data.bin1, data.bin2, data.bin3, data.bin4, data.bin5, data.bin6, data.bin7, data.bin8, data.bin9, data.bin10],
      type: 'bar',
      marker: {
        color: '#FF0000',
      },
      name: '> -1.0',
    },
    {
      x: ['0.0', '0.1', '0.2'],
      y: [data.bin11, data.bin12, data.bin13],
      type: 'bar',
      marker: {
        color: '#ffab07',
      },
      name: '> 0.0',
    },
    {
      x: ['0.3', '0.4', '0.5'],
      y: [data.bin14, data.bin15, data.bin16],
      type: 'bar',
      marker: {
        color: '#008000',
      },
      name: '> 0.3',
    },
    {
      x: ['0.6', '0.7', '0.8', '0.9', '1.0'],
      y: [data.bin17, data.bin18, data.bin19, data.bin20],
      type: 'bar',
      marker: {
        color: '#004d00',
      },
      name: '> 0.6',
    },
  ];

  const layout = {
    autosize: true,
    height: 400,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    bargap: 0,
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
      data={histogramData} 
      layout={layout} 
      style={{ width: '100%', height: '100%'}} 
      config={{ displayModeBar: false }} 
      useResizeHandler={true}/>
    </div>;
};

export default Histogram;