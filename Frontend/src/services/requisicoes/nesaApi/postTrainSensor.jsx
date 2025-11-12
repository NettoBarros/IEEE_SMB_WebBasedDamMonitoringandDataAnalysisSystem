import api from "../../api";

export default async function postTesteSensor(data, { onResultado, responseServer}) {
  try {
    const response = await api.post(`/nesa/train/${data.id}`, {
      initial_date: data.initial_date,
      final_date: data.final_date,
      outlier: 0.1,
    }, {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('JWT'),
      },
    });
    responseServer(response)
    onResultado(false);
    return response; // Retorne a resposta completa, se necessário
  } catch (error) {
    onResultado(false);
    responseServer(error)
    console.error('Erro na solicitação:', error);
  }
}
