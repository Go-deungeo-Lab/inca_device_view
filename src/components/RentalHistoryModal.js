// src/components/RentalHistoryModal.js

import React, { useState, useEffect } from 'react';
import { rentalAPI } from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { formatKoreanDateTime, calculateDuration } from '../utils/timeUtils'; // 🆕 유틸리티 import

function RentalHistoryModal({ isOpen, onClose }) {
    const [rentals, setRentals] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all'); // 'all', 'active', 'returned'
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (isOpen) {
            fetchRentals();
        }
    }, [isOpen, filter]);

    const fetchRentals = async () => {
        try {
            setLoading(true);
            let response;

            switch (filter) {
                case 'active':
                    response = await rentalAPI.getActiveRentals();
                    break;
                case 'returned':
                    response = await rentalAPI.getReturnedRentals();
                    break;
                default:
                    response = await rentalAPI.getAllRentals();
            }

            setRentals(response.data);
        } catch (error) {
            console.error('이력 조회 실패:', error);
            alert('대여 이력을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 검색 필터링
    const filteredRentals = rentals.filter(rental => {
        if (!searchTerm) return true;

        const searchLower = searchTerm.toLowerCase();
        return (
            rental.renterName.toLowerCase().includes(searchLower) ||
            rental.device?.deviceNumber.toLowerCase().includes(searchLower) ||
            rental.device?.productName.toLowerCase().includes(searchLower)
        );
    });

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 touch-manipulation">
            <div className="bg-white rounded-lg w-full max-w-6xl mx-4 max-h-[90vh] flex flex-col">
                {/* 헤더 */}
                <div className="flex justify-between items-center p-6 border-b">
                    <h3 className="text-xl font-semibold text-gray-900">
                        📊 디바이스 대여 이력
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center touch-manipulation"
                    >
                        ✕
                    </button>
                </div>

                {/* 필터 및 검색 */}
                <div className="p-6 border-b bg-gray-50">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        {/* 필터 버튼들 */}
                        <div className="flex bg-white rounded-lg shadow-sm border">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                                    filter === 'all'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                전체
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2 text-sm font-medium transition-colors ${
                                    filter === 'active'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                대여 중
                            </button>
                            <button
                                onClick={() => setFilter('returned')}
                                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                                    filter === 'returned'
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                반납 완료
                            </button>
                        </div>

                        {/* 검색 */}
                        <div className="flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="이름, 디바이스 번호, 제품명 검색..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* 새로고침 버튼 */}
                        <button
                            onClick={fetchRentals}
                            disabled={loading}
                            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            🔄 새로고침
                        </button>
                    </div>

                    {/* 결과 개수 */}
                    <div className="mt-4 text-sm text-gray-600">
                        총 {filteredRentals.length}개의 기록
                    </div>
                </div>

                {/* 이력 테이블 */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex justify-center items-center h-64">
                            <LoadingSpinner message="이력을 불러오는 중..." />
                        </div>
                    ) : (
                        <table className="min-w-full">
                            <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    대여자
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    디바이스
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    대여 시간
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    반납 시간
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    사용 기간
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    상태
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                            {filteredRentals.map((rental) => (
                                <tr key={rental.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {rental.renterName}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            <div className="font-medium">
                                                {rental.device?.deviceNumber} - {rental.device?.productName}
                                            </div>
                                            <div className="text-gray-500">
                                                {rental.device?.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'} {rental.device?.osVersion}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatKoreanDateTime(rental.rentedAt)} {/* 🆕 한국 시간으로 변환 */}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatKoreanDateTime(rental.returnedAt)} {/* 🆕 한국 시간으로 변환 */}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {calculateDuration(rental.rentedAt, rental.returnedAt)} {/* 🆕 유틸리티 사용 */}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                            rental.status === 'active'
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}>
                                            {rental.status === 'active' ? '대여 중' : '반납 완료'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}

                    {!loading && filteredRentals.length === 0 && (
                        <div className="text-center py-12">
                            <div className="text-4xl mb-4">📋</div>
                            <div className="text-gray-500 text-lg">
                                {searchTerm ? '검색 결과가 없습니다.' : '대여 이력이 없습니다.'}
                            </div>
                        </div>
                    )}
                </div>

                {/* 푸터 */}
                <div className="p-6 border-t bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RentalHistoryModal;