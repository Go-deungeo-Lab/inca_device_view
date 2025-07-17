import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 응답 인터셉터 추가 - IP 차단 감지
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 403) {
            // IP 차단된 경우 자동으로 차단 페이지로 리다이렉트
            window.location.href = '/access-denied';
            return Promise.reject(new Error('Access denied from this IP address'));
        }
        return Promise.reject(error);
    }
);

// 디바이스 관련 API (관리자용)
export const deviceAPI = {
    // 모든 디바이스 조회 (대여자 정보 포함)
    getAllDevices: () => api.get('/devices'),

    // 대여 가능한 디바이스 조회
    getAvailableDevices: () => api.get('/devices/available'),

    // 대여 중인 디바이스 조회
    getRentedDevices: () => api.get('/devices/rented'),

    // 특정 디바이스 조회
    getDevice: (id) => api.get(`/devices/${id}`),

    // 디바이스 생성
    createDevice: (deviceData) => api.post('/devices', deviceData),

    // 디바이스 수정
    updateDevice: (id, deviceData) => api.patch(`/devices/${id}`, deviceData),

    // 디바이스 삭제
    deleteDevice: (id) => api.delete(`/devices/${id}`),

    // 디바이스 대여
    rentDevices: (rentData) => api.post('/devices/rent', rentData),

    // 관리자용 디바이스 반납 (QA 비밀번호 필요)
    returnDevice: (id, renterName, password) =>
        api.post(`/devices/return/${id}`, { renterName, password }),

    // 🆕 사용자용 디바이스 반납 (비밀번호 불필요)
    userReturnDevice: (id, renterName) =>
        api.post(`/devices/user-return/${id}`, { renterName }),

    // 🆕 사용자별 대여중인 디바이스 조회
    getUserRentedDevices: (renterName) =>
        api.get(`/devices/user/${renterName}/rented`),
};

// 대여 관련 API (관리자용)
export const rentalAPI = {
    // 모든 대여 기록 조회
    getAllRentals: () => api.get('/rentals'),

    // 활성 대여 기록 조회
    getActiveRentals: () => api.get('/rentals/active'),

    // 반납된 대여 기록 조회
    getReturnedRentals: () => api.get('/rentals/returned'),

    // 대여 통계 조회
    getRentalStats: () => api.get('/rentals/stats'),

    // 플랫폼별 대여 통계
    getRentalStatsByPlatform: () => api.get('/rentals/stats/platform'),

    // 특정 사용자의 대여 기록
    getRentalsByUser: (renterName) => api.get(`/rentals/renter/${renterName}`),

    // 특정 디바이스의 대여 기록
    getRentalsByDevice: (deviceId) => api.get(`/rentals/device/${deviceId}`),

    // 대여 기록 삭제 (관리자용)
    deleteRental: (id) => api.delete(`/rentals/${id}`),
};

export default api;