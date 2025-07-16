import React from 'react';

function LoadingSpinner({ message = '로딩 중...' }) {
    return (
        <div className="flex justify-center items-center h-64">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <div className="text-lg text-gray-600">{message}</div>
            </div>
        </div>
    );
}

export default LoadingSpinner;