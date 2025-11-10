import React, { useRef } from "react";
import { motion } from "framer-motion";
import LeaderboardButton from "./LeaderboardButton";
import ContestButton from "./ContestButton";
import ProgressButton from "./ProgressButton";
import { useNavigate } from 'react-router-dom';

function HomePage(){
    const navigate = useNavigate();
    const blobRef = useRef(null);

    function onStartCoding(){
        navigate('/login');
    }

    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem',
        boxSizing: 'border-box',
        background: 'linear-gradient(135deg, #0f172a 0%, #0b3a6b 40%, #143c71 100%)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 16
    };

    const glassCard = {
        backdropFilter: 'blur(10px)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 8px 30px rgba(2,6,23,0.6)',
        maxWidth: '1100px',
        width: '100%'
    };

    const heroGrid = {
        display: 'grid',
        gridTemplateColumns: '1fr 420px',
        gap: '2rem',
        alignItems: 'center'
    };

    const headingStyle = { margin: 0, fontSize: '2.25rem', lineHeight: 1.05};
    const subStyle = { marginTop: '0.75rem', color: 'rgba(255,255,255,0.85)', fontSize: '1.05rem' };

    const ctaStyle = {
        marginTop: '1.5rem',
        display: 'inline-flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center'
    };

    const primaryBtn = {
        background: 'linear-gradient(90deg,#60a5fa,#3b82f6)',
        border: 'none',
        color: '#06243a',
        padding: '0.8rem 1.25rem',
        borderRadius: '10px',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 6px 18px rgba(59,130,246,0.25)'
    };

    const secondaryBtn = {
        background: 'transparent',
        color: 'rgba(255,255,255,0.9)',
        border: '1px solid rgba(255,255,255,0.08)',
        padding: '0.6rem 1rem',
        borderRadius: '8px',
        cursor: 'pointer'
    };

    const blob = {
        position: 'absolute',
        right: '-10%',
        top: '-10%',
        width: '720px',
        height: '720px',
        background: 'radial-gradient(circle at 30% 30%, rgba(96,165,250,0.18), rgba(59,130,246,0.06) 30%, transparent 55%), radial-gradient(circle at 70% 70%, rgba(139,92,246,0.12), transparent 40%)',
        filter: 'blur(80px)',
        transform: 'translateZ(0)',
        zIndex: 0
    };

    const cardRight = {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
    };

    return (
        <div style={containerStyle}>
            <motion.div ref={blobRef} style={blob}
                animate={{ x: [0, -30, 0], y: [0, 20, 0], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />

            <div style={glassCard}>
                <div style={heroGrid}>
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}>
                        <h1 style={headingStyle}>Welcome to CodeRanker</h1>
                        <p style={subStyle}>Track and showcase your coding progress across platforms like LeetCode and Codeforces. Climb the college leaderboard, join weekly contests, and celebrate progress.</p>

                        <div style={ctaStyle}>
                            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={primaryBtn} onClick={onStartCoding}>Start Coding</motion.button>
                        </div>
                    </motion.div>

                    <motion.aside style={cardRight}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}>

                        <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01))', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.05rem' }}>Quick Actions</h3>
                            <p style={{ marginTop: '0.5rem', marginBottom: '0.6rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Jump to common pages and start participating.</p>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                <LeaderboardButton />
                                <ContestButton />
                                <ProgressButton />
                            </div>
                        </div>

                        <div style={{ marginTop: '0.6rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01))', padding: '0.9rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                            <h4 style={{ margin: 0 }}>Upcoming</h4>
                            <p style={{ marginTop: '0.5rem', color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>Weekly contest: Friday · 6 PM</p>
                            <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem' }}>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...secondaryBtn, padding: '0.5rem 0.7rem', fontSize: '0.85rem' }} onClick={() => navigate('/weeklycontest')}>See Details</motion.button>
                                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ ...primaryBtn, padding: '0.5rem 0.7rem', fontSize: '0.85rem' }} onClick={() => navigate('/login')}>Join Now</motion.button>
                            </div>
                        </div>

                    </motion.aside>
                </div>
            </div>
        </div>
    );
}

export default HomePage;
