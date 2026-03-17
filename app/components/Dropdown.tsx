'use client';

import { useState, useRef, useEffect } from 'react';

interface DropdownProps {
    options: string[];
    value: string;
    onChange: (val: string) => void;
    placeholder: string;
    label: string;
}

export default function Dropdown({ options, value, onChange, placeholder, label }: DropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', position: 'relative' }}>

            <label style={{
                fontSize: '0.6rem',
                color: '#5a9a9a',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
            }}>{label}</label>

            {/* Trigger */}
            <div
                onClick={() => setOpen(!open)}
                style={{
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `1px solid ${open ? '#4a9a9a' : '#2d6a6a'}`,
                    color: value ? '#a8c5c5' : '#3a6a6a',
                    padding: '10px 0',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    letterSpacing: '0.05em',
                    width: '100%',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none',
                }}
            >
                <span>{value || placeholder}</span>
                <span style={{
                    fontSize: '0.5rem',
                    color: '#2d6a6a',
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                }}>▼</span>
            </div>

            {/* Dropdown list */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#080810',
                    border: '1px solid #1a4a4a',
                    zIndex: 100,
                    maxHeight: '180px',
                    overflowY: 'auto',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#2d6a6a #080810',
                }}>
                    {options.map((opt) => (
                        <div
                            key={opt}
                            onClick={() => {
                                onChange(opt);
                                setOpen(false);
                            }}
                            style={{
                                padding: '10px 12px',
                                fontFamily: 'var(--font-mono)',
                                fontSize: '0.72rem',
                                color: opt === value ? '#a8c5c5' : '#5a8a8a',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                background: opt === value ? 'rgba(45, 106, 106, 0.2)' : 'transparent',
                                borderBottom: '1px solid #0a1a1a',
                                transition: 'background 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = 'rgba(45, 106, 106, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLDivElement).style.background = opt === value ? 'rgba(45, 106, 106, 0.2)' : 'transparent';
                            }}
                        >
                            {opt}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}