import React from 'react';
import Plot from 'react-plotly.js';

function BoxPlot({ data }) {
  // Lista de cores para os boxplots
  const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {data.map((item, index) => (
        <div key={index} style={{ width: '25%' }}>
          <Plot
            data={[
              {
                type: 'box',
                name: item.label.toUpperCase(),
                y: [
                  item.lower_whisker,
                  item.lower_quartile,
                  item.median,
                  item.upper_quartile,
                  item.upper_whisker
                ],
                // Atribuindo uma cor diferente a cada boxplot
                marker: {
                  color: colors[index % colors.length]
                },
                boxpoints: 'all',
                jitter: 0.3,
                pointpos: -1.8
              }
            ]}
            layout={{
              height: 400,
              autosize: true,
              plot_bgcolor: 'rgba(0, 0, 0, 0)',  // Remover o fundo
              paper_bgcolor: "rgba(0,0,0,0)",
              xaxis: {
                showgrid: false,  // Remover grade do eixo X
              },
              yaxis: {
                showgrid: false,  // Remover grade do eixo Y
              },
              margin: {
                t: 10,  // Margem superior
                r: 0,   // Margem direita
                b: 15,  // Margem inferior
                l: 30    // Margem esquerda
              }
            }}
            useResizeHandler={true}
            style={{ width: '100%', height: '100%'}}
            config={{ displayModeBar: false }}
          />
        </div>
      ))}
    </div>
  );
}

export default BoxPlot;
