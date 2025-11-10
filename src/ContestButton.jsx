import React from "react";
import './ContestButton.css';
import { motion } from "framer-motion";
import { useNavigate } from 'react-router-dom';

const ContestButton = ()=>{
    const navigate = useNavigate();
    return (
        <>
            <motion.button className = "contest-btn"
                    whileHover = {{scale: 1.05, y: -2}}
                    whileTap = {{scale: 0.98}}
                    transition = {{type:"tween", stiffness:250}}
                    onClick={() => navigate('/weeklycontest')}
            >
                <svg className="contest-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round"/>
                </svg>
                <span style = {{fontFamily: "Rubik"}}>CONTESTS</span>
            </motion.button>
        </>
    );
}

export default ContestButton;