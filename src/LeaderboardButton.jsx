import React from 'react';
import './LeaderboardButton.css';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const LeaderboardButton = () => {
    const navigate = useNavigate();

    return (
        <>
            <motion.button className="leaderboard-btn"
                    whileHover = {{scale: 1.05, y: -2}}
                    whileTap = {{scale: 0.98}}
                    transition = {{type:"tween", stiffness:250}}
                    onClick={() => navigate('/leaderboard')}
            >
                <svg className="trophy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M6 9v3a6 6 0 0 0 12 0V9M6 9h12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 18v3m-4 0h8" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style = {{fontFamily: "Rubik"}}>LEADERBOARD</span>
            </motion.button>
        </>
    );
}

export default LeaderboardButton;