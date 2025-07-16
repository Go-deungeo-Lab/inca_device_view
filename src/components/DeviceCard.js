import React from 'react';

function DeviceCard({ device, isSelected, onSelect }) {
    return (
        <div
            className={`bg-white rounded-lg shadow-md p-6 border-l-4 cursor-pointer transition-all ${
                isSelected
                    ? 'border-l-blue-500 bg-blue-50 shadow-lg'
                    : 'border-l-green-500 hover:shadow-lg'
            } ${device.isRootedOrJailbroken ? 'border-t-4 border-t-yellow-500' : ''}`}
            onClick={() => onSelect(device.id)}
        >
            {/* 체크박스 */}
            <div className="flex items-start justify-between mb-4">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelect(device.id)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    대여 가능
                </span>
            </div>

            {/* 디바이스 정보 */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">No.</span>
                    <span className="font-bold text-lg">{device.deviceNumber}</span>
                </div>

                <h3 className="font-semibold text-gray-900">{device.productName}</h3>

                <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex justify-between">
                        <span>모델명:</span>
                        <span className="font-medium">{device.modelName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>OS 버전:</span>
                        <span className="font-medium">{device.osVersion}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>플랫폼:</span>
                        <span className={`font-medium ${
                            device.platform === 'iOS' ? 'text-gray-600' : 'text-green-600'
                        }`}>
                            {device.platform === 'iOS' ? '🍎 iOS' : '🤖 Android'}
                        </span>
                    </div>
                </div>

                {/* 루팅/탈옥 상태 */}
                {device.isRootedOrJailbroken && (
                    <div className="flex items-center space-x-1 mt-3">
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">
                            ⚠️ {device.platform === 'iOS' ? '탈옥' : '루팅'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DeviceCard;