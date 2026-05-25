import React from 'react';

export default function DraggableScroll({ children, className }: { children: React.ReactNode, className?: string }) {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const isDown = React.useRef(false);
    const startX = React.useRef(0);
    const scrollLeft = React.useRef(0);
    const isDragging = React.useRef(false);

    const onMouseDown = (e: React.MouseEvent) => {
        isDown.current = true;
        isDragging.current = false;
        startX.current = e.pageX - (scrollRef.current?.offsetLeft || 0);
        scrollLeft.current = scrollRef.current?.scrollLeft || 0;
    };
    const onMouseLeave = () => { isDown.current = false; };
    const onMouseUp = () => { isDown.current = false; };
    const onMouseMove = (e: React.MouseEvent) => {
        if (!isDown.current || !scrollRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollRef.current.offsetLeft;
        const walk = (x - startX.current) * 2;
        if (Math.abs(walk) > 5) isDragging.current = true;
        scrollRef.current.scrollLeft = scrollLeft.current - walk;
    };

    const onClickCapture = (e: React.MouseEvent) => {
        if (isDragging.current) {
            e.stopPropagation();
            e.preventDefault();
        }
    };

    return (
        <div 
            ref={scrollRef}
            onMouseDown={onMouseDown}
            onMouseLeave={onMouseLeave}
            onMouseUp={onMouseUp}
            onMouseMove={onMouseMove}
            onClickCapture={onClickCapture}
            className={`cursor-grab active:cursor-grabbing ${className || ''}`}
        >
            {children}
        </div>
    );
}
