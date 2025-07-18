import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// 기본 axios 인스턴스 (사용자용 - 인증 불필요)
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 관리자용 axios 인스턴스 (JWT 토큰 포함)
const adminApi = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 관리자용 요청 인터셉터 - JWT 토큰 자동 첨부
adminApi.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('managerToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 공통 응답 인터셉터 - IP 차단 및 인증 오류 처리
const responseInterceptor = (response) => response;
const errorInterceptor = (error) => {
    if (error.response?.status === 403) {
        // IP 차단된 경우
        window.location.href = '/access-denied';
        return Promise.reject(new Error('Access denied from this IP address'));
    }

    if (error.response?.status === 401) {
        // 관리자 인증 오류 - 토큰 제거 및 로그인 페이지로
        localStorage.removeItem('managerToken');
        localStorage.removeItem('manager');
        window.location.reload();
        return Promise.reject(new Error('Authentication failed'));
    }

    return Promise.reject(error);
};

// 인터셉터 적용
api.interceptors.response.use(responseInterceptor, errorInterceptor);
adminApi.interceptors.response.use(responseInterceptor, errorInterceptor);

// 🔓 사용자용 API (인증 불필요)
export const userAPI = {
    // ✅ 모든 디바이스 조회 (대여 가능 + 대여 중)
    getAllDevices: () => api.get('/devices/all'),

    // 대여 가능한 디바이스만 조회
    getAvailableDevices: () => api.get('/devices/available'),

    // 특정 디바이스 조회
    getDevice: (id) => api.get(`/devices/${id}`),

    // 디바이스 대여
    rentDevices: (rentData) => api.post('/devices/rent', rentData),

    // ✅ 사용자용 디바이스 반납 (이름만 입력하면 OK)
    userReturnDevice: (id, renterName) =>
        api.post(`/devices/user-return/${id}`, { renterName }),

    // 사용자별 대여중인 디바이스 조회
    getUserRentedDevices: (renterName) =>
        api.get(`/devices/user/${renterName}/rented`),
};

// 🔓 대여 이력 API (공개 - 사용자도 조회 가능)
export const rentalAPI = {
    // ✅ 모든 대여 기록 조회 (공개)
    getAllRentals: () => api.get('/rentals'),

    // ✅ 활성 대여 기록 조회 (공개)
    getActiveRentals: () => api.get('/rentals/active'),

    // ✅ 반납된 대여 기록 조회 (공개)
    getReturnedRentals: () => api.get('/rentals/returned'),

    // ✅ 대여 통계 조회 (공개)
    getRentalStats: () => api.get('/rentals/stats'),

    // ✅ 플랫폼별 대여 통계 (공개)
    getRentalStatsByPlatform: () => api.get('/rentals/stats/platform'),

    // ✅ 특정 사용자의 대여 기록 (공개)
    getRentalsByUser: (renterName) => api.get(`/rentals/renter/${renterName}`),

    // ✅ 특정 디바이스의 대여 기록 (공개)
    getRentalsByDevice: (deviceId) => api.get(`/rentals/device/${deviceId}`),
};

// 🔒 관리자용 API (JWT 토큰 필요)
export const adminAPI = {
    // 모든 디바이스 조회 (관리자용 - 상세 정보 포함)
    getAllDevices: () => adminApi.get('/devices/admin/all'),

    // 대여 중인 디바이스 조회
    getRentedDevices: () => adminApi.get('/devices/admin/rented'),

    // 디바이스 생성
    createDevice: (deviceData) => adminApi.post('/devices/admin/create', deviceData),

    // 디바이스 수정
    updateDevice: (id, deviceData) => adminApi.patch(`/devices/admin/${id}`, deviceData),

    // 디바이스 삭제
    deleteDevice: (id) => adminApi.delete(`/devices/admin/${id}`),

    // 관리자용 디바이스 반납 (JWT + QA 비밀번호 필요)
    returnDevice: (id, returnData) =>
        adminApi.post(`/devices/admin/return/${id}`, returnData),

    // 대여 기록 삭제 (관리자용)
    deleteRental: (id) => adminApi.delete(`/rentals/${id}`),
};

// 🔒 인증 관련 API
export const authAPI = {
    // 관리자 로그인
    login: (loginData) => api.post('/auth/login', loginData),

    // 토큰 검증
    verifyToken: (token) => api.post('/auth/verify', { token }),
};

// 🔄 하위 호환성을 위한 기존 deviceAPI (사용자용으로 매핑)
export const deviceAPI = {
    // ✅ 사용자용: 모든 디바이스 조회 (현재 페이지 구조에 맞게)
    getAllDevices: userAPI.getAllDevices,

    // 기존 사용자용 API들
    getAvailableDevices: userAPI.getAvailableDevices,
    getDevice: userAPI.getDevice,
    rentDevices: userAPI.rentDevices,
    userReturnDevice: userAPI.userReturnDevice,
    getUserRentedDevices: userAPI.getUserRentedDevices,

    // 관리자 전용 API들 (하위 호환성)
    createDevice: adminAPI.createDevice,
    updateDevice: adminAPI.updateDevice,
    deleteDevice: adminAPI.deleteDevice,
    returnDevice: adminAPI.returnDevice,
    getRentedDevices: adminAPI.getRentedDevices,
};

export default api;