import React from 'react';
import Plot from 'react-plotly.js';

const TemporalBoxPlot = ({ data }) => {
  const colorMap = {
    ndvi: '#1f77b4',
    gndvi: '#ff7f0e',
    ndre: '#2ca02c',
    ndwi: '#d62728',
  };

  const plotData = data.map(item => {
    const date = new Date(item.date).toLocaleDateString();
    const isHighlighted = item.inspection === item.selected_inspection; // Altere para a data que você deseja destacar

    return {
      type: 'box',
      name: date,
      y: [item.lower_whisker, item.lower_quartile, item.median, item.upper_quartile, item.upper_whisker],
      boxpoints: 'all',
      boxmean: true,
      jitter: 0.3,
      pointpos: -1.8,
      marker: {
        color: colorMap[item.label] || 'black', // Se a coluna for a destacada, use amarelo. Caso contrário, use a cor correspondente ao label ou preto se o label não estiver no mapa de cores
      },
      line: {
        width: isHighlighted ? 4 : 2, // Se a coluna for a destacada, use uma linha mais grossa
      },
      showlegend: false
    };
  });

  const layout = {
    autosize: true,
    height: 400,
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    margin: {
      t: 10,  // Margem superior
      r: 0,   // Margem direita
      b: 15,  // Margem inferior
      l: 30    // Margem esquerda
    }
  };

  return  <div style={{ width: '100%', height: '100%', resize: 'both', overflow: 'auto' }}>
  <Plot 
    data={plotData} 
    layout={layout} 
    style={{ width: '100%', height: '100%'}}
    config={{ displayModeBar: false }}
    useResizeHandler={true}
  />
</div>
};

export default TemporalBoxPlot;