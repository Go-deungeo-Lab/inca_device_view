import React, { useState, useEffect } from 'react';
import { deviceAPI } from '../services/api';

function ManagerApp() {
    const [devices, setDevices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDevice, setSelectedDevice] = useState(null);
    const [returnPassword, setReturnPassword] = useState('');

    // 새 디바이스 추가 폼 상태
    const [newDevice, setNewDevice] = useState({
        deviceNumber: '',
        productName: '',
        modelName: '',
        osVersion: '',
        platform: 'Android',
        isRootedOrJailbroken: false
    });

    useEffect(() => {
        fetchAllDevices();
    }, []);

    const fetchAllDevices = async () => {
        try {
            setLoading(true);
            const response = await deviceAPI.getAllDevices();
            setDevices(response.data);
        } catch (error) {
            console.error('디바이스 조회 실패:', error);
            alert('디바이스 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 디바이스 반납
    const handleReturn = async () => {
        if (!returnPassword) {
            alert('QA 비밀번호를 입력해주세요.');
            return;
        }

        try {
            await deviceAPI.returnDevice(selectedDevice.id, {
                renterName: selectedDevice.currentRenter,
                password: returnPassword
            });

            alert('디바이스가 성공적으로 반납되었습니다!');
            setShowReturnModal(false);
            setReturnPassword('');
            setSelectedDevice(null);
            fetchAllDevices();
        } catch (error) {
            console.error('반납 실패:', error);
            if (error.response?.status === 401) {
                alert('QA 비밀번호가 올바르지 않습니다.');
            } else {
                alert('디바이스 반납에 실패했습니다.');
            }
        }
    };

    // 디바이스 추가
    const handleAddDevice = async () => {
        try {
            await deviceAPI.createDevice(newDevice);
            alert('디바이스가 성공적으로 추가되었습니다!');
            setShowAddModal(false);
            setNewDevice({
                deviceNumber: '',
                productName: '',
                modelName: '',
                osVersion: '',
                platform: 'Android',
                isRootedOrJailbroken: false
            });
            fetchAllDevices();
        } catch (error) {
            console.error('디바이스 추가 실패:', error);
            alert('디바이스 추가에 실패했습니다.');
        }
    };

    // 디바이스 삭제
    const handleDeleteDevice = async (device) => {
        if (device.status === 'rented') {
            alert('대여 중인 디바이스는 삭제할 수 없습니다.');
            return;
        }

        if (window.confirm(`정말로 "${device.productName}" 디바이스를 삭제하시겠습니까?`)) {
            try {
                await deviceAPI.deleteDevice(device.id);
                alert('디바이스가 삭제되었습니다.');
                fetchAllDevices();
            } catch (error) {
                console.error('디바이스 삭제 실패:', error);
                alert('디바이스 삭제에 실패했습니다.');
            }
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-lg text-gray-600">로딩 중...</div>
            </div>
        );
    }

    const availableDevices = devices.filter(d => d.status === 'available');
    const rentedDevices = devices.filter(d => d.status === 'rented');

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                    🔧 디바이스 관리 ({devices.length}개 총 디바이스)
                </h2>
                <div className="flex space-x-4">
                    <button
                        onClick={fetchAllDevices}
                        className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                    >
                        🔄 새로고침
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                    >
                        ➕ 디바이스 추가
                    </button>
                </div>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-blue-500">
                    <h3 className="text-lg font-semibold text-gray-900">전체 디바이스</h3>
                    <p className="text-3xl font-bold text-blue-600">{devices.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-green-500">
                    <h3 className="text-lg font-semibold text-gray-900">대여 가능</h3>
                    <p className="text-3xl font-bold text-green-600">{availableDevices.length}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-l-red-500">
                    <h3 className="text-lg font-semibold text-gray-900">대여 중</h3>
                    <p className="text-3xl font-bold text-red-600">{rentedDevices.length}</p>
                </div>
            </div>

            {/* 디바이스 목록 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">디바이스 목록</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                디바이스 번호
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                제품명
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                플랫폼/OS
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                상태
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                대여자
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                액션
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                        {devices.map(device => (
                            <tr
                                key={device.id}
                                className={device.status === 'rented' ? 'bg-red-50' : 'bg-white'}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                            <span className="text-sm font-medium text-gray-900">
                                                {device.deviceNumber}
                                            </span>
                                        {device.isRootedOrJailbroken && (
                                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                                    ⚠️ {device.platform === 'iOS' ? '탈옥' : '루팅'}
                                                </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{device.productName}</div>
                                    <div className="text-sm text-gray-500">{device.modelName}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">
                                        {device.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                                    </div>
                                    <div className="text-sm text-gray-500">{device.osVersion}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            device.status === 'available'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {device.status === 'available' ? '대여 가능' : '대여 중'}
                                        </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {device.currentRenter || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {device.status === 'rented' ? (
                                        <button
                                            onClick={() => {
                                                setSelectedDevice(device);
                                                setShowReturnModal(true);
                                            }}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            🔄 반납
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleDeleteDevice(device)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            🗑️ 삭제
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 반납 모달 */}
            {showReturnModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">디바이스 반납</h3>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                디바이스: {selectedDevice?.deviceNumber} - {selectedDevice?.productName}
                            </p>
                            <p className="text-sm text-gray-600">
                                대여자: {selectedDevice?.currentRenter}
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                QA 비밀번호 *
                            </label>
                            <input
                                type="password"
                                value={returnPassword}
                                onChange={(e) => setReturnPassword(e.target.value)}
                                placeholder="비밀번호를 입력하세요"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                        </div>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    setShowReturnModal(false);
                                    setReturnPassword('');
                                    setSelectedDevice(null);
                                }}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleReturn}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                반납하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 디바이스 추가 모달 */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-96 overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">새 디바이스 추가</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">디바이스 번호 *</label>
                                <input
                                    type="text"
                                    value={newDevice.deviceNumber}
                                    onChange={(e) => setNewDevice({...newDevice, deviceNumber: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: 25, I-15"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">제품명 *</label>
                                <input
                                    type="text"
                                    value={newDevice.productName}
                                    onChange={(e) => setNewDevice({...newDevice, productName: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: Galaxy S24, iPhone 15 Pro"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">모델명</label>
                                <input
                                    type="text"
                                    value={newDevice.modelName}
                                    onChange={(e) => setNewDevice({...newDevice, modelName: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: SM-S921N, A3102"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">OS 버전 *</label>
                                <input
                                    type="text"
                                    value={newDevice.osVersion}
                                    onChange={(e) => setNewDevice({...newDevice, osVersion: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="예: 15.0, 17.4.1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">플랫폼 *</label>
                                <select
                                    value={newDevice.platform}
                                    onChange={(e) => setNewDevice({...newDevice, platform: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="Android">Android</option>
                                    <option value="iOS">iOS</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="rooted"
                                    checked={newDevice.isRootedOrJailbroken}
                                    onChange={(e) => setNewDevice({...newDevice, isRootedOrJailbroken: e.target.checked})}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="rooted" className="ml-2 text-sm text-gray-700">
                                    루팅/탈옥 여부
                                </label>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleAddDevice}
                                disabled={!newDevice.deviceNumber || !newDevice.productName || !newDevice.osVersion}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                추가하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManagerApp;