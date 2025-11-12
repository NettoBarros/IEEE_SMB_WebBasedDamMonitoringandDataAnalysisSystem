import api from "../../api";

export default async function postTrainAll(data, { onResultado, responseServer}) {
    try {
        const response = await api.post(`/nesa/train`, {
            initial_date: data.initial_date,
            final_date: data.final_date,
            outlier: 0.1
        }, {
            headers: {
                Authorization: 'Bearer ' + localStorage.getItem('JWT')
            }
        });
        responseServer(response);
        onResultado(false);
        return response;
    } catch (error) {
        onResultado(false);
        responseServer(error);
        console.error('Erro na solicitação:', error);
    }
}