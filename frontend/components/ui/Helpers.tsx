import React from 'react';
import { CafeIcon, RestaurantIcon, StudyIcon, CocktailIcon, SparkleIcon, NatureIcon, TentIcon } from './Icons';

// --- 썸네일 콜라주 (Collage) 생성 함수 ---
export const renderFolderCover = (scraps: any[]) => {
    if (!scraps || scraps.length === 0) {
        return (
            <div className="w-full h-full bg-[#F2F4F6] flex items-center justify-center text-[#8B95A1]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }
    
    const imageUrls = scraps.map(s => s.place?.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800");
    
    if (imageUrls.length === 1) {
        return (
            <img 
                src={imageUrls[0]} 
                alt="cover" 
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
            />
        );
    }
    
    if (imageUrls.length === 2) {
        return (
            <div className="w-full h-full flex gap-[2px]">
                <img src={imageUrls[0]} className="w-1/2 h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
                <img src={imageUrls[1]} className="w-1/2 h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
            </div>
        );
    }
    
    if (imageUrls.length === 3) {
        return (
            <div className="w-full h-full flex gap-[2px]">
                <div className="w-[60%] h-full overflow-hidden">
                    <img src={imageUrls[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
                </div>
                <div className="w-[40%] h-full flex flex-col gap-[2px]">
                    <div className="h-1/2 overflow-hidden">
                        <img src={imageUrls[1]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
                    </div>
                    <div className="h-1/2 overflow-hidden">
                        <img src={imageUrls[2]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 3" />
                    </div>
                </div>
            </div>
        );
    }
    
    // 4 or more
    return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2 gap-[2px]">
            <img src={imageUrls[0]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 1" />
            <img src={imageUrls[1]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 2" />
            <img src={imageUrls[2]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 3" />
            <img src={imageUrls[3]} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 animate-fade-in" alt="cover 4" />
        </div>
    );
};

// --- 업종/태그 분석 카테고리 아이콘 헬퍼 ---
export const getCategoryIcon = (category: string = '', name: string = '') => {
    const cat = category.trim();
    if (cat === '자연명소') {
        return { icon: <NatureIcon />, bg: "bg-[#EAF2EC]", text: "text-[#2B6A4F]" }; // Sage Green
    }
    if (cat === '카페/디저트') {
        return { icon: <CafeIcon />, bg: "bg-[#FFF4EE]", text: "text-[#E65C00]" }; // Warm Terracotta
    }
    if (cat === '음식점') {
        return { icon: <RestaurantIcon />, bg: "bg-[#FFF0F0]", text: "text-[#E63939]" }; // Warm Coral
    }
    if (cat === '술집') {
        return { icon: <CocktailIcon />, bg: "bg-[#FFF9E6]", text: "text-[#B38000]" }; // Muted Gold
    }

    const combined = `${category} ${name}`.toLowerCase();
    
    // 1. 자연 / 공원 / 야외 활동 (관악산, 공원, 산책 등)
    if (
        combined.includes('공원') || 
        combined.includes('자연') || 
        combined.includes('등산') || 
        combined.includes('산책') || 
        combined.includes('수목원') || 
        combined.includes('계곡') || 
        combined.includes('둘레길') || 
        combined.includes('숲') ||
        combined.includes('산')
    ) {
        return { icon: <NatureIcon />, bg: "bg-[#EAF2EC]", text: "text-[#2B6A4F]" }; // Forest Green / Sage
    }
    
    // 2. 야장 / 노상 / 포차 (야외 감성 술집/식당)
    if (
        combined.includes('야장') || 
        combined.includes('노상') || 
        combined.includes('포차') || 
        combined.includes('포장마차') || 
        combined.includes('루프탑') ||
        combined.includes('캠핑')
    ) {
        return { icon: <TentIcon />, bg: "bg-[#F3E8FF]", text: "text-[#8B5CF6]" }; // Deep Neon Purple (Midnight vibe)
    }

    if (combined.includes('카페') || combined.includes('디저트') || combined.includes('커피') || combined.includes('베이커리')) {
        return { icon: <CafeIcon />, bg: "bg-[#FFF4EE]", text: "text-[#E65C00]" }; // Warm Terracotta/Peach
    }
    if (combined.includes('식당') || combined.includes('맛집') || combined.includes('레스토랑') || combined.includes('푸드') || combined.includes('음식점') || combined.includes('한식') || combined.includes('양식') || combined.includes('일식') || combined.includes('중식') || combined.includes('키친') || combined.includes('테이블')) {
        return { icon: <RestaurantIcon />, bg: "bg-[#FFF0F0]", text: "text-[#E63939]" }; // Warm Coral/Rose
    }
    if (combined.includes('작업') || combined.includes('노트북') || combined.includes('공부') || combined.includes('스터디') || combined.includes('오피스') || combined.includes('서재') || combined.includes('라운지')) {
        return { icon: <StudyIcon />, bg: "bg-[#F0F6F5]", text: "text-[#2E7D7A]" }; // Cozy Sage/Teal
    }
    if (combined.includes('술집') || combined.includes('바') || combined.includes('펍') || combined.includes('와인') || combined.includes('맥주') || combined.includes('이자카야') || combined.includes('주점')) {
        return { icon: <CocktailIcon />, bg: "bg-[#FFF9E6]", text: "text-[#B38000]" }; // Warm Muted Gold
    }
    return { icon: <SparkleIcon />, bg: "bg-[#F7F6F3]", text: "text-[#7F776F]" }; // Warm Sand/Beige
};

export const isSpecialTag = (tag: string) => {
    const specialTags = ['노트북하기좋은', '콘센트석', '조용한', '대형카페', '단체석', '공부'];
    return specialTags.includes(tag);
};

export const getVibeBadge = (vibeStats: { quiet: number; chatty: number }) => {
    const quiet = vibeStats?.quiet || 0;
    const chatty = vibeStats?.chatty || 0;
    const total = quiet + chatty;
    
    if (total === 0) return null; // 투표가 아예 없을 때 미노출
    
    const quietRatio = quiet / total;
    const chattyRatio = chatty / total;
    
    if (quietRatio >= 0.60) {
        return {
            text: `조용히 집중 (${Math.round(quietRatio * 100)}%)`,
            bg: "bg-[#F0F6F5]/90 text-[#2E7D7A] border-[#D1E6E4]",
            dot: "bg-[#2E7D7A]"
        };
    } else if (chattyRatio >= 0.60) {
        return {
            text: `대화하기 좋은 (${Math.round(chattyRatio * 100)}%)`,
            bg: "bg-[#FFF4EE]/90 text-[#E65C00] border-[#FFD2B8]",
            dot: "bg-[#E65C00]"
        };
    }
    
    return null; // 백중세(60% 미만)일 때는 미노출
};

export const getProfileBgClass = (imgUrl: string = '') => {
    if (imgUrl.includes('bg=sage')) return 'bg-[#F0F6F5]';
    if (imgUrl.includes('bg=peach')) return 'bg-[#FFF4EE]';
    if (imgUrl.includes('bg=sand')) return 'bg-[#F7F6F3]';
    if (imgUrl.includes('bg=coral')) return 'bg-[#FFF0F0]';
    if (imgUrl.includes('bg=silver')) return 'bg-[#F2F4F6]';
    if (imgUrl.includes('bg=bluegray')) return 'bg-[#ECEFF2]';
    if (imgUrl.includes('bg=lavender')) return 'bg-[#F1F0F5]';
    return 'bg-white';
};

export const mapPlaceToData = (place: any) => {
    const tags = place.tags ? place.tags.map((t: any) => t.name) : [];
    const tagInfos = place.tags ? place.tags.map((t: any) => ({ name: t.name, type: t.type })) : [];
    const isHiddenGem = false;
    const initialVibe = place.vibeStats || { quiet: 0, chatty: 0 };
    
    let imageUrls: string[] = [];
    if (Array.isArray(place.imageUrls)) {
        imageUrls = place.imageUrls;
    } else if (typeof place.imageUrls === 'string' && place.imageUrls.trim() !== '') {
        imageUrls = place.imageUrls.split(',').map((url: string) => url.trim()).filter(Boolean);
    }
    
    // 네이버 이미지 CDN 주소를 모달에 적합한 w560_sharpen 고화질 규격으로 일괄 치환
    imageUrls = imageUrls.map((url: string) => {
        if (url.includes('pstatic.net') || url.includes('naver.net')) {
            return url.replace(/type=[a-zA-Z0-9_]+/g, 'type=w560_sharpen');
        }
        return url;
    });

    const finalThumbnail = place.thumbnailUrl && (place.thumbnailUrl.includes('pstatic.net') || place.thumbnailUrl.includes('naver.net'))
        ? place.thumbnailUrl.replace(/type=[a-zA-Z0-9_]+/g, 'type=w560_sharpen')
        : (place.thumbnailUrl || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800");

    if (imageUrls.length === 0) {
        imageUrls = [finalThumbnail];
    }

    return {
        id: place.id,
        name: place.name,
        location: place.address,
        category: place.category,
        subCategory: place.subCategory,
        distance: place.distance,
        imageUrl: finalThumbnail,
        imageUrls: imageUrls,
        aspectRatio: "aspect-[4/5]",
        tags: tags,
        tagInfos: tagInfos,
        isHiddenGem: isHiddenGem,
        initialVibe: initialVibe,
        description: place.aiMoodSummary || place.category || "공간에 대한 설명이 없습니다.",
        features: [{ icon: "✨", title: place.category || "공간", desc: "" }],
        bestReview: "정말 분위기가 좋았어요. 강력 추천합니다!",
        isScrapped: place.isScrapped,
        userVotedVibe: place.userVotedVibe ? place.userVotedVibe.toLowerCase() : null,
        editorsComment: place.editorsComment,
        externalId: place.externalId
    };
};
