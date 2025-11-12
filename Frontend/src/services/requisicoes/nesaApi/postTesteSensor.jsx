import api from "../../api";

export default async function postTesteSensor(data, { onResultado, responseServer}) {
  try {
    const response = await api.post(`/nesa/test/${data.id}`, {
      initial_date: data.initial_date,
      final_date: data.final_date,
      outlier: data.outlier,
    }, {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('JWT'),
      },
    });
    onResultado(false);
    responseServer(response);
    return response;
  } catch (error) {
    responseServer(error);
    onResultado(false);
    console.error('Erro na solicitação:', error);
  }
}
