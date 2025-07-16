import axios from 'axios';

// API 기본 URL (Railway 배포 URL)
const API_BASE_URL = 'https://incadeviceserver-production-9e3f.up.railway.app/';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 디바이스 관련 API
export const deviceAPI = {
    // 모든 디바이스 조회
    getAllDevices: () => api.get('/devices'),

    // 대여 가능한 디바이스 조회
    getAvailableDevices: () => api.get('/devices/available'),

    // 대여 중인 디바이스 조회
    getRentedDevices: () => api.get('/devices/rented'),

    // 디바이스 생성
    createDevice: (deviceData) => api.post('/devices', deviceData),

    // 디바이스 수정
    updateDevice: (id, deviceData) => api.patch(`/devices/${id}`, deviceData),

    // 디바이스 삭제
    deleteDevice: (id) => api.delete(`/devices/${id}`),

    // 디바이스 대여
    rentDevices: (rentData) => api.post('/devices/rent', rentData),

    // 디바이스 반납
    returnDevice: (id, returnData) => api.post(`/devices/return/${id}`, returnData),
};

// 대여 관련 API
export const rentalAPI = {
    // 모든 대여 기록 조회
    getAllRentals: () => api.get('/rentals'),

    // 활성 대여 기록 조회
    getActiveRentals: () => api.get('/rentals/active'),

    // 대여 통계 조회
    getRentalStats: () => api.get('/rentals/stats'),

    // 특정 사용자의 대여 기록
    getRentalsByUser: (renterName) => api.get(`/rentals/renter/${renterName}`),
};

export default api;