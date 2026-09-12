import apiClient from './axios';

export const feeAPI = {
  // Admin / Principal
  createFee: (data) => apiClient.post('/fees', data),
  getFees: (params) => apiClient.get('/fees', { params }),
  getFeePayments: (feeId) => apiClient.get(`/fees/${feeId}/payments`),
  getPaidStudents: () => apiClient.get('/fees/paid-students'),

  // Secretary: cash payment
  recordCashPayment: (data) => apiClient.post('/fees/pay/cash', data),

  // Student
  getMyFees: () => apiClient.get('/fees/student/my-fees'),
  initializePayment: (data) => apiClient.post('/fees/pay/initialize', data),
  verifyPayment: (reference, gateway = 'paystack', feeId = '', method = '') => {
    const params = { gateway };
    if (feeId)  params.feeId  = feeId;
    if (method) params.method = method;
    return apiClient.get(`/fees/pay/verify/${reference}`, { params });
  },
  deleteFee:(id) => apiClient.delete(`/fees/${id}`)
};

export default feeAPI;
