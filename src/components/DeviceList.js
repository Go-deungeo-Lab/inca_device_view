import React from 'react';

function DeviceList({ devices, selectedDevices, onDeviceSelect }) {
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            // 모든 디바이스 선택
            devices.forEach(device => {
                if (!selectedDevices.includes(device.id)) {
                    onDeviceSelect(device.id);
                }
            });
        } else {
            // 모든 선택 해제
            selectedDevices.forEach(deviceId => {
                onDeviceSelect(deviceId);
            });
        }
    };

    if (devices.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="text-center py-12">
                    <div className="text-4xl mb-4">📱</div>
                    <div className="text-gray-500 text-lg">디바이스가 없습니다.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
                <thead className="bg-gray-50">
                <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={devices.length > 0 && selectedDevices.length === devices.length}
                            onChange={handleSelectAll}
                            className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
                        />
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">No.</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">제품명</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">플랫폼</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">OS</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">상태</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700">대여자</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {devices.map((device) => {
                    const isSelected = selectedDevices.includes(device.id);
                    return (
                        <tr
                            key={device.id}
                            className={`cursor-pointer transition-all select-none touch-manipulation ${
                                device.status === 'rented' ? 'bg-red-50' :
                                    isSelected
                                        ? 'bg-blue-50'
                                        : 'hover:bg-gray-50 active:bg-gray-100'
                            }`}
                            onClick={() => onDeviceSelect(device.id)}
                            style={{ minHeight: '60px' }}
                        >
                            <td className="px-6 py-5">
                                <div className="flex items-center justify-center w-8 h-8">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onDeviceSelect(device.id)}
                                        className="w-6 h-6 text-blue-600 rounded focus:ring-blue-500 cursor-pointer touch-manipulation"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            </td>

                            <td className="px-6 py-5 text-base font-medium text-gray-900">
                                {device.deviceNumber}
                            </td>

                            <td className="px-6 py-5">
                                <div>
                                    <div className="text-base font-medium text-gray-900">
                                        {device.productName}
                                    </div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        {device.modelName}
                                    </div>
                                    {device.isRootedOrJailbroken && (
                                        <span className="inline-block bg-yellow-200 text-yellow-800 text-sm px-3 py-1 rounded mt-2">
                                                ⚠️ {device.platform === 'iOS' ? '탈옥' : '루팅'}
                                            </span>
                                    )}
                                </div>
                            </td>

                            <td className="px-6 py-5 text-base text-gray-900">
                                {device.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                            </td>

                            <td className="px-6 py-5 text-base text-gray-900">
                                {device.osVersion}
                            </td>

                            <td className="px-6 py-5">
                                    <span className={`inline-block px-3 py-2 text-sm rounded-full font-medium ${
                                        device.status === 'rented'
                                            ? 'bg-red-100 text-red-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}>
                                        {device.status === 'rented' ? '대여 중' : '대여 가능'}
                                    </span>
                            </td>

                            <td className="px-6 py-5 text-base text-gray-900">
                                {device.currentRenter || '-'}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
}

export default DeviceList;