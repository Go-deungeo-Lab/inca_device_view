// src/utils/timeUtils.js

export const formatKoreanTime = (dateString) => {
    if (!dateString) return '-';

    // UTC 시간을 한국 시간으로 변환
    const date = new Date(dateString);

    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
};

export const formatKoreanDate = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatKoreanDateTime = (dateString) => {
    if (!dateString) return '-';

    const date = new Date(dateString);

    return date.toLocaleString('ko-KR', {
        timeZone: 'Asia/Seoul',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 🆕 시간 차이 계산 함수 (한국 시간 기준)
export const calculateDuration = (startDateString, endDateString) => {
    if (!endDateString) return '진행 중';

    const start = new Date(startDateString);
    const end = new Date(endDateString);
    const diffMs = end - start;

    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffDays > 0) {
        return `${diffDays}일 ${diffHours}시간`;
    } else if (diffHours > 0) {
        return `${diffHours}시간 ${diffMinutes}분`;
    } else {
        return `${diffMinutes}분`;
    }
};